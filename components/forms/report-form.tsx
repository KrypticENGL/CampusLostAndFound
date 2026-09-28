"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, Phone, Send } from "lucide-react";
import type { Category, ItemType } from "@prisma/client";
import { CATEGORIES, LOCATION_SUGGESTIONS } from "@/lib/constants";
import { toDateInputValue } from "@/lib/dates";
import { createItemSchema, fieldErrors, type CreateItemInput } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_ICON } from "@/components/items/item-meta";

type FormState = Omit<CreateItemInput, "category" | "contactName"> & { category: Category | ""; contactName: string };
type Errors = Partial<Record<keyof FormState | "form", string>>;

export interface ReportDefaults {
  itemType?: ItemType;
  name?: string;
  category?: Category;
  location?: string;
  contactName?: string;
  contactValue?: string;
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-lost" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ReportForm({ defaults }: { defaults: ReportDefaults }) {
  const router = useRouter();
  const today = toDateInputValue();
  const [form, setForm] = useState<FormState>({
    itemType: defaults.itemType ?? "LOST",
    name: defaults.name ?? "",
    category: defaults.category ?? "",
    location: defaults.location ?? "",
    date: today,
    description: "",
    contactName: defaults.contactName ?? "",
    contactType: "EMAIL",
    contactValue: defaults.contactValue ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const validate = (next: FormState) => {
    const res = createItemSchema.safeParse(next);
    return res.success ? {} : (fieldErrors(res.error) as Errors);
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...form, [key]: value };
    // Switching contact method invalidates the previous value's format; re-check it.
    setForm(next);
    if (touched.size) {
      const all = validate(next);
      setErrors((prev) => {
        const out: Errors = {};
        for (const k of Object.keys(prev) as (keyof Errors)[]) if (all[k]) out[k] = all[k];
        if (touched.has(key) && all[key]) out[key] = all[key];
        return out;
      });
    }
  };

  const blur = (key: keyof FormState) => {
    setTouched((t) => new Set(t).add(key));
    const all = validate(form);
    setErrors((prev) => ({ ...prev, [key]: all[key] }));
  };

  const aria = (key: keyof FormState) => ({
    "aria-invalid": !!errors[key] || undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
    onBlur: () => blur(key),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors = validate(form);
    setTouched(new Set(Object.keys(form)));
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      toast.error("Please fix the highlighted fields");
      const first = Object.keys(clientErrors)[0];
      document.getElementById(first)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error ?? "Could not publish listing");
      }
      const matches: number = data.matchCount ?? 0;
      toast.success("Listing published", {
        description: matches
          ? `We found ${matches} potential ${matches === 1 ? "match" : "matches"} for your item!`
          : "We'll show it to everyone browsing the board.",
        action: { label: "View", onClick: () => router.push(`/items/${data.item.id}`) },
      });
      router.push(`/?highlight=${data.item.id}#listings`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setSubmitting(false);
    }
  }

  const isLost = form.itemType === "LOST";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {/* Type */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          What happened?<span className="text-lost" aria-hidden>*</span>
        </legend>
        <div role="radiogroup" className="grid grid-cols-2 gap-3">
          {(["LOST", "FOUND"] as const).map((t) => {
            const active = form.itemType === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update("itemType", t)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active
                    ? t === "LOST"
                      ? "border-lost bg-lost-soft"
                      : "border-found bg-found-soft"
                    : "border-border hover:border-muted-foreground/30",
                )}
              >
                <span className={cn("block font-semibold", active && (t === "LOST" ? "text-lost" : "text-found"))}>
                  {t === "LOST" ? "I lost something" : "I found something"}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t === "LOST" ? "We'll look for matching found items" : "Help the owner find it"}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Item */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Item name" required error={errors.name} hint="Short and specific, e.g. “Black leather wallet”">
          <Input id="name" value={form.name} maxLength={80} onChange={(e) => update("name", e.target.value)} placeholder="Black wallet" {...aria("name")} />
        </Field>
        <Field id="category" label="Category" required error={errors.category}>
          <Select
            value={form.category}
            onValueChange={(v) => {
              update("category", v as Category);
              setTouched((t) => new Set(t).add("category"));
              setErrors((p) => ({ ...p, category: undefined }));
            }}
          >
            <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.category || undefined}>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICON[c.value];
                return (
                  <SelectItem key={c.value} value={c.value}>
                    <Icon className="text-muted-foreground" /> {c.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Field>

        <Field id="location" label={isLost ? "Where did you lose it?" : "Where did you find it?"} required error={errors.location}>
          <Input id="location" list="location-options" value={form.location} maxLength={80} onChange={(e) => update("location", e.target.value)} placeholder="Library, Canteen, Block A…" {...aria("location")} />
          <datalist id="location-options">
            {LOCATION_SUGGESTIONS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {LOCATION_SUGGESTIONS.slice(0, 6).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => update("location", l)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:border-primary/40 hover:text-foreground",
                  form.location === l ? "border-primary/50 bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>

        <Field id="date" label={isLost ? "Date lost" : "Date found"} required error={errors.date}>
          <Input id="date" type="date" value={form.date} max={today} onChange={(e) => update("date", e.target.value)} {...aria("date")} />
        </Field>

        <div className="sm:col-span-2">
          <Field
            id="description"
            label="Description"
            required
            error={errors.description}
            hint="Colour, brand, stickers, what's inside — details help us find a match."
          >
            <Textarea
              id="description"
              rows={4}
              maxLength={1000}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder={isLost ? "Black leather bifold wallet with my ID and a metro card…" : "Found near the billing counter, has a metro card inside…"}
              {...aria("description")}
            />
          </Field>
          <p className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">{form.description.length}/1000</p>
        </div>
      </div>

      {/* Contact */}
      <fieldset className="rounded-xl border bg-muted/30 p-4 sm:p-5">
        <legend className="px-1 text-sm font-medium">Contact information</legend>
        <p className="mb-4 text-xs text-muted-foreground">
          Shown on your listing so {isLost ? "a finder" : "the owner"} can reach you. No account needed.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="contactName" label="Your name" error={errors.contactName} hint="Optional">
            <Input id="contactName" value={form.contactName} maxLength={60} onChange={(e) => update("contactName", e.target.value)} placeholder="Aarav Mehta" autoComplete="name" {...aria("contactName")} />
          </Field>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">
              Contact via<span className="text-lost" aria-hidden>*</span>
            </span>
            <div role="radiogroup" aria-label="Contact method" className="grid grid-cols-2 gap-1 rounded-lg border bg-card p-1">
              {(["EMAIL", "PHONE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={form.contactType === t}
                  onClick={() => update("contactType", t)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md py-1 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    form.contactType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "EMAIL" ? <Mail className="size-3.5" /> : <Phone className="size-3.5" />}
                  {t === "EMAIL" ? "Email" : "Phone"}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Field id="contactValue" label={form.contactType === "EMAIL" ? "Email address" : "Phone number"} required error={errors.contactValue}>
              <Input
                id="contactValue"
                type={form.contactType === "EMAIL" ? "email" : "tel"}
                inputMode={form.contactType === "EMAIL" ? "email" : "tel"}
                autoComplete={form.contactType === "EMAIL" ? "email" : "tel"}
                value={form.contactValue}
                onChange={(e) => update("contactValue", e.target.value)}
                placeholder={form.contactType === "EMAIL" ? "you@campus.edu" : "+91 98765 43210"}
                {...aria("contactValue")}
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="text-lost">*</span> Required fields
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" size="lg" className="h-10 flex-1 px-4 sm:flex-none" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="h-10 flex-1 px-5 sm:flex-none" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <Send />}
            {submitting ? "Publishing…" : "Submit listing"}
          </Button>
        </div>
      </div>
    </form>
  );
}
