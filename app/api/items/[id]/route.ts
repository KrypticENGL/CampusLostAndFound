import { NextResponse, type NextRequest } from "next/server";
import { getItem, updateItemStatus } from "@/lib/items";
import { fieldErrors, updateStatusSchema } from "@/lib/validation";
import { isValidId, jsonError, serverError } from "@/lib/api";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  if (!isValidId(id)) return jsonError(400, "Invalid item id");
  try {
    const item = await getItem(id);
    return item ? NextResponse.json({ item }) : jsonError(404, "Item not found");
  } catch (err) {
    return serverError(err);
  }
}

/** Mark a listing as resolved (reunited with its owner) or reopen it. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  if (!isValidId(id)) return jsonError(400, "Invalid item id");
  const parsed = updateStatusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(422, "Invalid status", fieldErrors(parsed.error));
  try {
    const item = await updateItemStatus(id, parsed.data.status);
    return item ? NextResponse.json({ item }) : jsonError(404, "Item not found");
  } catch (err) {
    return serverError(err);
  }
}
