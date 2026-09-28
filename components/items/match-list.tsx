import Link from "next/link";
import { Check, ChevronRight, MapPin, CalendarDays, SearchX, X } from "lucide-react";
import type { ItemType } from "@prisma/client";
import type { MatchDTO } from "@/lib/items";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./item-meta";
import { EmptyState } from "./empty-state";

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const tone = score >= 75 ? "text-found" : score >= 55 ? "text-primary" : "text-amber-500";
  return (
    <div className="relative grid size-14 shrink-0 place-items-center" role="img" aria-label={`${score}% match`}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className={cn("stroke-current", tone)}
        />
      </svg>
      <span className="text-sm font-semibold tabular-nums">{score}%</span>
    </div>
  );
}

export function MatchList({ matches, targetType }: { matches: MatchDTO[]; targetType: ItemType }) {
  const other = targetType === "LOST" ? "found" : "lost";

  if (!matches.length) {
    return (
      <EmptyState
        icon={SearchX}
        title="No potential matches yet"
        description={`We'll compare every new ${other} listing against this one. Check back soon.`}
        className="py-10"
      />
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map((m) => (
        <li key={m.item.id}>
          <Link
            href={`/items/${m.item.id}`}
            className="group block rounded-2xl border bg-card p-4 shadow-xs transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="flex items-center gap-4">
              <ScoreRing score={m.score} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {m.score >= 75 ? "Strong potential match" : "Potential match"}
                </p>
                <p className="truncate font-semibold">{m.item.name}</p>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden /> {m.item.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3" aria-hidden /> {formatDate(m.item.date)}
                  </span>
                </div>
              </div>
              <CategoryIcon category={m.item.category} type={m.item.itemType} className="hidden size-9 sm:grid" />
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Why this matches">
              {m.reasons.map((r) => (
                <li
                  key={r.label}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                    r.met ? "bg-found-soft text-found" : "bg-muted text-muted-foreground line-through decoration-muted-foreground/40",
                  )}
                >
                  {r.met ? <Check className="size-3" aria-hidden /> : <X className="size-3" aria-hidden />}
                  {r.label}
                  <span className="sr-only">{r.met ? "(yes)" : "(no)"}</span>
                </li>
              ))}
            </ul>
          </Link>
        </li>
      ))}
    </ul>
  );
}
