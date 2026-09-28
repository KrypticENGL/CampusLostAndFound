import Link from "next/link";
import { Crown } from "lucide-react";
import type { Stats } from "@/lib/items";
import { DashCard, Pill } from "./stats-cards";

/** "Net Revenue Growth" card → potential matches, plus lost vs found per category (click to filter). */
export function CategoryChart({ stats }: { stats: Stats }) {
  const max = Math.max(1, ...stats.byCategory.flatMap((c) => [c.lost, c.found]));

  return (
    <DashCard
      icon={Crown}
      label="Potential matches"
      labelledBy="chart-heading"
      aside={
        <span className="flex items-center gap-3 text-xs" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-navy" /> Lost
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-gold" /> Found
          </span>
        </span>
      }
    >
      <div className="mt-6 flex items-center gap-2.5">
        <span className="text-5xl font-medium tracking-tight tabular-nums">{stats.potentialMatches}</span>
        <Pill>lost ↔ found</Pill>
        <DotBurst className="ml-auto size-8 text-gold" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Pairs our matcher thinks belong together</p>

      <ul className="mt-6 space-y-3">
        {stats.byCategory.map((c) => (
          <li key={c.category}>
            <Link
              href={`/?category=${c.category}#listings`}
              scroll={false}
              className="group grid grid-cols-[5.75rem_1fr_1.75rem] items-center gap-3 rounded-md text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              aria-label={`${c.label}: ${c.lost} lost, ${c.found} found`}
            >
              <span className="truncate text-muted-foreground group-hover:text-foreground">{c.label}</span>
              <span className="grid gap-1">
                <span className="h-1.5 rounded-full bg-navy transition-all" style={{ width: `${Math.max(2, (c.lost / max) * 100)}%`, opacity: c.lost ? 1 : 0.25 }} />
                <span className="h-1.5 rounded-full bg-gold transition-all" style={{ width: `${Math.max(2, (c.found / max) * 100)}%`, opacity: c.found ? 1 : 0.25 }} />
              </span>
              <span className="text-right text-xs tabular-nums text-muted-foreground">{c.lost + c.found}</span>
            </Link>
          </li>
        ))}
      </ul>
    </DashCard>
  );
}

/** Dotted sunburst from the reference, drawn as SVG so it follows currentColor. */
function DotBurst({ className }: { className?: string }) {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [
      { x: 16 + Math.cos(a) * 13, y: 16 + Math.sin(a) * 13, r: 1.6 },
      { x: 16 + Math.cos(a) * 7.5, y: 16 + Math.sin(a) * 7.5, r: 1.9 },
    ];
  }).flat();
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="currentColor" />
      ))}
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
    </svg>
  );
}
