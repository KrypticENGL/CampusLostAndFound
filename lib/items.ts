import "server-only";
import type { Category, Item, Prisma } from "@prisma/client";
import { db } from "./db";
import { CATEGORIES, CATEGORY_LABEL } from "./constants";
import { parseDateOnly } from "./dates";
import { findMatches, scoreMatch, type Matchable, type MatchReason } from "./matching";
import { MATCH_THRESHOLD } from "./constants";
import { normalizePhone, type CreateItemInput, type ListQuery } from "./validation";

/** Public shape for listing cards — contact details are only exposed on the detail endpoint. */
export interface ItemSummary {
  id: string;
  itemType: Item["itemType"];
  status: Item["status"];
  name: string;
  category: Category;
  location: string;
  date: string;
  description: string;
  createdAt: string;
  matchCount: number;
}

export interface ItemDetail extends Omit<ItemSummary, "matchCount"> {
  contactName: string | null;
  contactType: Item["contactType"];
  contactValue: string;
  updatedAt: string;
}

export interface MatchDTO {
  item: ItemSummary;
  score: number;
  reasons: MatchReason[];
}

export interface Stats {
  total: number;
  lost: number;
  found: number;
  resolved: number;
  potentialMatches: number;
  byCategory: { category: Category; label: string; lost: number; found: number }[];
}

const matchableSelect = {
  id: true,
  itemType: true,
  name: true,
  category: true,
  location: true,
  date: true,
  description: true,
} satisfies Prisma.ItemSelect;

function toSummary(item: Item, matchCount = 0): ItemSummary {
  return {
    id: item.id,
    itemType: item.itemType,
    status: item.status,
    name: item.name,
    category: item.category,
    location: item.location,
    date: item.date.toISOString(),
    description: item.description,
    createdAt: item.createdAt.toISOString(),
    matchCount,
  };
}

function toDetail(item: Item): ItemDetail {
  const { matchCount: _unused, ...summary } = toSummary(item);
  void _unused;
  return {
    ...summary,
    contactName: item.contactName,
    contactType: item.contactType,
    contactValue: item.contactValue,
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function openMatchables(): Promise<Matchable[]> {
  return db.item.findMany({ where: { status: "OPEN" }, select: matchableSelect });
}

/** Count, for every open listing, how many opposite-type listings clear the match threshold. */
function matchCounts(items: Matchable[]): { perItem: Map<string, number>; pairs: number } {
  const lost = items.filter((i) => i.itemType === "LOST");
  const found = items.filter((i) => i.itemType === "FOUND");
  const perItem = new Map<string, number>();
  let pairs = 0;
  for (const l of lost) {
    for (const f of found) {
      if (scoreMatch(l, f).score >= MATCH_THRESHOLD) {
        pairs++;
        perItem.set(l.id, (perItem.get(l.id) ?? 0) + 1);
        perItem.set(f.id, (perItem.get(f.id) ?? 0) + 1);
      }
    }
  }
  return { perItem, pairs };
}

function buildWhere(query: ListQuery): Prisma.ItemWhereInput {
  const and: Prisma.ItemWhereInput[] = [];
  if (!query.includeResolved) and.push({ status: "OPEN" });
  if (query.status !== "ALL") and.push({ itemType: query.status });
  if (query.category !== "ALL") and.push({ category: query.category });

  // Every search word must appear in at least one searchable field (SQLite LIKE is case-insensitive for ASCII).
  const words = query.search.split(/\s+/).filter(Boolean).slice(0, 8);
  for (const word of words) {
    const lower = word.toLowerCase();
    const categoryHits = CATEGORIES.filter((c) => c.label.toLowerCase().includes(lower)).map((c) => c.value);
    and.push({
      OR: [
        { name: { contains: word } },
        { description: { contains: word } },
        { location: { contains: word } },
        ...(categoryHits.length ? [{ category: { in: categoryHits } }] : []),
      ],
    });
  }
  return { AND: and };
}

const ORDER: Record<ListQuery["sort"], Prisma.ItemOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  date: [{ date: "desc" }, { createdAt: "desc" }],
};

export async function listItems(query: ListQuery): Promise<ItemSummary[]> {
  const [items, all] = await Promise.all([
    db.item.findMany({ where: buildWhere(query), orderBy: ORDER[query.sort], take: 200 }),
    openMatchables(),
  ]);
  const { perItem } = matchCounts(all);
  return items.map((i) => toSummary(i, i.status === "OPEN" ? perItem.get(i.id) ?? 0 : 0));
}

export async function getItem(id: string): Promise<ItemDetail | null> {
  const item = await db.item.findUnique({ where: { id } });
  return item ? toDetail(item) : null;
}

export async function getMatches(id: string): Promise<MatchDTO[] | null> {
  const target = await db.item.findUnique({ where: { id } });
  if (!target) return null;
  const candidates = await db.item.findMany({
    where: { status: "OPEN", itemType: target.itemType === "LOST" ? "FOUND" : "LOST" },
  });
  return findMatches(target, candidates)
    .slice(0, 6)
    .map((m) => ({ item: toSummary(m.item), score: m.score, reasons: m.reasons }));
}

export async function createItem(input: CreateItemInput): Promise<ItemDetail> {
  const item = await db.item.create({
    data: {
      itemType: input.itemType,
      name: input.name,
      category: input.category,
      location: input.location,
      date: parseDateOnly(input.date),
      description: input.description,
      contactName: input.contactName || null,
      contactType: input.contactType,
      contactValue:
        input.contactType === "PHONE" ? normalizePhone(input.contactValue) : input.contactValue.toLowerCase(),
    },
  });
  return toDetail(item);
}

export async function updateItemStatus(id: string, status: Item["status"]): Promise<ItemDetail | null> {
  const exists = await db.item.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return null;
  return toDetail(await db.item.update({ where: { id }, data: { status } }));
}

export async function getStats(): Promise<Stats> {
  const [grouped, open] = await Promise.all([
    db.item.groupBy({ by: ["itemType", "status", "category"], _count: { _all: true } }),
    openMatchables(),
  ]);

  const stats: Stats = {
    total: 0,
    lost: 0,
    found: 0,
    resolved: 0,
    potentialMatches: matchCounts(open).pairs,
    byCategory: CATEGORIES.map((c) => ({ category: c.value, label: CATEGORY_LABEL[c.value], lost: 0, found: 0 })),
  };

  for (const g of grouped) {
    const n = g._count._all;
    stats.total += n;
    if (g.status === "RESOLVED") {
      stats.resolved += n;
      continue;
    }
    const bucket = stats.byCategory.find((b) => b.category === g.category)!;
    if (g.itemType === "LOST") {
      stats.lost += n;
      bucket.lost += n;
    } else {
      stats.found += n;
      bucket.found += n;
    }
  }
  return stats;
}
