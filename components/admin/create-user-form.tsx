"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import type { Role } from "@prisma/client";
import { adminCreateUserSchema, fieldErrors } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = { name: "", email: "", password: "", role: "STUDENT" as Role };

export function CreateUserForm() {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof EMPTY, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = adminCreateUserSchema.safeParse(values);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error ?? "Could not create user");
      }
      toast.success(`Created ${data.user.name}`, { description: data.user.email });
      setValues(EMPTY);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const err = (key: string) =>
    errors[key] ? (
      <p id={`new-${key}-error`} role="alert" className="text-xs font-medium text-destructive">
        {errors[key]}
      </p>
    ) : null;
  const a11y = (key: string) => ({
    id: `new-${key}`,
    "aria-invalid": !!errors[key] || undefined,
    "aria-describedby": errors[key] ? `new-${key}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="new-name">Full name</Label>
        <Input {...a11y("name")} value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Priya Nair" />
        {err("name")}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-email">Email</Label>
        <Input {...a11y("email")} type="email" value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="priya@campus.edu" />
        {err("email")}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-password">Temporary password</Label>
        <Input {...a11y("password")} type="text" autoComplete="off" value={values.password} onChange={(e) => set("password", e.target.value)} placeholder="8+ chars, letter & number" />
        {err("password")}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-role">Role</Label>
        <Select value={values.role} onValueChange={(v) => set("role", v)}>
          <SelectTrigger id="new-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="h-10" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
        {submitting ? "Creating…" : "Create user"}
      </Button>
    </form>
  );
}
