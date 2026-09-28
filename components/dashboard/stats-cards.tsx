import Link from "next/link";
import { ArrowRight, ArrowUpRight, Layers, Sun, Trophy } from "lucide-react";
import type { Stats } from "@/lib/items";
import { cn } from "@/lib/utils";

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

/** Shared shell: white rounded card with the small icon + label row on top. */
export function DashCard({
  icon: Icon,
  label,
  aside,
  className,
  children,
  labelledBy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  labelledBy: string;
}) {
  return (
    <section aria-labelledby={labelledBy} className={cn("flex flex-col rounded-3xl bg-card p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <h2 id={labelledBy} className="flex items-center gap-2.5 text-muted-foreground">
          <span className="grid size-7 place-items-center rounded-full bg-muted text-foreground">
            <Icon className="size-3.5" aria-hidden />
          </span>
          {label}
        </h2>
        {aside && <span className="text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center rounded-full bg-muted px-2 text-xs font-medium whitespace-nowrap tabular-nums", className)}>
      {children}
    </span>
  );
}

/** "Monthly Recurring Revenue" card → open listings with a found / lost / resolved split bar. */
export function OpenListingsCard({ stats }: { stats: Stats }) {
  const open = stats.lost + stats.found;
  const foundPct = pct(stats.found, stats.total);
  const lostPct = pct(stats.lost, stats.total);

  const breakdown = [
    { label: "Lost", value: stats.lost, href: "/?status=LOST#listings", bar: "bg-lost", share: pct(stats.lost, stats.total) },
    { label: "Found", value: stats.found, href: "/?status=FOUND#listings", bar: "bg-gold", share: pct(stats.found, stats.total) },
    { label: "Resolved", value: stats.resolved, href: "/?includeResolved=true#listings", bar: "bg-foreground", share: pct(stats.resolved, stats.total) },
  ];

  return (
    <DashCard icon={Layers} label="Open listings" aside={<>Total <span className="text-foreground">{stats.total}</span></>} labelledBy="open-heading">
      <div className="mt-6 flex items-center gap-2.5">
        <span className="text-5xl font-medium tracking-tight tabular-nums">{open}</span>
        <Pill>{lostPct}% lost</Pill>
        <Sun className="ml-auto size-8 text-gold" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {stats.resolved ? (
          <>
            Reunited <span className="font-medium text-foreground">+{stats.resolved}</span> {stats.resolved === 1 ? "item" : "items"} with their owners
          </>
        ) : (
          "No items reunited yet — every report helps"
        )}
      </p>

      <div className="mt-7">
        <div
          className="relative flex h-8 overflow-hidden rounded-md bg-muted"
          role="img"
          aria-label={`${foundPct}% found, ${lostPct}% lost, the rest resolved`}
        >
          <div className="bg-gradient-to-r from-gold/70 to-gold" style={{ width: `${foundPct}%` }} />
          <div className="stripes bg-navy-soft" style={{ width: `${lostPct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums" aria-hidden>
          {[0, 25, 50, 75, 100].map((t) => (
            <span key={t} className="flex flex-col items-start gap-0.5 border-l pl-1 pt-1 first:border-l-2 last:items-end last:border-l-0 last:border-r last:pr-1">
              {t}%
            </span>
          ))}
        </div>
        <div className="relative mt-2 h-9">
          <span
            className="absolute top-0 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium shadow-[0_6px_20px_-6px_rgb(0_0_0/0.25)] ring-1 ring-border"
            style={{ left: `clamp(4.5rem, ${foundPct}%, calc(100% - 4.5rem))` }}
          >
            {stats.found} found <Pill className="h-5 bg-gold text-[10px] text-gold-foreground">{foundPct}%</Pill>
          </span>
        </div>
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-3 pt-6">
        {breakdown.map((b) => (
          <div key={b.label}>
            <dt className="text-sm text-muted-foreground">{b.label}</dt>
            <dd className="mt-0.5 flex items-center gap-2">
              <Link href={b.href} scroll={false} className="text-lg font-medium tabular-nums hover:underline">
                {b.value}
              </Link>
              <span className="h-1.5 w-8 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span className={cn("block h-full rounded-full", b.bar)} style={{ width: `${b.share}%` }} />
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </DashCard>
  );
}

const METER_BARS = 16;

/** "Active Users" card → recovery rate with a bar meter and a soft detail panel. */
export function RecoveryCard({ stats }: { stats: Stats }) {
  const rate = pct(stats.resolved, stats.total);
  const filled = Math.round((rate / 100) * METER_BARS);
  const top = [...stats.byCategory].sort((a, b) => b.lost + b.found - (a.lost + a.found))[0];
  const topOpen = top ? top.lost + top.found : 0;

  return (
    <DashCard
      icon={Trophy}
      label="Recovery"
      aside={<>Matches <span className="text-foreground">{stats.potentialMatches}</span></>}
      labelledBy="recovery-heading"
      className="md:col-span-2 xl:col-span-1"
    >
      <div className="mt-5 flex items-center justify-between">
        <p className="text-lg">Recovery rate</p>
        <Link href="/?includeResolved=true#listings" scroll={false} aria-label="Browse all listings including resolved" className="rounded-full p-1 hover:bg-muted">
          <ArrowRight className="size-5" />
        </Link>
      </div>

      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-5xl font-medium tracking-tight tabular-nums">{rate}%</span>
            <Pill>{stats.resolved} reunited</Pill>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Matches found <span className="font-medium text-foreground">{stats.potentialMatches}</span>
            <ArrowUpRight className="ml-0.5 inline size-3.5 text-gold" aria-hidden />
          </p>
        </div>
        <div className="flex h-24 min-w-0 items-end justify-end gap-[3px] overflow-hidden" role="img" aria-label={`${rate}% of all reported items recovered`}>
          {Array.from({ length: METER_BARS }, (_, i) => {
            const on = i < filled;
            // Rising-then-falling silhouette like the reference; lit bars show the rate.
            const h = 28 + Math.round(Math.sin((i / (METER_BARS - 1)) * Math.PI) * 60) + (i % 3) * 4;
            return (
              <span
                key={i}
                className={cn("w-1.5 shrink-0 rounded-full sm:w-2", on ? "bg-gradient-to-t from-gold to-gold/40" : "bg-muted")}
                style={{ height: `${Math.min(h, 96)}px` }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl bg-panel p-4">
          <dl className="grid grid-cols-3 gap-3 border-b pb-3">
            <div>
              <dt className="text-xs text-muted-foreground">Busiest</dt>
              <dd className="mt-1 truncate font-medium">{topOpen ? top.label : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Still lost</dt>
              <dd className="mt-1 font-medium tabular-nums">{stats.lost}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Unclaimed</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium tabular-nums">
                {stats.found}
                <span className="h-1.5 w-6 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <span className="block h-full rounded-full bg-navy" style={{ width: `${pct(stats.found, stats.lost + stats.found)}%` }} />
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-muted-foreground">
            Recognise something?{" "}
            <Link href="/?status=FOUND#listings" scroll={false} className="text-navy hover:underline">
              Browse found items
            </Link>
          </p>
        </div>
      </div>
    </DashCard>
  );
}
