# Stage 1: Bağımlılıkları yükle
FROM node:24 AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm cache clean --force && npm install --legacy-peer-deps --no-audit --prefer-offline

# Stage 2: Uygulamayı build et
FROM node:24 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}
ENV NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY:-dummy}
ENV DATABASE_URL="postgresql://noktanyus:password@db:5432/noktanyus_porfoy?schema=public"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="f6578a9c2b4d1e3f8a9c2b4d1e3f8a9c"
ENV ADMIN_EMAIL="admin@noktanyus.com"
ENV ADMIN_PASSWORD="adminpassword123"
ENV EMAIL_SERVER="smtp.gmail.com"
ENV EMAIL_PORT="587"
ENV EMAIL_USER="admin@noktanyus.com"
ENV EMAIL_PASSWORD="password"

RUN npx prisma generate --schema=./prisma/schema.prisma \
  && npx next build \
  && mkdir -p /app/.next/standalone/node_modules \
  && cp -r /app/node_modules/.prisma /app/.next/standalone/node_modules/.prisma \
  && cp -r /app/node_modules/@prisma /app/.next/standalone/node_modules/@prisma

# Stage 3: Production runtime (standalone — npm ci / COPY . YOK)
FROM node:24-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD ["node", "server.js"]
