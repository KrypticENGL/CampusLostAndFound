import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, Sparkles, Tag } from "lucide-react";
import { getItem, getMatches } from "@/lib/items";
import { isValidId } from "@/lib/api";
import { canManageItem, getCurrentUser } from "@/lib/auth";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/dates";
import { CategoryIcon, TypeBadge } from "@/components/items/item-meta";
import { ContactActions } from "@/components/items/contact-actions";
import { MatchList } from "@/components/items/match-list";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!isValidId(id)) return null;
  const item = await getItem(id);
  return item ? { item, matches: item.status === "OPEN" ? (await getMatches(id)) ?? [] : [] } : null;
}

export async function generateMetadata({ params }: PageProps<"/items/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = isValidId(id) ? await getItem(id) : null;
  return { title: item ? `${item.itemType === "LOST" ? "Lost" : "Found"}: ${item.name}` : "Item not found" };
}

export default async function ItemPage({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const data = await load(id);
  if (!data) notFound();
  const { item, matches } = data;
  const canManage = canManageItem(await getCurrentUser(), item.ownerId);

  const facts = [
    { icon: Tag, label: "Category", value: CATEGORY_LABEL[item.category] },
    { icon: MapPin, label: "Location", value: item.location },
    { icon: CalendarDays, label: item.itemType === "LOST" ? "Date lost" : "Date found", value: formatDate(item.date) },
    { icon: Clock, label: "Reported", value: `${formatDate(item.createdAt)} · ${formatRelative(item.createdAt)}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/#listings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to listings
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <article className="rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
          <div className="flex items-start gap-4">
            <CategoryIcon category={item.category} type={item.itemType} className="size-14" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={item.itemType} />
                {item.status === "RESOLVED" && (
                  <span className="rounded-full bg-found-soft px-2.5 py-0.5 text-xs font-semibold text-found">
                    Reunited ✓
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">{item.name}</h1>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                <f.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{f.label}</dt>
                  <dd className="truncate text-sm font-medium">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <h2 className="text-sm font-medium text-muted-foreground">Description</h2>
            <p className="mt-2 leading-relaxed whitespace-pre-line">{item.description}</p>
          </div>
        </article>

        <aside className="lg:row-span-2">
          <div className="rounded-2xl border bg-card p-5 shadow-xs lg:sticky lg:top-24">
            <ContactActions item={item} canManage={canManage} />
          </div>
        </aside>

        <section aria-labelledby="matches-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 id="matches-heading" className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="size-4.5 text-primary" aria-hidden /> Potential matches
              </h2>
              <p className="text-sm text-muted-foreground">
                {item.status === "RESOLVED"
                  ? "This listing is resolved, so matching is paused."
                  : `Open ${item.itemType === "LOST" ? "found" : "lost"} items scored on category, name, location, date and description.`}
              </p>
            </div>
          </div>
          {item.status === "OPEN" && <MatchList matches={matches} targetType={item.itemType} />}
        </section>
      </div>
    </div>
  );
}
