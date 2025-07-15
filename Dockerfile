# Dockerfile

# --- 1. Aşama: Builder ---
# Bu aşamada projenin bağımlılıkları yüklenir ve build işlemi yapılır.
FROM node:20-alpine AS builder

# Uygulama için çalışma dizini oluştur
WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package.json package-lock.json ./
# Prisma şemasını kopyala
COPY prisma ./prisma
# Sadece üretim bağımlılıklarını yükle
RUN npm ci --only=production

# Tüm proje dosyalarını kopyala
COPY . .

# Prisma Client'ı oluştur
RUN npx prisma generate --schema=./prisma/schema.prisma

# Projeyi build et
# `check-db.ts`'yi çalıştırmak için tsx'i dev dependency olarak geçici yükle
RUN npm i -D tsx && npm run build && npm uninstall -D tsx

# --- 2. Aşama: Runner ---
# Bu aşamada, build edilmiş olan hafif ve çalıştırılabilir uygulama oluşturulur.
FROM node:20-alpine AS runner

WORKDIR /app

# Güvenlik için root olmayan bir kullanıcı oluştur
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Gerekli dosyaları builder aşamasından kopyala
# Standalone modu sayesinde sadece gerekli node_modules kopyalanır
COPY --from=builder /app/.next/standalone ./
# Public klasörünü kopyala (resimler, fontlar vb. için)
COPY --from=builder /app/public ./public

# Dosya sahipliğini yeni kullanıcıya ver
RUN chown -R nextjs:nodejs .

# Yeni kullanıcıya geçiş yap
USER nextjs

# Uygulamanın çalışacağı portu belirt
EXPOSE 3000

# Ortam değişkeni ile portu ayarla
ENV PORT 3000

# Uygulamayı başlat
CMD ["node", "server.js"]