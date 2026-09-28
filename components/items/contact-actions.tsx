"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CheckCircle2, Copy, HandHeart, Loader2, Mail, Phone, RotateCcw, SearchCheck } from "lucide-react";
import type { ItemDetail } from "@/lib/items";
import { Button } from "@/components/ui/button";

export function contactHref(item: ItemDetail): string {
  if (item.contactType === "PHONE") return `tel:${item.contactValue}`;
  const subject =
    item.itemType === "LOST" ? `I may have found your ${item.name}` : `About the ${item.name} you found`;
  const body =
    item.itemType === "LOST"
      ? `Hi${item.contactName ? ` ${item.contactName}` : ""},\n\nI saw your Campus Lost & Found listing for "${item.name}" (${item.location}). I think I may have found it. Can you describe it so we can confirm?\n\nThanks!`
      : `Hi${item.contactName ? ` ${item.contactName}` : ""},\n\nI saw your Campus Lost & Found listing for "${item.name}" found at ${item.location}. I believe it's mine — here are some identifying details:\n\n`;
  return `mailto:${item.contactValue}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactActions({ item, canManage }: { item: ItemDetail; canManage: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const isLost = item.itemType === "LOST";
  const resolved = item.status === "RESOLVED";
  const ContactIcon = item.contactType === "EMAIL" ? Mail : Phone;

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.contactValue);
      setCopied(true);
      toast.success("Contact copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — please copy it manually");
    }
  }

  async function toggleResolved() {
    setSaving(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: resolved ? "OPEN" : "RESOLVED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success(resolved ? "Listing reopened" : "Marked as reunited 🎉", {
        description: resolved ? "It's visible on the board again." : "It's been removed from active listings and matching.",
      });
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const foundPrefill = new URLSearchParams({
    type: "FOUND",
    name: item.name,
    category: item.category,
    location: item.location,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {isLost ? "Owner" : "Finder"}
        </p>
        <p className="mt-1 font-medium">{item.contactName ?? "Anonymous student"}</p>
        <div className="mt-2 flex items-center gap-2">
          <ContactIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm">{item.contactValue}</span>
          <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy contact">
            {copied ? <Check className="text-found" /> : <Copy />}
          </Button>
        </div>
      </div>

      {!resolved && (
        <Button asChild size="lg" className="h-11 w-full text-base">
          <a href={contactHref(item)}>
            {isLost ? <HandHeart /> : <ContactIcon />}
            {isLost ? "I Found This" : "Contact Finder"}
          </a>
        </Button>
      )}

      {isLost && !resolved && (
        <Button asChild variant="outline" className="h-10 w-full">
          <Link href={`/report?${foundPrefill}`}>
            <SearchCheck /> Post it as a found item
          </Link>
        </Button>
      )}

      {canManage && (
        <Button variant={resolved ? "outline" : "secondary"} className="h-10 w-full" onClick={toggleResolved} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : resolved ? <RotateCcw /> : <CheckCircle2 />}
          {resolved ? "Reopen listing" : "Mark as reunited"}
        </Button>
      )}
      <p className="text-center text-xs text-muted-foreground">
        {item.contactType === "EMAIL" ? "Opens your email app with a pre-written message." : "Opens your phone dialer."}
      </p>
    </div>
  );
}
