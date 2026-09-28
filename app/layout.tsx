import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Campus Lost & Found",
    template: "%s · Campus Lost & Found",
  },
  description: "Report, search and reunite lost items across campus — with automatic lost ↔ found matching.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a
            href="#main"
            className="sr-only z-50 rounded-full bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col sm:p-4 lg:p-8">
            <div className="flex flex-1 flex-col overflow-hidden bg-panel shadow-[0_30px_80px_-40px_rgb(0_0_0/0.35)] sm:rounded-[28px]">
              <SiteHeader user={user} />
              <main id="main" className="flex-1">
                {children}
              </main>
              <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
                Campus Lost &amp; Found · Helping students get their things back
              </footer>
            </div>
          </div>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
