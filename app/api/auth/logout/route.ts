import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { serverError } from "@/lib/api";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
