"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import type { Role } from "@prisma/client";
import type { UserDTO } from "@/lib/users";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UserTable({ users, currentUserId }: { users: UserDTO[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = q ? users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q)) : users;

  async function update(user: UserDTO, data: { role?: Role; active?: boolean }) {
    setPending(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      toast.success(
        data.role ? `${user.name} is now ${data.role === "ADMIN" ? "an admin" : "a student"}` : `${user.name} ${data.active ? "reactivated" : "deactivated"}`,
      );
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-2xl border bg-card shadow-xs">
      <div className="flex items-center gap-3 border-b p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users by name or email" aria-label="Search users" className="pl-9" />
        </div>
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {visible.length} of {users.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">No users match “{query}”.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="px-4 py-2.5 font-medium">User</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Listings</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Joined</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const self = u.id === currentUserId;
                const busy = pending === u.id;
                return (
                  <tr key={u.id} className={cn("border-b last:border-0", !u.active && "text-muted-foreground")}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {u.name} {self && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={u.role} disabled={self || busy} onValueChange={(v) => update(u, { role: v as Role })}>
                        <SelectTrigger size="sm" className="w-28" aria-label={`Role for ${u.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums sm:table-cell">{u.itemCount}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={cn(
                            "hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline",
                            u.active ? "bg-found-soft text-found" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {u.active ? "Active" : "Disabled"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={self || busy}
                          onClick={() => update(u, { active: !u.active })}
                          aria-label={`${u.active ? "Deactivate" : "Reactivate"} ${u.name}`}
                        >
                          {busy && <Loader2 className="animate-spin" />}
                          {u.active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
