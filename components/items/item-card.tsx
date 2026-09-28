import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { ItemSummary } from "@/lib/items";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CategoryIcon, TypeBadge } from "./item-meta";

export function ItemCard({ item, highlight = false }: { item: ItemSummary; highlight?: boolean }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        highlight && "ring-2 ring-primary/60 animate-in fade-in zoom-in-95 duration-500",
      )}
    >
      <div className="flex items-start gap-3">
        <CategoryIcon category={item.category} type={item.itemType} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeBadge type={item.itemType} />
            {highlight && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                New
              </span>
            )}
            {item.status === "RESOLVED" && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Resolved
              </span>
            )}
          </div>
          <h3 className="mt-1.5 truncate text-base font-semibold">{item.name}</h3>
          <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[item.category]}</p>
        </div>
        <ArrowUpRight
          aria-hidden
          className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden />
          {item.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden />
          {formatDate(item.date)}
        </span>
        <span className="ml-auto">{formatRelative(item.createdAt)}</span>
      </div>

      {item.matchCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3.5" aria-hidden />
          {item.matchCount} potential {item.matchCount === 1 ? "match" : "matches"}
        </div>
      )}
    </Link>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5" aria-hidden>
      <div className="flex gap-3">
        <div className="size-10 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-5 h-3 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  );
}
