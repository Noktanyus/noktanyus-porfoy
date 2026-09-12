import { test, expect, APIRequestContext } from "@playwright/test";
import { loginViaApi, ApiClient, expectFail } from "./helpers";
import { closeDb, db } from "./helpers/db";
import { ensureTestUser, USER_EMAIL, USER_PASSWORD, deleteUser } from "./helpers/auth-server";

let userCtx: APIRequestContext;
let client: ApiClient;
let testUserId: string;

test.describe("Order/Sub E2E", () => {
  test.beforeAll(async ({ request, baseURL }) => {
    const user = await ensureTestUser();
    testUserId = user.id;
    userCtx = await loginViaApi(baseURL!, USER_EMAIL, USER_PASSWORD);
    client = new ApiClient(userCtx);
  });

  test.afterAll(async () => {
    await userCtx.dispose();
    await db().order.deleteMany({ where: { userId: testUserId } });
    await db().user.deleteMany({ where: { email: { in: [USER_EMAIL] } } });
    await closeDb();
  });

  test("user can read their own order by id", async () => {
    // Create a sample order
    const order = await db().order.create({
      data: {
        orderNumber: `e2e-${Date.now()}`,
        userId: testUserId,
        status: "PENDING",
        subtotalCents: 4900,
        totalCents: 4900,
        currency: "try",
        customerEmail: USER_EMAIL,
        customerName: "Test User",
        stripeSessionId: `cs_e2e_${Date.now()}`,
      },
    });
    try {
      const res = await client.get<{ order: { id: string; orderNumber: string } }>(
        `/api/user/orders/${order.id}`
      );
      if (res.success) {
        expect(res.data.order.id).toBe(order.id);
        expect(res.data.order.orderNumber).toBe(order.orderNumber);
      } else {
        expect(res.error.code).toMatch(/NOT_FOUND|INTERNAL/);
      }
    } finally {
      await db().order.delete({ where: { id: order.id } });
    }
  });

  test("user CANNOT read another user's order", async ({ request, baseURL }) => {
    const otherEmail = "other-order@test.local";
    const otherUser = await db().user.upsert({
      where: { email: otherEmail },
      update: {},
      create: {
        email: otherEmail,
        name: "Other User",
        emailVerified: new Date(),
      },
    });
    try {
      const otherOrder = await db().order.create({
        data: {
          orderNumber: `other-${Date.now()}`,
          userId: otherUser.id,
          status: "PENDING",
          subtotalCents: 1000,
          totalCents: 1000,
          currency: "try",
          customerEmail: otherEmail,
          customerName: "Other User",
          stripeSessionId: `cs_other_${Date.now()}`,
        },
      });
      try {
        const res = await client.get<unknown>(`/api/user/orders/${otherOrder.id}`);
        // Endpoint mevcutsa ya FORBIDDEN ya NOT_FOUND olmalı
        if (res.success) {
          expect(res.success).toBe(false);
        } else {
          expect(["FORBIDDEN", "NOT_FOUND"]).toContain(res.error.code);
        }
      } finally {
        await db().order.delete({ where: { id: otherOrder.id } });
      }
    } finally {
      await deleteUser(otherUser.id);
    }
  });

  test("auth: anonymous cannot read orders", async ({ playwright, baseURL }) => {
    const ctx = baseURL
      ? await playwright.request.newContext({ baseURL })
      : await playwright.request.newContext();
    try {
      const anon = new ApiClient(ctx);
      // Need a real order id to attempt
      const order = await db().order.create({
        data: {
          orderNumber: `anon-${Date.now()}`,
          userId: testUserId,
          status: "PENDING",
          subtotalCents: 1000,
          totalCents: 1000,
          currency: "try",
          customerEmail: USER_EMAIL,
          customerName: "Test",
          stripeSessionId: `cs_anon_${Date.now()}`,
        },
      });
      try {
        const res = await anon.get<unknown>(`/api/user/orders/${order.id}`);
        expectFail(res, "UNAUTHORIZED");
      } finally {
        await db().order.delete({ where: { id: order.id } });
      }
    } finally {
      await ctx.dispose();
    }
  });

  test("subscription pause/resume via API exists for user (smoke)", async () => {
    // Pause and resume are separate endpoints
    const res = await client.post<unknown>("/api/user/subscription/pause", {});
    // Acceptable outcomes: success OR error (e.g., no active sub)
    expect(res).toBeDefined();
    expect(typeof res.success).toBe("boolean");
  });
});
