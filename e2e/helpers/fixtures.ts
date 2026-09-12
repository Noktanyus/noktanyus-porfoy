import { db } from "./db";
import { randomBytes } from "crypto";
import { ensureTestUser as _ensureTestUser } from "./auth-server";

export const ensureTestUser = _ensureTestUser;

/**
 * Benzersiz bir slug üretir (test fixture'lar için).
 */
export function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${randomBytes(3).toString("hex")}@test.local`;
}

/**
 * Blog fixture — yazar ile birlikte blog oluşturur. Test sonunda deleteBlog ile silinir.
 */
export async function createBlogFixture(opts?: {
  slug?: string;
  title?: string;
  authorId?: string;
  published?: boolean;
}) {
  const slug = opts?.slug ?? uniqueSlug("blog");
  return db().blog.create({
    data: {
      slug,
      title: opts?.title ?? `Test Blog ${slug}`,
      description: "Test blog description for e2e",
      content: "# Test Blog\n\nThis is a test blog post content for e2e tests.",
      author: "Test Author",
      category: "Genel",
      tags: ["test", "e2e"],
      status: opts?.published === false ? "draft" : "published",
      publishedAt: opts?.published === false ? null : new Date(),
      viewCount: 0,
      readTimeMinutes: 1,
      likeCount: 0,
    },
  });
}

export async function deleteBlog(id: string) {
  try {
    await db().blog.delete({ where: { id } });
  } catch {
    // ignore
  }
}

export async function createProjectFixture(opts?: {
  slug?: string;
  title?: string;
}) {
  const slug = opts?.slug ?? uniqueSlug("project");
  return db().project.create({
    data: {
      slug,
      title: opts?.title ?? `Test Project ${slug}`,
      description: "Test project description for e2e",
      content: "# Test Project",
      technologies: ["Next.js", "TypeScript"],
      order: 0,
      featured: false,
      isLive: true,
    },
  });
}

export async function deleteProject(id: string) {
  try {
    await db().project.delete({ where: { id } });
  } catch {
    // ignore
  }
}

export async function createTemplateFixture(opts?: {
  slug?: string;
  name?: string;
  authorId?: string;
}) {
  const slug = opts?.slug ?? uniqueSlug("tpl");
  // Ensure we have an authorId (TemplateListing.author is required)
  let authorId = opts?.authorId;
  if (!authorId) {
    const user = await db().user.upsert({
      where: { email: `tpl-author-${Date.now()}@test.local` },
      update: {},
      create: {
        email: `tpl-author-${Date.now()}@test.local`,
        name: "Tpl Author",
        emailVerified: new Date(),
      },
    });
    authorId = user.id;
  }
  const data: any = {
    slug,
    name: opts?.name ?? `Test Template ${slug}`,
    tagline: "Test tagline",
    description: "Test template description",
    longDescription: "Long test description",
    category: "saas",
    previewImages: [],
    priceCents: 4900,
    currency: "try",
    licenseType: "single",
    features: [],
    techStack: [],
    version: "1.0.0",
    active: true,
    featured: false,
    authorId,
  };
  return db().templateListing.create({ data });
}

export async function deleteTemplate(id: string) {
  try {
    await db().templateListing.delete({ where: { id } });
  } catch {
    // ignore
  }
}

export async function createPlanFixture(opts?: {
  slug?: string;
  name?: string;
  stripePriceId?: string;
  stripeProductId?: string;
}) {
  const slug = opts?.slug ?? uniqueSlug("plan");
  return db().plan.create({
    data: {
      slug,
      name: opts?.name ?? `Test Plan ${slug}`,
      stripePriceId: opts?.stripePriceId ?? `price_${slug}`,
      stripeProductId: opts?.stripeProductId ?? `prod_${slug}`,
      interval: "MONTH",
      priceCents: 4900,
      currency: "try",
      features: [],
      active: true,
      isFeatured: false,
      order: 0,
      trialDays: 14,
    },
  });
}

export async function deletePlan(id: string) {
  try {
    await db().plan.delete({ where: { id } });
  } catch {
    // ignore
  }
}

export async function createApiKeyFixture(opts: {
  userId: string;
  name?: string;
  scopes?: string[];
}) {
  return db().apiKey.create({
    data: {
      userId: opts.userId,
      name: opts.name ?? `Test Key ${Date.now()}`,
      key: `nokt_test_${randomBytes(24).toString("hex")}`,
      prefix: `nokt_test_${randomBytes(4).toString("hex")}`,
      scopes: opts.scopes ?? ["read:monitor"],
      rateLimit: 60,
      totalRequests: 0,
    },
  });
}

export async function deleteApiKey(id: string) {
  try {
    await db().apiKey.delete({ where: { id } });
  } catch {
    // ignore
  }
}
