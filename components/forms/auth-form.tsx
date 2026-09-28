"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, registerSchema, fieldErrors } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "register";
type Values = { name: string; email: string; password: string };

export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
    setFormError("");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = (isLogin ? loginSchema : registerSchema).safeParse(values);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      document.getElementById(`auth-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        setFormError(data.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      toast.success(isLogin ? "Welcome back!" : "Account created — you're signed in");
      router.push(next);
      router.refresh();
    } catch {
      setFormError("Network error — please try again");
      setSubmitting(false);
    }
  }

  const field = (key: keyof Values, label: string, input: React.ReactNode) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`auth-${key}`}>{label}</Label>
      {input}
      {errors[key] && (
        <p id={`auth-${key}-error`} role="alert" className="text-xs font-medium text-destructive">
          {errors[key]}
        </p>
      )}
    </div>
  );

  const a11y = (key: keyof Values) => ({
    id: `auth-${key}`,
    "aria-invalid": !!errors[key] || undefined,
    "aria-describedby": errors[key] ? `auth-${key}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </div>
      )}
      {!isLogin &&
        field("name", "Full name", <Input {...a11y("name")} autoComplete="name" value={values.name} onChange={set("name")} placeholder="Aarav Mehta" />)}
      {field("email", "Email", <Input {...a11y("email")} type="email" autoComplete="email" value={values.email} onChange={set("email")} placeholder="you@campus.edu" />)}
      {field(
        "password",
        "Password",
        <div className="relative">
          <Input
            {...a11y("password")}
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={values.password}
            onChange={set("password")}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>,
      )}
      {!isLogin && !errors.password && (
        <p className="-mt-3 text-xs text-muted-foreground">At least 8 characters, with a letter and a number.</p>
      )}

      <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
        {submitting && <Loader2 className="animate-spin" />}
        {isLogin ? (submitting ? "Signing in…" : "Log in") : submitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link
          href={`/${isLogin ? "register" : "login"}?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary hover:underline"
        >
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
