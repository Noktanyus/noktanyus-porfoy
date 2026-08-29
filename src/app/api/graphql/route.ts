/**
 * @file GraphQL API Endpoint
 * @description /api/graphql route — Apollo Server v4 ile çalışır.
 *              POST/GET ile GraphQL sorgularını kabul eder.
 *              Authentication: NextAuth session context'ten inject edilir.
 *              Rate limiting: IP bazlı (Apollo context'inden önce).
 *
 *              Apollo Server start-up maliyeti yüksek olduğu için
 *              singleton pattern kullanılır (src/lib/apollo.ts).
 */

import { NextResponse } from "next/server";
import {
  getApolloServer,
  checkRateLimitForRequest,
  isCacheableQuery,
  cacheBackend,
} from "@/lib/apollo";
import { createGraphQLContext } from "@/modules/graphql/resolvers";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cache key — query + variables hash'i.
 * Aynı sorgu + aynı değişkenler için aynı cache entry'si.
 */
function buildCacheKey(query: string, variables?: Record<string, unknown>): string {
  const varStr = variables ? JSON.stringify(variables) : "";
  // Basit hash — collision production'da SHA-256 kullanılabilir
  let hash = 0;
  const combined = query + varStr;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return `gql:${hash.toString(36)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query as string | undefined;
    const variables = body?.variables as Record<string, unknown> | undefined;
    const operationName = body?.operationName as string | undefined;

    if (!query) {
      return NextResponse.json(
        { errors: [{ message: "Missing query in request body" }] },
        { status: 400 }
      );
    }

    // Rate limit — IP bazlı
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateCheck = checkRateLimitForRequest(ip);
    if (!rateCheck.ok) {
      return NextResponse.json(
        { errors: [{ message: rateCheck.message ?? "Rate limit exceeded" }] },
        { status: 429 }
      );
    }

    // Cache — sadece GET-cacheable queries için
    const cacheKey = buildCacheKey(query, variables);
    if (isCacheableQuery(query)) {
      const cached = await cacheBackend.get<unknown>(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { "x-graphql-cache": "HIT" },
        });
      }
    }

    // Apollo Server üzerinden execute
    const server = await getApolloServer();
    const context = await createGraphQLContext();

    const result = await server.executeOperation(
      { query, variables, operationName },
      { contextValue: context }
    );

    // result.body tek bir kind: 'single' | 'incremental' (subscription)
    if (result.body.kind === "single") {
      const response = {
        data: result.body.singleResult.data,
        errors: result.body.singleResult.errors,
      };

      // Cacheable query ise sonucu sakla
      if (isCacheableQuery(query) && !response.errors) {
        await cacheBackend.set(cacheKey, response, 10);
      }

      return NextResponse.json(response, {
        headers: { "x-graphql-cache": "MISS" },
      });
    }

    // Incremental delivery (subscription/streaming) — şu an desteklenmiyor
    return NextResponse.json(
      { errors: [{ message: "Incremental delivery not supported on this endpoint" }] },
      { status: 400 }
    );
  } catch (err) {
    logger.error("[graphql] POST error:", err);
    return NextResponse.json(
      { errors: [{ message: "Internal server error" }] },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  // Apollo Sandbox/Playground introspection — sadece non-production'da
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "GraphQL endpoint. POST a JSON body with { query, variables }." },
      { status: 200 }
    );
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("query");
  const variablesParam = url.searchParams.get("variables");
  const operationName = url.searchParams.get("operationName") ?? undefined;

  if (!query) {
    // Sandbox UI HTML — Apollo Sandbox CDN'den yüklenir
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphQL Sandbox</title>
  <link rel="stylesheet" href="https://apollo-server-cdn.example.com/sandbox.css" />
</head>
<body>
  <div id="sandbox" style="height:100vh"></div>
  <script src="https://apollo-server-cdn.example.com/sandbox.js"></script>
  <script>
    window.addEventListener('load', function() {
      if (window.EmbeddedSandbox) {
        new window.EmbeddedSandbox({
          target: '#sandbox',
          endpoint: '/api/graphql',
        });
      }
    });
  </script>
  <noscript>Sandbox requires JavaScript.</noscript>
</body>
</html>`;
    return new NextResponse(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // GET query — POST'a forward et
  try {
    const variables = variablesParam ? JSON.parse(variablesParam) : undefined;
    const body = JSON.stringify({ query, variables, operationName });
    const newReq = new Request(req.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    return await POST(newReq);
  } catch (err) {
    return NextResponse.json(
      { errors: [{ message: `Invalid variables JSON: ${(err as Error).message}` }] },
      { status: 400 }
    );
  }
}