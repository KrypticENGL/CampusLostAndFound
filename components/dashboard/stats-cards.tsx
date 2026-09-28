import Link from "next/link";
import { CheckCircle2, Layers, SearchCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { Stats } from "@/lib/items";
import { cn } from "@/lib/utils";

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total listings", value: stats.total, hint: `${stats.resolved} resolved`, icon: Layers, href: "/?includeResolved=true#listings", tone: "text-primary bg-accent" },
    { label: "Lost items", value: stats.lost, hint: "Still searching", icon: TriangleAlert, href: "/?status=LOST#listings", tone: "text-lost bg-lost-soft" },
    { label: "Found items", value: stats.found, hint: "Waiting for owners", icon: SearchCheck, href: "/?status=FOUND#listings", tone: "text-found bg-found-soft" },
    { label: "Potential matches", value: stats.potentialMatches, hint: "Lost ↔ found pairs", icon: Sparkles, href: "/?status=LOST#listings", tone: "text-primary bg-accent" },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <li key={c.label}>
          <Link
            href={c.href}
            scroll={false}
            className="group flex h-full flex-col rounded-2xl border bg-card p-4 shadow-xs transition-all hover:border-primary/30 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">{c.label}</span>
              <span className={cn("grid size-8 place-items-center rounded-lg", c.tone)}>
                <c.icon className="size-4" aria-hidden />
              </span>
            </div>
            <span className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">{c.value}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">{c.hint}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RecoveryNote({ stats }: { stats: Stats }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <CheckCircle2 className="size-3.5 text-found" aria-hidden />
      {stats.resolved} {stats.resolved === 1 ? "item" : "items"} reunited with their owners
    </p>
  );
}
