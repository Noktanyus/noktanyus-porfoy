# 1. AŞAMA: Builder
FROM node:18-buster-slim AS builder

# Gerekli sistem kütüphanelerini kur
RUN apt-get update && apt-get install -y libssl1.1 openssl

WORKDIR /app

# Tüm proje dosyalarını kopyala
COPY . .

# Orijinal Prisma şemasını yedekle
RUN cp prisma/schema.prisma prisma/schema.prisma.original

# Build işlemi için Prisma şemasını SQLite kullanacak şekilde değiştir
RUN sed -i 's/provider\s*=\s*"postgresql"/provider = "sqlite"/' prisma/schema.prisma
RUN sed -i 's#url\s*=\s*env("DATABASE_URL")#url = "file:./dev.db"#' prisma/schema.prisma
# Bu sed komutları, PostgreSQL'e özgü tipleri SQLite uyumlu hale getirmek için gerekli olabilir.
RUN sed -i 's/String\[\]\s*@default(\[\])\s*@db.Text/String @default("")/g' prisma/schema.prisma
RUN sed -i 's/Json\s*@default("\[\]")/String @default("[]")/g' prisma/schema.prisma

# Bağımlılıkları kur (postinstall burada değiştirilmiş şema ile `prisma generate` çalıştırır)
RUN npm install

# Değiştirilmiş şema ile veritabanını oluştur
RUN npx prisma db push --accept-data-loss

# Next.js uygulamasını build et
# ÖNEMLİ: Next.js build işlemi, ortam değişkenlerini doğrular.
# Bu nedenle, build sırasında kullanılacak geçici değerler burada sağlanmalıdır.
RUN NEXTAUTH_URL="http://localhost:3000" \
    NEXTAUTH_SECRET="dummy-secret" \
    NEXT_PUBLIC_BASE_URL="http://localhost:3000" \
    ADMIN_EMAIL="admin@example.com" \
    ADMIN_PASSWORD="password" \
    GITHUB_USERNAME="user" \
    GITHUB_TOKEN="token" \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY="dummy-key" \
    TURNSTILE_SECRET_KEY="dummy-key" \
    EMAIL_SERVER="smtp.example.com" \
    EMAIL_PORT="587" \
    EMAIL_USER="user@example.com" \
    EMAIL_PASSWORD="password" \
    EMAIL_FROM="from@example.com" \
    EMAIL_FROM_NAME="Dummy Name" \
    npm run build

# 2. AŞAMA: Runner
FROM node:18-buster-slim AS runner

# Çalışma ortamı için gerekli kütüphaneler
RUN apt-get update && apt-get install -y libssl1.1 openssl

WORKDIR /app

# Güvenlik: root olmayan kullanıcı
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --disabled-password --no-create-home --gid 1001 --uid 1001 nextjs

# Gerekli dosyaları builder aşamasından kopyala
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# ÖNEMLİ: Production için değiştirilmemiş, orijinal Prisma şemasını kopyala
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma.original ./prisma/schema.prisma

# Kullanıcı olarak çalıştır
USER nextjs

# Portu dışarı aç
EXPOSE 3000

# Başlatıcı komut
CMD ["node", "server.js"]
