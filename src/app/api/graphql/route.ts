/**
 * @file GraphQL API Endpoint
 * @description /api/graphql route — POST/GET ile GraphQL sorgularını kabul eder.
 *              Authentication: NextAuth session context'ten inject edilir.
 *              Rate limiting: validation.checkRateLimit ile.
 */

import { NextResponse } from "next/server";
import { typeDefs } from "@/modules/graphql/schema";
import { resolvers, createGraphQLContext } from "@/modules/graphql/resolvers";
import {
  validateQuery,
  checkRateLimit,
  isMutation,
} from "@/modules/graphql/validation";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Basit GraphQL executor — production'da graphql-yoga veya apollo-server
// kullanılmalı. Burada learning/demo için custom minimal executor.
async function executeGraphQL(
  query: string,
  variables: Record<string, unknown> | undefined,
  context: Awaited<ReturnType<typeof createGraphQLContext>>
) {
  // Operation tipini belirle (query/mutation)
  const operation = isMutation(query) ? "mutation" : "query";

  // Field resolver routing
  const errors: Array<{ message: string }> = [];
  let data: Record<string, unknown> = {};

  try {
    // Her top-level field için resolver çalıştır
    const fieldMatches = query.match(/(?:query|mutation)\s*(?:\([^)]*\))?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);

    if (!fieldMatches) {
      return { data: null, errors: [{ message: "Invalid GraphQL syntax" }] };
    }

    // En basit implementasyon: typeDefs'tan field listesini çıkar ve resolver'lara yönlendir
    const fieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*\{/g;
    let match: RegExpExecArray | null;

    while ((match = fieldPattern.exec(query)) !== null) {
      const fieldName = match[1];
      if (["query", "mutation"].includes(fieldName.toLowerCase())) continue;

      // Resolver'ı çağır
      const resolver =
        operation === "mutation"
          ? (resolvers.Mutation as Record<string, unknown>)[fieldName]
          : (resolvers.Query as Record<string, unknown>)[fieldName];

      if (typeof resolver !== "function") {
        errors.push({ message: `Unknown field: ${fieldName}` });
        continue;
      }

      // Argument'ları parse et (basit regex ile)
      const args = parseArgs(query, fieldName);

      try {
        const result = await (
          resolver as (parent: unknown, args: Record<string, unknown>, ctx: unknown) => Promise<unknown>
        )(null, args, context);
        data[fieldName] = result;
      } catch (err) {
        errors.push({ message: (err as Error).message ?? "Resolver error" });
      }
    }

    return { data, errors };
  } catch (err) {
    logger.error("[graphql] executor error:", err);
    return { data: null, errors: [{ message: (err as Error).message }] };
  }
}

/**
 * Basit argument parser — `fieldName(arg1: "value", arg2: 123)`.
 */
function parseArgs(query: string, fieldName: string): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  const regex = new RegExp(`${fieldName}\\s*\\(([^)]*)\\)`);
  const match = regex.exec(query);
  if (!match) return args;

  const pairs = match[1].split(",");
  for (const pair of pairs) {
    const [key, rawValue] = pair.split(":").map((s) => s.trim());
    if (!key || !rawValue) continue;
    args[key] = parseValue(rawValue);
  }
  return args;
}

function parseValue(raw: string): unknown {
  const trimmed = raw.trim();
  // String literal
  if (/^["'].*["']$/.test(trimmed)) return trimmed.slice(1, -1);
  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  // Boolean
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  // Enum
  return trimmed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query as string | undefined;
    const variables = body?.variables as Record<string, unknown> | undefined;

    if (!query) {
      return NextResponse.json(
        { errors: [{ message: "Missing query" }] },
        { status: 400 }
      );
    }

    // Query validation
    const validation = validateQuery(query);
    if (!validation.valid) {
      return NextResponse.json(
        { errors: [{ message: validation.reason ?? "Invalid query" }] },
        { status: 400 }
      );
    }

    // Rate limiting — IP bazlı (basit)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.valid) {
      return NextResponse.json(
        { errors: [{ message: rateCheck.reason ?? "Rate limit exceeded" }] },
        { status: 429 }
      );
    }

    const context = await createGraphQLContext();
    const result = await executeGraphQL(query, variables, context);

    return NextResponse.json(result);
  } catch (err) {
    logger.error("[graphql] POST error:", err);
    return NextResponse.json(
      { errors: [{ message: "Internal server error" }] },
      { status: 500 }
    );
  }
}

export async function GET() {
  // GET sadece introspection/schema döndürür
  return NextResponse.json({
    message: "GraphQL endpoint. POST a JSON body with { query, variables }.",
    schema: typeDefs,
    playground: "/api/graphql (POST only)",
  });
}