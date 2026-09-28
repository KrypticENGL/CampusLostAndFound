import { NextResponse, type NextRequest } from "next/server";
import { getItem, updateItemStatus } from "@/lib/items";
import { fieldErrors, updateStatusSchema } from "@/lib/validation";
import { isValidId, jsonError, requireUser, serverError } from "@/lib/api";
import { canManageItem } from "@/lib/auth";

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

/** Mark a listing as resolved (reunited with its owner) or reopen it. Reporter or admin only. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  if (!isValidId(id)) return jsonError(400, "Invalid item id");
  const parsed = updateStatusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(422, "Invalid status", fieldErrors(parsed.error));
  const user = await requireUser();
  if (user instanceof Response) return user;
  try {
    const existing = await getItem(id);
    if (!existing) return jsonError(404, "Item not found");
    if (!canManageItem(user, existing.ownerId)) return jsonError(403, "Only the person who reported this item or an admin can change it");
    const item = await updateItemStatus(id, parsed.data.status);
    return item ? NextResponse.json({ item }) : jsonError(404, "Item not found");
  } catch (err) {
    return serverError(err);
  }
}
