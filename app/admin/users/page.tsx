import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck, UserCheck, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { UserTable } from "@/components/admin/user-table";

export const metadata: Metadata = { title: "Manage users" };

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/admin/users");
  if (me.role !== "ADMIN") notFound();

  const users = await listUsers();
  const summary = [
    { label: "Total users", value: users.length, icon: Users },
    { label: "Active", value: users.filter((u) => u.active).length, icon: UserCheck },
    { label: "Admins", value: users.filter((u) => u.role === "ADMIN").length, icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">User management</h1>
      <p className="mt-1.5 text-muted-foreground">Create accounts, assign roles and deactivate access.</p>

      <ul className="mt-6 grid grid-cols-3 gap-3">
        {summary.map((s) => (
          <li key={s.label} className="rounded-2xl border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
              {s.label}
              <s.icon className="size-4" aria-hidden />
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</div>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <UserTable users={users} currentUserId={me.id} />
        <section aria-labelledby="create-user-heading" className="rounded-2xl border bg-card p-5 shadow-xs lg:sticky lg:top-24">
          <h2 id="create-user-heading" className="font-semibold">Add a user</h2>
          <p className="mb-4 text-xs text-muted-foreground">They can log in immediately with this password.</p>
          <CreateUserForm />
        </section>
      </div>
    </div>
  );
}
