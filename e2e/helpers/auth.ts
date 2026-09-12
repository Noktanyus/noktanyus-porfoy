import { Page, APIRequestContext, request as pwRequest, APIResponse as PWResponse } from "@playwright/test";
import { ensureAdminUser, ensureTestUser } from "./auth-server";
import { db } from "./db";

export const ADMIN_EMAIL = "admin@test.local";
export const ADMIN_PASSWORD = "TestPass123!";
export const USER_EMAIL = "user@test.local";
export const USER_PASSWORD = "TestPass123!";

/**
 * NextAuth credentials login akışı üzerinden session alır.
 * Testlerde gerçek auth kullanır; bypass yerine NextAuth'ın kendi endpoint'ini kullanır.
 */
export async function loginViaApi(
  baseURL: string,
  email: string,
  password: string
): Promise<APIRequestContext> {
  if (email === ADMIN_EMAIL) {
    await ensureAdminUser();
  } else {
    await ensureTestUser({ email, password });
  }

  const ctx = await pwRequest.newContext({ baseURL });
  // NextAuth credentials login akışı: CSRF al, credentials POST et, session cookie otomatik set edilir
  const csrfRes = await ctx.get("/api/auth/csrf");
  const csrfJson = (await csrfRes.json()) as { csrfToken: string };
  const loginRes = await ctx.post("/api/auth/callback/credentials", {
    form: {
      email,
      password,
      csrfToken: csrfJson.csrfToken,
      callbackUrl: baseURL,
      json: "true",
    },
    maxRedirects: 0,
  });
  if (!loginRes.ok() && loginRes.status() >= 400) {
    throw new Error(`Login failed: ${loginRes.status()} ${await loginRes.text()}`);
  }
  return ctx;
}

/**
 * Browser context üzerinden login olur ve sayfayı döner.
 */
export async function loginViaUi(
  page: Page,
  email: string,
  password: string
) {
  const ctx = page.context().request;
  const csrfRes = await ctx.get("/api/auth/csrf");
  const csrfJson = (await csrfRes.json()) as { csrfToken: string };
  const loginRes = await ctx.post("/api/auth/callback/credentials", {
    form: {
      email,
      password,
      csrfToken: csrfJson.csrfToken,
      callbackUrl: page.url(),
      json: "true",
    },
    maxRedirects: 0,
  });
  if (!loginRes.ok() && loginRes.status() >= 400) {
    throw new Error(`Login failed: ${loginRes.status()} ${await loginRes.text()}`);
  }
  await page.goto("/dashboard");
}

export async function loginAndSaveStorage(
  page: Page,
  email: string,
  password: string,
  storagePath: string
) {
  await loginViaUi(page, email, password);
  await page.context().storageState({ path: storagePath });
}

export async function setupTestUsers() {
  await ensureAdminUser();
  await ensureTestUser();
  return {
    admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    user: { email: USER_EMAIL, password: USER_PASSWORD },
  };
}

export async function cleanupTestData() {
  try {
    await db().user.deleteMany({
      where: { email: { in: [ADMIN_EMAIL, USER_EMAIL] } },
    });
  } catch {
    // ignore
  }
}


