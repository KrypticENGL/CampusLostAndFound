import { NextResponse, type NextRequest } from "next/server";
import { createUser, EmailTakenError, listUsers } from "@/lib/users";
import { adminCreateUserSchema, fieldErrors } from "@/lib/validation";
import { jsonError, requireAdmin, serverError } from "@/lib/api";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  try {
    return NextResponse.json({ users: await listUsers() });
  } catch (err) {
    return serverError(err);
  }
}

/** Admin-only: create a user with any role (does not change the admin's own session). */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const parsed = adminCreateUserSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(422, "Please fix the highlighted fields", fieldErrors(parsed.error));
  try {
    return NextResponse.json({ user: await createUser(parsed.data) }, { status: 201 });
  } catch (err) {
    if (err instanceof EmailTakenError) return jsonError(409, err.message, { email: err.message });
    return serverError(err);
  }
}
