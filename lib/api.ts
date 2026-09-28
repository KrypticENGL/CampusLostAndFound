import { NextResponse } from "next/server";

export function jsonError(status: number, error: string, details?: Record<string, string>) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status });
}

/** cuid ids are short lowercase alphanumerics; reject anything else before touching the DB. */
export function isValidId(id: string): boolean {
  return /^[a-z0-9]{20,32}$/.test(id);
}

export function serverError(err: unknown) {
  console.error("[api]", err);
  return jsonError(500, "Something went wrong on our side. Please try again.");
}
