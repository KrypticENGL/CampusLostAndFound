import "server-only";
import type { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { hashPassword, verifyPassword } from "./password";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  itemCount: number;
}

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists");
  }
}

export async function createUser(input: { name: string; email: string; password: string; role?: Role }) {
  try {
    return await db.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: hashPassword(input.password),
        role: input.role ?? "STUDENT",
      },
      select: { id: true, name: true, email: true, role: true },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new EmailTakenError();
    throw err;
  }
}

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "disabled" };

export async function authenticate(email: string, password: string): Promise<LoginResult> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  // Same generic error for unknown email and wrong password (no account enumeration).
  if (!user || !verifyPassword(password, user.passwordHash)) return { ok: false, reason: "invalid" };
  if (!user.active) return { ok: false, reason: "disabled" };
  return { ok: true, userId: user.id };
}

export async function listUsers(): Promise<UserDTO[]> {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    itemCount: u._count.items,
  }));
}

export async function updateUser(id: string, data: { role?: Role; active?: boolean }) {
  const exists = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return null;
  const [user] = await db.$transaction([
    db.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, active: true } }),
    // Deactivating a user signs them out everywhere.
    ...(data.active === false ? [db.session.deleteMany({ where: { userId: id } })] : []),
  ]);
  return user;
}
