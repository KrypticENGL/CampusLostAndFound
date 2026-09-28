import { NextResponse, type NextRequest } from "next/server";
import { createSession } from "@/lib/auth";
import { createUser, EmailTakenError } from "@/lib/users";
import { fieldErrors, registerSchema } from "@/lib/validation";
import { jsonError, serverError } from "@/lib/api";

/** Public sign-up. Always creates a STUDENT account and signs it in. */
export async function POST(req: NextRequest) {
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(422, "Please fix the highlighted fields", fieldErrors(parsed.error));
  try {
    const user = await createUser(parsed.data);
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof EmailTakenError) return jsonError(409, err.message, { email: err.message });
    return serverError(err);
  }
}
