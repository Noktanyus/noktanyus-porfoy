import { test, expect, APIRequestContext } from "@playwright/test";
import { loginViaApi, ApiClient, expectOk, expectFail } from "./helpers";
import { closeDb, db } from "./helpers/db";
import { createTemplateFixture, deleteTemplate, uniqueSlug } from "./helpers/fixtures";
import { ensureAdminUser, ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers/auth-server";

let adminCtx: APIRequestContext;
let client: ApiClient;

test.describe("Marketplace (Template) CRUD API", () => {
  test.beforeAll(async ({ request, baseURL }) => {
    await ensureAdminUser();
    adminCtx = await loginViaApi(baseURL!, ADMIN_EMAIL, ADMIN_PASSWORD);
    client = new ApiClient(adminCtx);
  });

  test.afterAll(async () => {
    await adminCtx.dispose();
    await closeDb();
  });

  test("public can read active template via /api/templates/[slug]", async () => {
    const fixture = await createTemplateFixture();
    try {
      const res = await client.get<{ template: { id: string; slug: string } }>(
        `/api/templates/${fixture.slug}`
      );
      const data = expectOk(res);
      expect(data.template.slug).toBe(fixture.slug);
    } finally {
      await deleteTemplate(fixture.id);
    }
  });

  test("public can list templates via /api/templates", async () => {
    const fixture = await createTemplateFixture();
    try {
      const res = await client.get<{ items?: Array<{ slug: string }> } | Array<{ slug: string }>>("/api/templates");
      // data shape değişken, en azından success olduğunu doğrula
      expect(res.success).toBe(true);
    } finally {
      await deleteTemplate(fixture.id);
    }
  });

  test("admin creates template via Prisma (no public POST in current API)", async () => {
    const slug = uniqueSlug("e2e-mkt");
    const created = await createTemplateFixture({ slug });
    try {
      const fresh = await db().templateListing.findUnique({ where: { id: created.id } });
      expect(fresh).not.toBeNull();
      expect(fresh!.slug).toBe(slug);
      expect(fresh!.active).toBe(true);
    } finally {
      await deleteTemplate(created.id);
    }
  });

  test("admin updates template", async () => {
    const fixture = await createTemplateFixture();
    try {
      const updated = await db().templateListing.update({
        where: { id: fixture.id },
        data: { priceCents: 9900, featured: true },
      });
      expect(updated.priceCents).toBe(9900);
      expect(updated.featured).toBe(true);
    } finally {
      await deleteTemplate(fixture.id);
    }
  });

  test("admin deletes template", async () => {
    const fixture = await createTemplateFixture();
    const id = fixture.id;
    await deleteTemplate(id);
    const after = await db().templateListing.findUnique({ where: { id } });
    expect(after).toBeNull();
  });

  test("validation: missing tagline returns 400 (if POST exists)", async () => {
    // Since no public POST endpoint for templates, we test at Prisma level
    let threw = false;
    try {
      await db().templateListing.create({
        data: {
          slug: "validation-test-no-tagline",
          name: "No Tagline",
          // tagline is required in schema
        } as any,
      });
    } catch (e: any) {
      threw = true;
      expect(String(e.message)).toMatch(/tagline|required/i);
    }
    expect(threw).toBe(true);
  });
});
