# Stage 1: Bağımlılıkları yükle
FROM node:22 AS deps
WORKDIR /app

# Paket dosyalarını kopyala
COPY package.json package-lock.json ./

# Bağımlılıkları yükle
RUN npm ci

# Stage 2: Uygulamayı build et
FROM node:22 AS builder
WORKDIR /app

# Bağımlılıkları ve kaynak kodu kopyala
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY

# Çevresel değişkenleri ayarla (Build zamanı için - Dummy değerler)
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="f6578a9c2b4d1e3f8a9c2b4d1e3f8a9c"
ENV ADMIN_EMAIL="admin@noktanyus.com"
ENV ADMIN_PASSWORD="adminpassword123"
ENV EMAIL_SERVER="smtp.gmail.com"
ENV EMAIL_PORT="587"
ENV EMAIL_USER="admin@noktanyus.com"
ENV EMAIL_PASSWORD="password"
ENV NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Prisma Client'ı oluştur ve build et
RUN npx prisma generate --schema=./prisma/schema.prisma && \
    find src/app -name "page.tsx" -exec sed -i 's/export async function generateStaticParams/export async function _generateStaticParams/g' {} + && \
    sed -i 's/import dynamic from "next\/dynamic"/import nextDynamic from "next\/dynamic"/g' src/app/layout.tsx && \
    sed -i 's/dynamic(() =>/nextDynamic(() =>/g' src/app/layout.tsx && \
    echo "export const dynamic = 'force-dynamic';" >> src/app/layout.tsx && \
    npx next build

# Stage 3: Çalışma zamanı imajı
FROM node:22-slim AS runner
WORKDIR /app

# Slim imajda gerekli olabilecek kütüphaneler
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Gerekli dosyaları kopyala (Standalone output için)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Portu ayarla
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Uygulamayı başlat
CMD ["node", "server.js"]
