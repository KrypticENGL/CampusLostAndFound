import { Suspense } from "react";
import { getStats } from "@/lib/items";
import { OpenListingsCard, RecoveryCard } from "@/components/dashboard/stats-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { ListingExplorer } from "@/components/items/listing-explorer";
import { ItemCardSkeleton } from "@/components/items/item-card";

// Counters and chart are computed from the database on every request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
      <h1 className="sr-only">Campus Lost &amp; Found overview</h1>
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        <OpenListingsCard stats={stats} />
        <CategoryChart stats={stats} />
        <RecoveryCard stats={stats} />
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 rounded-3xl bg-card p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
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
