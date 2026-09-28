"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { CircleDot, LogIn, LogOut, Menu, Moon, Plus, Search, SearchCheck, Sparkles, Sun, Users } from "lucide-react";
import { toast } from "sonner";
import type { SessionUser } from "@/lib/auth";
import type { Stats } from "@/lib/items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FlutedGlass } from "./fluted-glass";

/** Amity University crest (traced SVG), shown through the fluted-glass banner. */
const BRAND_LOGO = "/brand/logo.svg";

const NAV = [
  { href: "/", label: "Overview", match: (path: string, status: string | null) => path === "/" && !status },
  { href: "/?status=LOST#listings", label: "Lost", match: (path: string, status: string | null) => path === "/" && status === "LOST" },
  { href: "/?status=FOUND#listings", label: "Found", match: (path: string, status: string | null) => path === "/" && status === "FOUND" },
  { href: "/report", label: "Report", match: (path: string) => path.startsWith("/report") },
];

/** Frosted round button used over the banner (settings / bell icons in the reference). */
const glassIcon =
  "grid size-10 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      className={glassIcon}
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4.5 dark:hidden" />
      <Moon className="hidden size-4.5 dark:block" />
    </button>
  );
}

function HeaderSearch({ className, onDone }: { className?: string; onDone?: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/?search=${encodeURIComponent(q)}#listings` : "/#listings");
        setValue("");
        onDone?.();
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search"
        aria-label="Search all listings"
        className="h-11 w-full rounded-full bg-white pr-11 pl-5 text-[15px] text-neutral-900 shadow-sm outline-none placeholder:text-neutral-700 focus-visible:ring-3 focus-visible:ring-white/60"
      />
      <Search className="pointer-events-none absolute top-1/2 right-4 size-4.5 -translate-y-1/2 text-neutral-900" aria-hidden />
    </form>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function useLogout() {
  const router = useRouter();
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    toast.success("Logged out");
    router.push("/");
    router.refresh();
  };
}

function UserChip({ user }: { user: SessionUser }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground" aria-hidden>
        {initials(user.name)}
      </span>
      <span className="min-w-0 text-left leading-tight">
        <span className="block truncate text-sm font-medium">{user.name}</span>
        <span className="block text-[11px] text-muted-foreground">{user.role === "ADMIN" ? "Admin" : "Student"}</span>
      </span>
    </span>
  );
}

/** The round profile picture in the reference, as initials on white. */
function BannerAvatar({ user }: { user: SessionUser }) {
  const role = user.role === "ADMIN" ? "Admin" : "Student";
  return (
    <span
      title={`${user.name} · ${role}`}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold text-neutral-900 ring-2 ring-white/40"
    >
      <span aria-hidden>{initials(user.name)}</span>
      <span className="sr-only">
        Signed in as {user.name} ({role})
      </span>
    </span>
  );
}

function NavTabs({ onNavigate, vertical = false }: { onNavigate?: () => void; vertical?: boolean }) {
  const pathname = usePathname();
  const status = useSearchParams().get("status");
  return <TabList active={(n) => n.match(pathname, status)} onNavigate={onNavigate} vertical={vertical} />;
}

function TabList({
  active,
  onNavigate,
  vertical,
}: {
  active: (n: (typeof NAV)[number]) => boolean;
  onNavigate?: () => void;
  vertical?: boolean;
}) {
  return (
    <nav aria-label="Main" className={cn("flex", vertical ? "flex-col gap-1" : "items-end gap-1")}>
      {NAV.map((n) => {
        const isActive = active(n);
        return (
          <Link
            key={n.label}
            href={n.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "text-[15px] transition-colors focus-visible:ring-3 focus-visible:outline-none",
              vertical
                ? cn("rounded-xl px-3 py-2.5 font-medium focus-visible:ring-ring/50", isActive ? "bg-muted" : "hover:bg-muted")
                : cn(
                    "rounded-t-xl px-3.5 pt-2 pb-2.5 focus-visible:ring-white/60",
                    isActive ? "bg-white/20 text-white backdrop-blur-md" : "text-white/85 hover:text-white",
                  ),
            )}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Live counters for the banner chips; refreshed on navigation so a new report shows up. */
function useStats(pathname: string) {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats", { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Stats | null) => data && setStats(data))
      .catch(() => {});
    return () => controller.abort();
  }, [pathname]);
  return stats;
}

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";
  const stats = useStats(pathname);
  const now = new Date();
  const recovery = stats && stats.total ? Math.round((stats.resolved / stats.total) * 100) : null;
  const firstName = user?.name.trim().split(/\s+/)[0];

  return (
    <header className="hero-bg relative isolate overflow-hidden text-white">
      {/* No-WebGL fallback; the canvas below paints over it once the shader runs. */}
      <div aria-hidden className="blinds pointer-events-none absolute inset-0" />
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG, no optimisation needed */}
      <img src={BRAND_LOGO} alt="" aria-hidden className="blinds-light pointer-events-none absolute top-1/2 left-[72%] h-[62%] max-w-[42%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-60 sm:opacity-100" />
      <FlutedGlass logoSrc={BRAND_LOGO} />
      <div aria-hidden className="hero-shade pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Date and greeting depend on the viewer's clock, so they may differ from the server render. */}
            <p className="text-sm text-white/80" suppressHydrationWarning>
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <Link
              href="/"
              className={cn(
                "mt-3 block rounded-lg leading-[1.05] tracking-tight focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none",
                isHome ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
              )}
            >
              <span className="block" suppressHydrationWarning>
                {`${greeting(now.getHours())}${firstName ? `, ${firstName}` : ""}`}
              </span>
              <span className="block font-semibold italic">Campus Lost &amp; Found</span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/report" className="hidden h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-white/90 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none sm:inline-flex">
              <Plus className="size-4" /> Report item
            </Link>
            <ThemeToggle />
            {user ? (
              <div className="hidden items-center gap-2 md:flex">
                {user.role === "ADMIN" && (
                  <Link href="/admin/users" className={glassIcon} aria-label="Manage users" title="Manage users">
                    <Users className="size-4.5" />
                  </Link>
                )}
                <button type="button" className={glassIcon} aria-label="Log out" title="Log out" onClick={logout}>
                  <LogOut className="size-4.5" />
                </button>
                <BannerAvatar user={user} />
              </div>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="hidden h-10 items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none md:inline-flex"
              >
                <LogIn className="size-4" /> Log in
              </Link>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button type="button" className={cn(glassIcon, "md:hidden")} aria-label="Open menu">
                  <Menu className="size-4.5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <SearchCheck className="size-4.5 text-gold" aria-hidden /> Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 px-4">
                  <HeaderSearch onDone={() => setOpen(false)} className="[&_input]:bg-muted [&_input]:shadow-none" />
                  <Suspense fallback={<TabList active={() => false} vertical />}>
                    <NavTabs vertical onNavigate={() => setOpen(false)} />
                  </Suspense>
                  {user ? (
                    <div className="grid gap-2 rounded-2xl bg-muted/60 p-3">
                      <UserChip user={user} />
                      {user.role === "ADMIN" && (
                        <Link href="/admin/users" onClick={() => setOpen(false)} className="rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                          Manage users
                        </Link>
                      )}
                      <Button variant="outline" className="rounded-full" onClick={() => { setOpen(false); logout(); }}>
                        <LogOut /> Log out
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" className="rounded-full"><Link href="/login" onClick={() => setOpen(false)}>Log in</Link></Button>
                      <Button asChild variant="outline" className="rounded-full"><Link href="/register" onClick={() => setOpen(false)}>Sign up</Link></Button>
                    </div>
                  )}
                  <Link
                    href="/report"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-medium text-primary-foreground"
                  >
                    <Plus className="size-4" /> Report item
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {isHome && (
          <ul className="mt-5 flex flex-wrap gap-2 text-sm" aria-label="Campus summary">
            <li className="inline-flex h-8 items-center gap-2 rounded-full bg-black/85 px-3.5">
              <CircleDot className="size-3.5" aria-hidden />
              Open <span className="font-semibold tabular-nums">{stats ? stats.lost + stats.found : "–"}</span>
            </li>
            <li className="inline-flex h-8 items-center gap-2 rounded-full bg-black/85 px-3.5">
              <Sparkles className="size-3.5" aria-hidden />
              Recovered <span className="font-semibold tabular-nums">{recovery === null ? "–" : `${recovery}%`}</span>
            </li>
          </ul>
        )}

        <div className={cn("flex items-end justify-between gap-4", isHome ? "mt-10 sm:mt-14" : "mt-8")}>
          <div className="-mb-px hidden md:block">
            <Suspense fallback={<TabList active={() => false} />}>
              <NavTabs />
            </Suspense>
          </div>
          <HeaderSearch className="mb-5 w-full sm:mb-6 md:w-64" />
        </div>
      </div>
    </header>
  );
}
