import type { Category, ItemType } from "@prisma/client";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "DOCUMENTS", label: "Documents" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "BOOKS", label: "Books" },
  { value: "BAGS", label: "Bags" },
  { value: "OTHER", label: "Other" },
];

export const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<Category, string>;

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  LOST: "Lost",
  FOUND: "Found",
};

export const LOCATION_SUGGESTIONS = [
  "Library",
  "Block A",
  "Block B",
  "Canteen",
  "Auditorium",
  "Parking",
  "Hostel",
  "Sports Ground",
  "Lab Complex",
  "Other",
];

/** Minimum score (0–100) for a pair to be surfaced as a potential match. */
export const MATCH_THRESHOLD = 40;
