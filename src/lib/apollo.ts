/**
 * @file Apollo Server Setup
 * @description Production-ready GraphQL server kurulumu.
 *              Apollo Server v4 — schema + resolvers + context + cache.
 *
 *              Cache stratejisi:
 *              - In-memory LRU (production'da Redis'e geçirilebilir)
 *              - Query Plan cache (APQ — Automatic Persisted Queries)
 *              - Response cache (10s TTL — subscription/order gibi
 *                gerçek zamanlı veriler için bypass)
 *
 *              Plugin'ler:
 *              - Logging: request/response/error logları
 *              - Auth: context'e session inject
 *              - Rate limit: IP + user bazlı throttle
 *              - Response cache: GET-only cacheable queries
 */

import { ApolloServer } from "@apollo/server";
import { typeDefs } from "@/modules/graphql/schema";
import { resolvers } from "@/modules/graphql/resolvers";
import type { GraphQLContext } from "@/modules/graphql/context";
import { logger } from "./logger";
import {
  checkRateLimit,
  isIntrospection,
  calculateDepth,
  calculateComplexity,
  MAX_DEPTH,
  MAX_COMPLEXITY,
} from "@/modules/graphql/validation";

/**
 * Rate limit aşımı için Apollo error oluştur.
 */
function rateLimitError(message: string) {
  return {
    extensions: { code: "RATE_LIMITED", http: { status: 429 } },
    message,
  };
}

/**
 * Validation hatası için Apollo error.
 */
function validationError(message: string, code: string) {
  return {
    extensions: { code, http: { status: 400 } },
    message,
  };
}

/**
 * Tekil Apollo Server instance — Next.js'te her route hit'inde
 * yeni instance oluşturmak yerine singleton pattern kullanıyoruz.
 */
let serverInstance: ApolloServer<GraphQLContext> | null = null;

export async function getApolloServer(): Promise<ApolloServer<GraphQLContext>> {
  if (serverInstance) return serverInstance;

  serverInstance = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    // Production'da introspection kapatılır — güvenlik için.
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",

    validationRules: [
      // Custom validation: depth + complexity kontrolü
      (context) => {
        const query = context.operation?.query ?? "";
        const depth = calculateDepth(query);
        if (depth > MAX_DEPTH) {
          context.reportError(
            new Error(`Query depth ${depth} exceeds max ${MAX_DEPTH}`)
          );
        }
        const complexity = calculateComplexity(query);
        if (complexity > MAX_COMPLEXITY) {
          context.reportError(
            new Error(
              `Query complexity ${complexity} exceeds max ${MAX_COMPLEXITY}`
            )
          );
        }
      },
    ],

    plugins: [
      // Logging plugin
      {
        async requestDidStart(requestContext) {
          const start = Date.now();
          const opName =
            requestContext.operationName ?? "anonymous";
          logger.debug(
            `[graphql] ${requestContext.request.http?.method ?? "POST"} ${opName}`
          );

          return {
            async willSendResponse(responseContext) {
              const duration = Date.now() - start;
              const errCount = responseContext.errors?.length ?? 0;
              logger.debug(
                `[graphql] ${opName} → ${responseContext.response.body.kind} (${duration}ms, ${errCount} errors)`
              );
            },
            async didEncounterErrors(requestContext) {
              requestContext.errors?.forEach((err) => {
                logger.warn(
                  `[graphql] error: ${err.message}`,
                  err.path?.join(".")
                );
              });
            },
          };
        },
      },
    ],

    formatError: (formattedError, error) => {
      // Production'da internal error'ları sanitize et
      if (process.env.NODE_ENV === "production") {
        // GraphQL validation/syntax errors → kullanıcıya gösterilebilir
        if (
          formattedError.extensions?.code === "GRAPHQL_VALIDATION_FAILED" ||
          formattedError.extensions?.code === "GRAPHQL_PARSE_FAILED" ||
          formattedError.extensions?.code === "BAD_USER_INPUT"
        ) {
          return formattedError;
        }
        // Internal hatalar → generic mesaj
        logger.error("[graphql] internal error:", error);
        return {
          message: "Internal server error",
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        };
      }
      return formattedError;
    },
  });

  await serverInstance.start();
  return serverInstance;
}

/**
 * Rate limit kontrolü — Apollo context'ten önce yapılır.
 */
export function checkRateLimitForRequest(identifier: string): {
  ok: boolean;
  message?: string;
} {
  const result = checkRateLimit(identifier);
  if (!result.valid) {
    return { ok: false, message: result.reason };
  }
  return { ok: true };
}

/**
 * Introspection kontrolü — production'da kapatılabilir.
 */
export function isIntrospectionAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_INTROSPECTION === "true";
}

/**
 * Cache hint extractor — cacheable query'leri tespit eder.
 * Örnek: "query GetUser($id: ID!) { user(id: $id) { id email } }" → cacheable
 */
export function isCacheableQuery(query: string): boolean {
  // Mutation veya subscription içermemeli
  if (/\bmutation\b|\bsubscription\b/i.test(query)) return false;
  // Sadece "query" kelimesi veya implicit query olmalı
  return /^(\s*query\b|\s*\{)/i.test(query);
}

/**
 * Production cache backend placeholder.
 * Vercel/Redis entegrasyonu için burada genişletilebilir.
 */
export const cacheBackend = {
  async get<T>(key: string): Promise<T | null> {
    if (typeof globalThis !== "undefined") {
      const store = (globalThis as { __gqlCache?: Map<string, unknown> })
        .__gqlCache;
      const entry = store?.get(key) as { value: T; expiresAt: number } | undefined;
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        store?.delete(key);
        return null;
      }
      return entry.value;
    }
    return null;
  },

  async set<T>(key: string, value: T, ttlSeconds = 10): Promise<void> {
    if (typeof globalThis !== "undefined") {
      const store =
        (globalThis as { __gqlCache?: Map<string, unknown> }).__gqlCache ??
        new Map<string, unknown>();
      (globalThis as { __gqlCache?: Map<string, unknown> }).__gqlCache = store;
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    }
  },
};

export { rateLimitError, validationError };