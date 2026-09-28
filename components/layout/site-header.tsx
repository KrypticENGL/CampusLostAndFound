"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Plus, Search, SearchCheck, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { href: "/", label: "Browse" },
  { href: "/?status=LOST#listings", label: "Lost" },
  { href: "/?status=FOUND#listings", label: "Found" },
  { href: "/report", label: "Report" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg font-semibold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <SearchCheck className="size-4.5" aria-hidden />
      </span>
      <span className="tracking-tight">
        Campus <span className="text-muted-foreground">Lost &amp; Found</span>
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
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
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search items…"
        aria-label="Search all listings"
        className="h-9 pl-9"
      />
    </form>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.slice(0, 3).map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!isHome && <HeaderSearch className="hidden w-56 lg:block" />}
          <ThemeToggle />
          <Button asChild size="lg" className="hidden px-3.5 sm:inline-flex">
            <Link href="/report">
              <Plus /> Report item
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 px-4">
                <HeaderSearch onDone={() => setOpen(false)} />
                <nav aria-label="Mobile" className="grid gap-1">
                  {NAV.map((n) => (
                    <Link
                      key={n.label}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      {n.label}
                    </Link>
                  ))}
                </nav>
                <Button asChild>
                  <Link href="/report" onClick={() => setOpen(false)}>
                    <Plus /> Report item
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
