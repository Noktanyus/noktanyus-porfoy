import { db } from "./db";
import bcrypt from "bcryptjs";

export const ADMIN_EMAIL = "admin@test.local";
export const ADMIN_PASSWORD = "TestPass123!";
export const USER_EMAIL = "user@test.local";
export const USER_PASSWORD = "TestPass123!";

/**
 * Test ortamında admin kullanıcı oluşturur veya var olanı getirir.
 * User.role = admin; env ADMIN_EMAIL ile sentetik giriş de hâlâ çalışır.
 */
export async function ensureAdminUser(opts?: {
  email?: string;
  password?: string;
  name?: string;
}) {
  const email = opts?.email ?? ADMIN_EMAIL;
  const password = opts?.password ?? ADMIN_PASSWORD;
  const name = opts?.name ?? "Test Admin";

  const existing = await db().user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "admin") {
      return db().user.update({ where: { id: existing.id }, data: { role: "admin" } });
    }
    return existing;
  }

  const hashed = await bcrypt.hash(password, 4);
  return db().user.create({
    data: {
      email,
      name,
      password: hashed,
      emailVerified: new Date(),
      role: "admin",
    },
  });
}

/**
 * Test ortamında standart bir normal kullanıcı oluşturur veya var olanı getirir.
 */
export async function ensureTestUser(opts?: {
  email?: string;
  password?: string;
  name?: string;
}) {
  const email = opts?.email ?? USER_EMAIL;
  const password = opts?.password ?? USER_PASSWORD;
  const name = opts?.name ?? "Test User";

  const existing = await db().user.findUnique({ where: { email } });
  if (existing) return existing;

  const hashed = await bcrypt.hash(password, 4);
  return db().user.create({
    data: {
      email,
      name,
      password: hashed,
      emailVerified: new Date(),
    },
  });
}

export async function createTestUser(prefix: string, password = USER_PASSWORD) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  const hashed = await bcrypt.hash(password, 4);
  return db().user.create({
    data: {
      email,
      name: prefix,
      password: hashed,
      emailVerified: new Date(),
    },
  });
}

export async function deleteUser(id: string) {
  try {
    await db().user.delete({ where: { id } });
  } catch {
    // ignore
  }
}


