import { redirect } from "next/navigation";
import { SearchCheck } from "lucide-react";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { AuthForm } from "./auth-form";

/** Shared shell for /login and /register. Signed-in users are sent straight on. */
export async function AuthPage({ mode, searchParams }: { mode: "login" | "register"; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
        <SearchCheck className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 text-center text-2xl font-semibold">
        {mode === "login" ? "Log in to your account" : "Create your account"}
      </h1>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        {mode === "login"
          ? "Log in to report items and manage your listings."
          : "Join to report lost or found items on campus."}
      </p>
      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
        <AuthForm mode={mode} next={next} />
      </div>
    </div>
  );
}
