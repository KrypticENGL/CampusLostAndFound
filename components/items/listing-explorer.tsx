"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Plus, RotateCcw, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import type { ItemSummary } from "@/lib/items";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ItemCard, ItemCardSkeleton } from "./item-card";
import { ItemTable } from "./item-table";
import { EmptyState } from "./empty-state";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "LOST", label: "Lost" },
  { value: "FOUND", label: "Found" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "date", label: "Date lost / found" },
] as const;

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: ItemSummary[] };

/** Result tagged with the request it answers, so a stale result reads as "loading". */
type Result = { key: string } & ({ kind: "error"; message: string } | { kind: "ready"; items: ItemSummary[] });

export function ListingExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "ALL";
  const category = params.get("category") ?? "ALL";
  const sort = params.get("sort") ?? "newest";
  const includeResolved = params.get("includeResolved") === "true";
  const highlight = params.get("highlight");

  const [query, setQuery] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  const [result, setResult] = useState<Result | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Keep the input in sync when the URL changes elsewhere (header search, back button).
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setQuery(search);
  }

  const requestKey = `${new URLSearchParams({ search, status, category, sort, includeResolved: String(includeResolved) })}#${reloadKey}`;
  const state: LoadState = result && result.key === requestKey ? result : { kind: "loading" };
  const inputRef = useRef<HTMLInputElement>(null);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        const isDefault =
          !value ||
          (key === "status" && value === "ALL") ||
          (key === "category" && value === "ALL") ||
          (key === "sort" && value === "newest") ||
          (key === "includeResolved" && value === "false");
        if (isDefault) next.delete(key);
        else next.set(key, value);
      }
      next.delete("highlight");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce typing → URL.
  useEffect(() => {
    if (query.trim() === search) return;
    const t = setTimeout(() => setParam({ search: query.trim() || null }), 300);
    return () => clearTimeout(t);
  }, [query, search, setParam]);

  // Fetch whenever filters change.
  useEffect(() => {
    const controller = new AbortController();
    const qs = requestKey.split("#")[0];
    fetch(`/api/items?${qs}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Failed to load listings");
        setResult({ key: requestKey, kind: "ready", items: data.items });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setResult({ key: requestKey, kind: "error", message: err.message });
      });
    return () => controller.abort();
  }, [requestKey]);

  const activeFilters = (category !== "ALL" ? 1 : 0) + (sort !== "newest" ? 1 : 0) + (includeResolved ? 1 : 0);
  const hasQuery = !!search || status !== "ALL" || activeFilters > 0;
  const clearAll = () => {
    setQuery("");
    router.replace(pathname, { scroll: false });
  };

  const filterControls = (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="category-filter" className="text-xs text-muted-foreground md:sr-only">
          Category
        </Label>
        <Select value={category} onValueChange={(v) => setParam({ category: v })}>
          <SelectTrigger id="category-filter" className="w-full rounded-full md:w-40" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="sort-filter" className="text-xs text-muted-foreground md:sr-only">
          Sort by
        </Label>
        <Select value={sort} onValueChange={(v) => setParam({ sort: v })}>
          <SelectTrigger id="sort-filter" className="w-full rounded-full md:w-44" aria-label="Sort listings">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
        <input
          type="checkbox"
          className="size-4 accent-navy"
          checked={includeResolved}
          onChange={(e) => setParam({ includeResolved: String(e.target.checked) })}
        />
        Show resolved
      </label>
    </>
  );

  return (
    <section id="listings" aria-labelledby="listings-heading" className="scroll-mt-4 rounded-3xl bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="listings-heading" className="text-2xl font-medium">
              Recent listings
            </h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {state.kind === "ready"
                ? `${state.items.length} ${state.items.length === 1 ? "item" : "items"}${hasQuery ? " match your filters" : ""}`
                : state.kind === "loading"
                  ? "Loading listings…"
                  : "Couldn't load listings"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasQuery && (
              <Button variant="outline" className="h-9 rounded-full px-3.5" onClick={clearAll}>
                <RotateCcw /> Reset
              </Button>
            )}
            <Button asChild className="h-9 rounded-full px-4">
              <Link href="/report">
                <Plus /> Report item
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            id="listing-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setParam({ search: query.trim() || null })}
            placeholder="Search by item, description, location or category — try “wallet”"
            aria-label="Search listings"
            className="h-11 rounded-full border-transparent bg-muted pr-10 pl-10 text-base shadow-none md:text-sm dark:bg-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setParam({ search: null });
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Status + filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Filter by status" className="inline-flex rounded-full bg-muted p-1">
            {STATUS_OPTIONS.map((o) => {
              const active = status === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setParam({ status: o.value })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o.value !== "ALL" && (
                    <span className={cn("size-1.5 rounded-full", o.value === "LOST" ? "bg-navy" : "bg-gold")} aria-hidden />
                  )}
                  {o.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto hidden items-center gap-3 md:flex">{filterControls}</div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="ml-auto h-9 rounded-full px-3.5 md:hidden">
                <SlidersHorizontal />
                Filters
                {activeFilters > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow down listings by category and order.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 px-4 pb-6">{filterControls}</div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results */}
        {state.kind === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        )}

        {state.kind === "error" && (
          <EmptyState
            icon={AlertTriangle}
            title="We couldn't load listings"
            description={state.message}
            action={
              <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                <RotateCcw /> Try again
              </Button>
            }
          />
        )}

        {state.kind === "ready" && state.items.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No items found"
            description={
              hasQuery
                ? "Try changing your search or filters."
                : "Nothing has been reported yet. Be the first to post a listing."
            }
            action={
              hasQuery ? (
                <Button variant="outline" onClick={clearAll}>
                  Clear filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/report">
                    <Plus /> Report an item
                  </Link>
                </Button>
              )
            }
          />
        )}

        {state.kind === "ready" && state.items.length > 0 && (
          <ItemTable items={state.items} highlight={highlight} className="hidden lg:block" />
        )}

        {state.kind === "ready" && state.items.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {state.items.map((item) => (
              <li key={item.id}>
                <ItemCard item={item} highlight={item.id === highlight} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
