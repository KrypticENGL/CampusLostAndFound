import Link from "next/link";
import type { Stats } from "@/lib/items";

/** Lost vs found per category — plain CSS bars driven by live DB counts. */
export function CategoryChart({ stats }: { stats: Stats }) {
  const max = Math.max(1, ...stats.byCategory.map((c) => c.lost + c.found));
  const openTotal = stats.lost + stats.found;
  const lostPct = openTotal ? Math.round((stats.lost / openTotal) * 100) : 0;

  return (
    <section aria-labelledby="chart-heading" className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="chart-heading" className="font-semibold">
            Open listings by category
          </h2>
          <p className="text-xs text-muted-foreground">Click a category to filter</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-lost" /> Lost
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-found" /> Found
          </span>
        </div>
      </div>

      {/* Overall split */}
      <div className="mt-4">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${stats.lost} lost and ${stats.found} found open listings`}>
          <div className="bg-lost transition-all" style={{ width: `${lostPct}%` }} />
          <div className="bg-found transition-all" style={{ width: `${openTotal ? 100 - lostPct : 0}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>{lostPct}% lost</span>
          <span>{openTotal ? 100 - lostPct : 0}% found</span>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {stats.byCategory.map((c) => (
          <li key={c.category}>
            <Link
              href={`/?category=${c.category}#listings`}
              scroll={false}
              className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 rounded-md text-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              aria-label={`${c.label}: ${c.lost} lost, ${c.found} found`}
            >
              <span className="truncate text-muted-foreground">{c.label}</span>
              <span className="flex h-2 overflow-hidden rounded-full bg-muted">
                <span className="bg-lost" style={{ width: `${(c.lost / max) * 100}%` }} />
                <span className="bg-found" style={{ width: `${(c.found / max) * 100}%` }} />
              </span>
              <span className="text-right text-xs tabular-nums text-muted-foreground">{c.lost + c.found}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
