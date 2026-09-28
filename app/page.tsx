import { Suspense } from "react";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { getStats } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { RecoveryNote, StatsCards } from "@/components/dashboard/stats-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { ListingExplorer } from "@/components/items/listing-explorer";
import { ItemCardSkeleton } from "@/components/items/item-card";

// Counters and chart are computed from the database on every request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <section className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-stretch">
        <div className="flex flex-col justify-between gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="size-3.5" aria-hidden /> Smart lost ↔ found matching
            </span>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold text-balance sm:text-4xl">
              Lost something on campus? Let&apos;s get it back.
            </h1>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Report a lost or found item in under a minute. We automatically compare new listings and
              surface likely matches, so owners and finders connect faster.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-10 px-4">
              <Link href="/report?type=LOST">
                <Plus /> I lost something
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-10 px-4">
              <Link href="/report?type=FOUND">I found something</Link>
            </Button>
            <RecoveryNote stats={stats} />
          </div>
        </div>
        <CategoryChart stats={stats} />
      </section>

      <StatsCards stats={stats} />

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ListingExplorer />
      </Suspense>
    </div>
  );
}
