import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReportForm, type ReportDefaults } from "@/components/forms/report-form";
import { categorySchema, itemTypeSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Report an item" };

export default async function ReportPage({ searchParams }: PageProps<"/report">) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 80) : undefined);

  // Prefill support, e.g. "I found this" on a lost listing → /report?type=FOUND&name=…&category=…
  const defaults: ReportDefaults = {
    itemType: itemTypeSchema.safeParse(sp.type).data,
    category: categorySchema.safeParse(sp.category).data,
    name: str(sp.name),
    location: str(sp.location),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to listings
      </Link>
      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Report an item</h1>
        <p className="mt-1.5 text-muted-foreground">
          Takes about a minute. We&apos;ll instantly check it against existing listings for potential matches.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
        <ReportForm defaults={defaults} />
      </div>
    </div>
  );
}
