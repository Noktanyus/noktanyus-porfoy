# Dockerfile

# --- 1. Aşama: Builder ---
# Bu aşamada projenin bağımlılıkları yüklenir ve build işlemi yapılır.
# Alpine yerine standart Node.js imajını kullanıyoruz. Bu, git ve sharp için gerekli tüm bağımlılıkları içerir.
FROM node:22 AS builder

# Build sırasında kullanılacak argümanları tanımla
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD
# TURNSTILE_SECRET_KEY kaldırıldı
ARG EMAIL_SERVER
ARG EMAIL_PORT
ARG EMAIL_USER
ARG EMAIL_PASSWORD
ARG NEXT_PUBLIC_BASE_URL
# NEXT_PUBLIC_TURNSTILE_SITE_KEY kaldırıldı

# Uygulama için çalışma dizini oluştur
WORKDIR /app

# Bağımlılıkları kopyala
COPY package.json package-lock.json ./

# Önce tüm bağımlılıkları yükle (devDependencies dahil)
RUN npm ci

# Prisma şemasını kopyala
COPY prisma ./prisma
# Tüm proje dosyalarını kopyala
COPY . .

# Prisma Client'ı oluştur (CI schema ile)
RUN npx prisma generate --schema=./prisma/schema.ci.prisma

# Environment variables'ları ayarla
ENV DATABASE_URL=${DATABASE_URL:-"file:./docker.db"}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-"http://localhost:3000"}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-"docker-build-secret"}
ENV ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@example.com"}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD:-"admin123"}
ENV EMAIL_SERVER=${EMAIL_SERVER:-"smtp.example.com"}
ENV EMAIL_PORT=${EMAIL_PORT:-"587"}
ENV EMAIL_USER=${EMAIL_USER:-"test@example.com"}
ENV EMAIL_PASSWORD=${EMAIL_PASSWORD:-"testpassword"}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL:-"http://localhost:3000"}
ENV SKIP_ENV_VALIDATION=true

# Database'i hazırla
RUN npx prisma db push --schema=./prisma/schema.ci.prisma --accept-data-loss

# Projeyi build et
RUN npx next build

# Build sonrası gereksiz devDependencies'i kaldır
RUN npm prune --production

# --- 2. Aşama: Runner ---
# Bu aşamada, build edilmiş olan hafif ve çalıştırılabilir uygulama oluşturulur.
# Alpine yerine standart Node.js imajını kullanıyoruz.
FROM node:22 AS runner

WORKDIR /app

# Güvenlik için root olmayan bir kullanıcı oluştur
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Gerekli dosyaları builder aşamasından kopyala
COPY --from=builder /app/public ./public
COPY --from=builder /app/.git ./.git
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Dosya sahipliğini yeni kullanıcıya ver (zaten chown ile yapıldı, ama genel bir güvence)
RUN chown -R nextjs:nodejs .

# Yeni kullanıcıya geçiş yap
USER nextjs

# Uygulamanın çalışacağı portu belirt
EXPOSE 3000

# Ortam değişkeni ile portu ayarla
ENV PORT 3000

# Uygulamayı başlat
CMD ["node", "server.js"]