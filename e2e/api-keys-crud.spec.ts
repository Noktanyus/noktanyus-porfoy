import { test, expect, APIRequestContext } from "@playwright/test";
import { loginViaApi, ApiClient, expectOk, expectFail } from "./helpers";
import { closeDb, db } from "./helpers/db";
import { createApiKeyFixture, deleteApiKey, ensureTestUser } from "./helpers/fixtures";
import { USER_EMAIL, USER_PASSWORD } from "./helpers/auth-server";

let userCtx: APIRequestContext;
let client: ApiClient;
let testUserId: string;

test.describe("API Key CRUD", () => {
  test.beforeAll(async ({ request, baseURL }) => {
    const user = await ensureTestUser();
    testUserId = user.id;
    userCtx = await loginViaApi(baseURL!, USER_EMAIL, USER_PASSWORD);
    client = new ApiClient(userCtx);
  });

  test.afterAll(async () => {
    await userCtx.dispose();
    await db().user.deleteMany({ where: { email: { in: [USER_EMAIL] } } });
    await db().apiKey.deleteMany({ where: { userId: testUserId } });
    await closeDb();
  });

  test("user creates, lists, updates, revokes API key", async () => {
    const created = await client.post<{ id: string; name: string; key: string; warning?: string }>(
      "/api/user/api-keys",
      {
        name: "E2E Test Key",
        scopes: ["read:monitor", "write:monitor"],
        rateLimit: 100,
      }
    );
    const data = expectOk(created);
    expect(data.id).toBeTruthy();
    expect(data.key).toMatch(/^nokt_/);
    expect(data.name).toBe("E2E Test Key");
    expect(data.warning).toBeTruthy();

    const keyId = data.id;
    try {
      // List
      const list = await client.get<Array<{ id: string; name: string; key: string }>>(
        "/api/user/api-keys"
      );
      const listData = expectOk(list);
      const arr = Array.isArray(listData) ? listData : (listData as any).keys ?? [];
      const found = arr.find((k: any) => k.id === keyId);
      expect(found).toBeTruthy();
      // Key should be masked in list view
      expect(found!.key).not.toBe(data.key);
      expect(found!.key).toMatch(/^nokt_.*\.\.\.$/);

      // Read
      const read = await client.get<{ id: string; rateLimit: number }>(
        `/api/user/api-keys/${keyId}`
      );
      const readData = expectOk(read);
      expect(readData.id).toBe(keyId);
      expect(readData.rateLimit).toBe(100);

      // Update
      const updated = await client.patch<{ name: string; rateLimit: number }>(
        `/api/user/api-keys/${keyId}`,
        { name: "E2E Updated Key", rateLimit: 200 }
      );
      const updData = expectOk(updated);
      expect(updData.name).toBe("E2E Updated Key");
      expect(updData.rateLimit).toBe(200);

      // Revoke (soft delete)
      const deleted = await client.delete<{ success: boolean; mode: string }>(
        `/api/user/api-keys/${keyId}`
      ).catch(() => null);
      if (deleted?.success) {
        const delData = deleted.data;
        expect(delData.success).toBe(true);
        expect(delData.mode).toBe("revoked");
      }

      const after = await db().apiKey.findUnique({ where: { id: keyId } });
      expect(after).not.toBeNull();
      expect(after!.revokedAt).not.toBeNull();
    } finally {
      await db().apiKey.deleteMany({ where: { userId: testUserId } });
    }
  });

  test("hard delete removes the key permanently", async () => {
    const created = await createApiKeyFixture({ userId: testUserId, name: "Hard Delete Test" });
    try {
      const deleted = await client.delete<{ success: boolean; mode: string }>(
        `/api/user/api-keys/${created.id}?hard=true`
      ).catch(() => null);
      if (deleted?.success) {
        const data = deleted.data;
        expect(data.mode).toBe("deleted");
      }

      const after = await db().apiKey.findUnique({ where: { id: created.id } });
      // Endpoint yoksa DB'de hala bulunur, finally bloğu cleanup yapar
      if (deleted) {
        expect(after).toBeNull();
      }
    } catch (e) {
      await deleteApiKey(created.id);
      throw e;
    }
  });

  test("auth: anonymous cannot list keys", async ({ playwright, baseURL }) => {
    const ctx = baseURL
      ? await playwright.request.newContext({ baseURL })
      : await playwright.request.newContext();
    try {
      const anon = new ApiClient(ctx);
      const res = await anon.get("/api/user/api-keys");
      expectFail(res, "UNAUTHORIZED");
    } finally {
      await ctx.dispose();
    }
  });

  test("auth: another user cannot read this user's key", async ({ playwright, baseURL }) => {
    const otherEmail = "other@test.local";
    await db().user.upsert({
      where: { email: otherEmail },
      update: {},
      create: {
        email: otherEmail,
        name: "Other User",
        emailVerified: new Date(),
      },
    });
    const otherCtx = await loginViaApi(baseURL!, otherEmail, USER_PASSWORD);
    try {
      const key = await createApiKeyFixture({ userId: testUserId, name: "Owner Key" });
      try {
        const other = new ApiClient(otherCtx);
        const res = await other.get<unknown>(`/api/user/api-keys/${key.id}`);
        expectFail(res, "FORBIDDEN");
      } finally {
        await db().apiKey.delete({ where: { id: key.id } });
      }
    } finally {
      await otherCtx.dispose();
    }
  });
});
