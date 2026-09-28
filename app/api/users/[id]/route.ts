import { NextResponse, type NextRequest } from "next/server";
import { updateUser } from "@/lib/users";
import { fieldErrors, updateUserSchema } from "@/lib/validation";
import { isValidId, jsonError, requireAdmin, serverError } from "@/lib/api";

/** Admin-only: change role and/or activate/deactivate an account. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!isValidId(id)) return jsonError(400, "Invalid user id");
  const parsed = updateUserSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(422, "Invalid update", fieldErrors(parsed.error));

  // Prevent admins from locking themselves out.
  if (id === auth.id && (parsed.data.role === "STUDENT" || parsed.data.active === false)) {
    return jsonError(400, "You can't demote or deactivate your own account");
  }
  try {
    const user = await updateUser(id, parsed.data);
    return user ? NextResponse.json({ user }) : jsonError(404, "User not found");
  } catch (err) {
    return serverError(err);
  }
}
