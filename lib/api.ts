import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "./auth";

export function jsonError(status: number, error: string, details?: Record<string, string>) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status });
}

/** cuid ids are short lowercase alphanumerics; reject anything else before touching the DB. */
export function isValidId(id: string): boolean {
  return /^[a-z0-9]{20,32}$/.test(id);
}

/** Returns the signed-in user, or a 401/403 Response to return directly from the handler. */
export async function requireUser(): Promise<SessionUser | Response> {
  const user = await getCurrentUser();
  return user ?? jsonError(401, "Please log in to continue");
}

export async function requireAdmin(): Promise<SessionUser | Response> {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Please log in to continue");
  return user.role === "ADMIN" ? user : jsonError(403, "Admins only");
}

export function serverError(err: unknown) {
  console.error("[api]", err);
  return jsonError(500, "Something went wrong on our side. Please try again.");
}
