import type { Category, ItemType } from "@prisma/client";
import {
  BookOpen,
  Briefcase,
  FileText,
  Headphones,
  Package,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, ITEM_TYPE_LABEL } from "@/lib/constants";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  ELECTRONICS: Headphones,
  DOCUMENTS: FileText,
  ACCESSORIES: Watch,
  BOOKS: BookOpen,
  BAGS: Briefcase,
  OTHER: Package,
};

export function TypeBadge({ type, className }: { type: ItemType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        type === "LOST" ? "bg-lost-soft text-lost" : "bg-found-soft text-found",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", type === "LOST" ? "bg-lost" : "bg-found")}
      />
      {ITEM_TYPE_LABEL[type]}
    </span>
  );
}

export function CategoryIcon({
  category,
  type,
  className,
}: {
  category: Category;
  type: ItemType;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span
      aria-label={CATEGORY_LABEL[category]}
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        type === "LOST" ? "bg-lost-soft text-lost" : "bg-found-soft text-found",
        className ?? "size-10",
      )}
    >
      <Icon className="size-[45%]" aria-hidden />
    </span>
  );
}
