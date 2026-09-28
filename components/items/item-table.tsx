import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ItemSummary } from "@/lib/items";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CategoryIcon, TypeBadge } from "./item-meta";

const COLUMNS = ["Item", "Status", "Category", "Location", "Date", "Reported", "Matches"];

/** Desktop listing view, styled after the reference's "Product Overview" table. */
export function ItemTable({
  items,
  highlight,
  className,
}: {
  items: ItemSummary[];
  highlight?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-muted-foreground">
            {COLUMNS.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={cn(
                  "bg-panel px-4 py-3 font-normal",
                  i === 0 && "rounded-l-xl",
                  i === COLUMNS.length - 1 && "rounded-r-xl text-right",
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={cn(
                "group relative border-b border-border/70 transition-colors last:border-0 hover:bg-panel",
                item.id === highlight && "bg-lime-soft/60 animate-in fade-in duration-500",
                item.status === "RESOLVED" && "text-muted-foreground",
              )}
            >
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={item.category} type={item.itemType} className="size-8 rounded-lg" />
                  <Link
                    href={`/items/${item.id}`}
                    className="max-w-56 truncate font-medium after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:rounded-xl after:focus-visible:ring-3 after:focus-visible:ring-ring/50"
                  >
                    {item.name}
                  </Link>
                  {item.id === highlight && (
                    <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3.5">
                {item.status === "RESOLVED" ? (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">Resolved</span>
                ) : (
                  <TypeBadge type={item.itemType} />
                )}
              </td>
              <td className="px-4 py-3.5">{CATEGORY_LABEL[item.category]}</td>
              <td className="max-w-40 truncate px-4 py-3.5">{item.location}</td>
              <td className="px-4 py-3.5 whitespace-nowrap tabular-nums">{formatDate(item.date)}</td>
              <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">{formatRelative(item.createdAt)}</td>
              <td className="px-4 py-3.5 text-right">
                {item.matchCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                    <Sparkles className="size-3" aria-hidden /> {item.matchCount}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
