import type { Category, ItemType } from "@prisma/client";
import { daysBetween } from "./dates";
import { MATCH_THRESHOLD } from "./constants";

/** Minimal shape needed to score two listings. Keeps the algorithm pure and testable. */
export interface Matchable {
  id: string;
  itemType: ItemType;
  name: string;
  category: Category;
  location: string;
  date: Date | string;
  description: string;
}

export interface MatchReason {
  label: string;
  points: number;
  met: boolean;
}

export interface MatchResult {
  score: number;
  reasons: MatchReason[];
}

// Score weights — they sum to 100 so the score reads directly as a percentage.
const WEIGHTS = { category: 25, name: 30, location: 15, date: 15, description: 15 } as const;

const STOPWORDS = new Set(
  "a an the and or of in on at to for with my our your his her its is was were it this that near by from some one lost found left have has had very i me we".split(" "),
);

// Small synonym table so "earphones" ≈ "earbuds", "flask" ≈ "bottle", etc.
const SYNONYMS: Record<string, string> = {
  purse: "wallet", billfold: "wallet",
  flask: "bottle", tumbler: "bottle",
  earphone: "earbud", airpod: "earbud", headphone: "earbud", buds: "earbud", bud: "earbud",
  mobile: "phone", smartphone: "phone", iphone: "phone", cellphone: "phone",
  notebook: "book", textbook: "book", novel: "book",
  backpack: "bag", rucksack: "bag", satchel: "bag", handbag: "bag", pouch: "bag",
  identity: "id", idcard: "id",
  specs: "glasses", spectacles: "glasses", sunglass: "glasses",
  charger: "charger", adapter: "charger", cable: "charger",
  key: "key", keychain: "key", keyring: "key",
  steel: "metal", metallic: "metal",
  maths: "math", mathematics: "math",
};

export function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => (t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t))
    .map((t) => SYNONYMS[t] ?? t);
  return new Set(tokens);
}

/** Overlap coefficient: |A∩B| / min(|A|,|B|). Forgiving when one side is terse. */
function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / Math.min(a.size, b.size);
}

function normalizeLocation(loc: string): string {
  return loc.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Deterministic, explainable similarity between a LOST and a FOUND listing.
 * Returns score 0 when both listings are the same type (they can never match).
 */
export function scoreMatch(a: Matchable, b: Matchable): MatchResult {
  if (a.itemType === b.itemType || a.id === b.id) return { score: 0, reasons: [] };

  const lost = a.itemType === "LOST" ? a : b;
  const found = a.itemType === "LOST" ? b : a;
  const reasons: MatchReason[] = [];

  // Category
  const sameCategory = a.category === b.category;
  reasons.push({ label: "Same category", points: sameCategory ? WEIGHTS.category : 0, met: sameCategory });

  // Name similarity
  const nameSim = overlap(tokenize(a.name), tokenize(b.name));
  const namePts = Math.round(WEIGHTS.name * nameSim);
  reasons.push({
    label: nameSim >= 0.99 ? "Matching item name" : "Similar item name",
    points: namePts,
    met: nameSim >= 0.5,
  });

  // Location
  const la = normalizeLocation(a.location);
  const lb = normalizeLocation(b.location);
  const locExact = la === lb;
  const locPartial = !locExact && overlap(tokenize(a.location), tokenize(b.location)) > 0;
  reasons.push({
    label: locExact ? "Same location" : "Nearby location",
    points: locExact ? WEIGHTS.location : locPartial ? Math.round(WEIGHTS.location / 2) : 0,
    met: locExact || locPartial,
  });

  // Date — an item can't be found well before it was lost (1 day grace for fuzzy reporting).
  const days = daysBetween(lost.date, found.date);
  const foundBeforeLost = new Date(found.date).getTime() < new Date(lost.date).getTime() - 86_400_000;
  let datePts = 0;
  if (!foundBeforeLost) {
    if (days <= 1) datePts = WEIGHTS.date;
    else if (days <= 3) datePts = Math.round(WEIGHTS.date * 0.7);
    else if (days <= 7) datePts = Math.round(WEIGHTS.date * 0.4);
    else if (days <= 14) datePts = Math.round(WEIGHTS.date * 0.15);
  }
  reasons.push({
    label: days <= 1 && datePts ? "Same or next day" : "Similar date",
    points: datePts,
    met: datePts >= WEIGHTS.date * 0.4,
  });

  // Description keywords (colours, brands, distinguishing marks)
  const descSim = overlap(
    tokenize(`${a.name} ${a.description}`),
    tokenize(`${b.name} ${b.description}`),
  );
  const descPts = Math.round(WEIGHTS.description * Math.min(1, descSim * 1.5));
  reasons.push({ label: "Similar description", points: descPts, met: descSim >= 0.25 });

  const score = Math.min(100, reasons.reduce((s, r) => s + r.points, 0));
  return { score, reasons };
}

export interface RankedMatch<T extends Matchable> extends MatchResult {
  item: T;
}

/** Rank candidates against a listing, keeping only those above the threshold. */
export function findMatches<T extends Matchable>(
  target: Matchable,
  candidates: T[],
  threshold = MATCH_THRESHOLD,
): RankedMatch<T>[] {
  return candidates
    .map((item) => ({ item, ...scoreMatch(target, item) }))
    .filter((m) => m.score >= threshold)
    .sort((x, y) => y.score - x.score);
}
