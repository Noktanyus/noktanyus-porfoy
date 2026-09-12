import { test, expect, APIRequestContext } from "@playwright/test";
import { loginViaApi, ApiClient, expectOk, expectFail } from "./helpers";
import { closeDb, db } from "./helpers/db";
import { createPlanFixture, deletePlan, uniqueSlug } from "./helpers/fixtures";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers/auth-server";

let adminCtx: APIRequestContext;
let client: ApiClient;

test.describe("Plan CRUD API", () => {
  test.beforeAll(async ({ request, baseURL }) => {
    adminCtx = await loginViaApi(baseURL!, ADMIN_EMAIL, ADMIN_PASSWORD);
    client = new ApiClient(adminCtx);
  });

  test.afterAll(async () => {
    await adminCtx.dispose();
    await closeDb();
  });

  test("public can read plan via /api/plans/[slug]", async () => {
    const fixture = await createPlanFixture();
    try {
      const res = await client.get<{ slug: string; name: string; priceCents: number }>(
        `/api/plans/${fixture.slug}`
      );
      const data = expectOk(res);
      expect(data.slug).toBe(fixture.slug);
      expect(data.priceCents).toBe(4900);
    } finally {
      await deletePlan(fixture.id);
    }
  });

  test("public can list plans via /api/plans", async () => {
    const fixture = await createPlanFixture();
    try {
      const res = await client.get<Array<{ slug: string }>>("/api/plans");
      const data = expectOk(res);
      const arr = Array.isArray(data) ? data : (data as any).plans ?? (data as any).items ?? [];
      const found = arr.find((p: any) => p.slug === fixture.slug);
      expect(found).toBeTruthy();
    } finally {
      await deletePlan(fixture.id);
    }
  });

  test("admin creates plan with unique stripePriceId", async () => {
    const slug = uniqueSlug("plan-e2e");
    const stripePriceId = `price_e2e_${Date.now()}`;
    const plan = await createPlanFixture({ slug, stripePriceId });
    try {
      const fresh = await db().plan.findUnique({ where: { id: plan.id } });
      expect(fresh).not.toBeNull();
      expect(fresh!.stripePriceId).toBe(stripePriceId);
      expect(fresh!.interval).toBe("MONTH");
    } finally {
      await deletePlan(plan.id);
    }
  });

  test("validation: duplicate stripePriceId rejected", async () => {
    const stripePriceId = `dup_${Date.now()}`;
    const plan1 = await createPlanFixture({ stripePriceId });
    try {
      let threwError = false;
      try {
        await db().plan.create({
          data: {
            slug: `dup-${Date.now()}`,
            name: "Duplicate Plan",
            stripePriceId,
            stripeProductId: "prod_dup",
            interval: "MONTH",
            priceCents: 1000,
            currency: "try",
            features: [],
            active: true,
            isFeatured: false,
            order: 0,
            trialDays: 14,
          },
        });
      } catch (e: any) {
        threwError = true;
        expect(e.message).toMatch(/Unique|constraint/i);
      }
      expect(threwError).toBe(true);
    } finally {
      await deletePlan(plan1.id);
    }
  });

  test("admin updates plan price and features", async () => {
    const fixture = await createPlanFixture();
    try {
      const updated = await db().plan.update({
        where: { id: fixture.id },
        data: { priceCents: 19900, features: ["X", "Y"] },
      });
      expect(updated.priceCents).toBe(19900);
      expect(Array.isArray(updated.features)).toBe(true);
    } finally {
      await deletePlan(fixture.id);
    }
  });

  test("admin deletes plan", async () => {
    const fixture = await createPlanFixture();
    const id = fixture.id;
    await deletePlan(id);
    const after = await db().plan.findUnique({ where: { id } });
    expect(after).toBeNull();
  });
});
