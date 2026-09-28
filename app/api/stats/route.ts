import { NextResponse } from "next/server";
import { getStats } from "@/lib/items";
import { serverError } from "@/lib/api";

export async function GET() {
  try {
    return NextResponse.json(await getStats());
  } catch (err) {
    return serverError(err);
  }
}
