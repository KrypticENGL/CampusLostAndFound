import { NextResponse, type NextRequest } from "next/server";
import { createItem, getMatches, listItems } from "@/lib/items";
import { createItemSchema, fieldErrors, listQuerySchema } from "@/lib/validation";
import { jsonError, serverError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const parsed = listQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return jsonError(400, "Invalid query parameters", fieldErrors(parsed.error));
  try {
    const items = await listItems(parsed.data);
    return NextResponse.json({ items, count: items.length });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => undefined);
  if (body === undefined) return jsonError(400, "Request body must be valid JSON");
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "Please fix the highlighted fields", fieldErrors(parsed.error));
  try {
    const item = await createItem(parsed.data);
    const matches = await getMatches(item.id);
    return NextResponse.json({ item, matchCount: matches?.length ?? 0 }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
