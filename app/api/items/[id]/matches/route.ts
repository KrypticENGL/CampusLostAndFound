import { NextResponse, type NextRequest } from "next/server";
import { getMatches } from "@/lib/items";
import { isValidId, jsonError, serverError } from "@/lib/api";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/items/[id]/matches">) {
  const { id } = await ctx.params;
  if (!isValidId(id)) return jsonError(400, "Invalid item id");
  try {
    const matches = await getMatches(id);
    return matches ? NextResponse.json({ matches }) : jsonError(404, "Item not found");
  } catch (err) {
    return serverError(err);
  }
}
