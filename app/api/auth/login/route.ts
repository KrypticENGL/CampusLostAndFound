import { NextResponse, type NextRequest } from "next/server";
import { createSession } from "@/lib/auth";
import { authenticate } from "@/lib/users";
import { fieldErrors, loginSchema } from "@/lib/validation";
import { jsonError, serverError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(422, "Please fix the highlighted fields", fieldErrors(parsed.error));
  try {
    const result = await authenticate(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      return result.reason === "disabled"
        ? jsonError(403, "This account has been deactivated. Contact an administrator.")
        : jsonError(401, "Invalid email or password");
    }
    await createSession(result.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
