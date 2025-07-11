# --- 1. Aşama: Builder ---
# Bu aşama, uygulamanın bağımlılıklarını yükler ve production build'i oluşturur.
FROM node:18 AS builder

# Uygulama çalışma dizini
WORKDIR /app

# Sadece bağımlılık ve prisma şema dosyalarını kopyala
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Production için gerekli olan bağımlılıkları yükle
# --omit=dev, devDependencies'leri yüklemez, imajı küçültür.
# postinstall script'i 'prisma generate' çalıştıracağı için schema dosyası gereklidir.
RUN npm install --omit=dev

# Tüm proje dosyalarını kopyala (.dockerignore'a göre)
COPY . .

# Uygulamayı build et
# 'prisma generate' postinstall'da zaten çalıştı, bu yüzden burada tekrar çalıştırmaya gerek yok.
RUN npm run build

# --- 2. Aşama: Runner ---
# Bu aşama, builder'da oluşturulan çıktıları alarak son, hafif imajı oluşturur.
FROM node:18-alpine

# Çalışma dizini
WORKDIR /app

# Güvenlik için 'root' olmayan bir kullanıcı oluştur ve kullan
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Gerekli dosyaları 'builder' aşamasından kopyala
# Sadece production için gerekli olanları alıyoruz.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Uygulamanın çalışacağı port'u belirt
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "start"]
