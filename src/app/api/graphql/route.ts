/**
 * @file GraphQL route handler
 * @description Mounts Apollo Server on the Next.js App Router and exposes
 *              it at `/api/graphql`. Both GET (Apollo Sandbox/Explorer) and
 *              POST (query/mutation JSON) are supported.
 */

import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
});

const handler = startServerAndCreateNextHandler(server, {
  // Pass context per-request (placeholder for future auth/data loaders)
  context: async () => ({}),
});

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}

// Always run on the server, never statically optimized.
export const dynamic = 'force-dynamic';