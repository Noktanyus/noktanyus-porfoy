#!/usr/bin/env bash
# ==============================================================================
# Noktanyus Production Deploy Script (yunus.tekilons.tr)
# ==============================================================================
# Bu script sunucuda (veya CI/CD üzerinden SSH ile) çalıştırılarak
# en son kodu çeker, veritabanı migration'larını uygular, production build
# alır ve servisleri kesintisiz/güvenli şekilde yeniden başlatır.
# ==============================================================================

set -euo pipefail

echo "========================================================"
echo "🚀 Noktanyus Production Deployment Başlıyor: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================================"

# Proje dizinini tespit et
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DEPLOY_DIR"
echo "📂 Çalışma dizini: $DEPLOY_DIR"

# 1. Ortam dosyası kontrolü (.env)
if [ ! -f ".env" ]; then
  if [ -f ".env.production" ]; then
    echo "📋 .env.production kopyalanıyor..."
    cp .env.production .env
  else
    echo "❌ HATA: .env dosyası bulunamadı! Lütfen üretim değişkenlerini yapılandırın."
    exit 1
  fi
fi

# 2. Git güncellemelerini çek
echo "📥 Git güncellemeleri çekiliyor (branch: master)..."
git fetch origin master
git checkout master
git pull --ff-only origin master
COMMIT_HASH=$(git rev-parse --short HEAD)
echo "✅ En son commit: $COMMIT_HASH"

# 3. Dağıtım modunu tespit et (Docker vs Standalone / PM2)
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ] && docker info &> /dev/null; then
  DEPLOY_MODE="docker"
else
  DEPLOY_MODE="standalone"
fi

echo "⚙️ Dağıtım Modu: $DEPLOY_MODE"

if [ "$DEPLOY_MODE" = "docker" ]; then
  # ----------------------------------------------------
  # DOCKER İLE DAĞITIM
  # ----------------------------------------------------
  echo "🐳 Docker Compose ile build ve servis başlatma..."
  
  # Veritabanı konteynerinin ayakta olduğundan emin ol
  if docker compose ps | grep -q "noktanyus-db"; then
    echo "🗄️ Veritabanı servisi çalışıyor."
  else
    echo "🗄️ Veritabanı servisi başlatılıyor..."
    docker compose up -d db
    sleep 5
  fi

  # Web imajını build et ve başlat
  echo "🔨 Web imajı derleniyor..."
  docker compose build web
  
  echo "🚀 Servisler başlatılıyor..."
  docker compose up -d web tunnel
  
  # Migration çalıştır (web konteyneri içinde)
  echo "🔄 Prisma migration uygulanıyor..."
  docker compose exec -T web npx prisma migrate deploy || {
    echo "⚠️ Prisma migrate container içinde çalıştırılamadı, yerel denenecek..."
  }

elif [ "$DEPLOY_MODE" = "standalone" ]; then
  # ----------------------------------------------------
  # STANDALONE / NODE.JS / PM2 İLE DAĞITIM
  # ----------------------------------------------------
  echo "📦 Bağımlılıklar yükleniyor..."
  npm install --legacy-peer-deps --no-audit --prefer-offline

  echo "🔄 Prisma Client üretiliyor ve migration uygulanıyor..."
  npx prisma generate
  npx prisma migrate deploy

  echo "🔨 Next.js production build alınıyor..."
  npm run build

  # PM2 kontrolü
  if command -v pm2 &> /dev/null; then
    echo "🔄 PM2 ile servis yeniden başlatılıyor..."
    if pm2 list | grep -q "noktanyus"; then
      pm2 reload noktanyus || pm2 restart noktanyus
    else
      echo "🚀 PM2 yeni servis başlatılıyor..."
      pm2 start npm --name "noktanyus" -- start
    fi
    pm2 save
  elif command -v systemctl &> /dev/null && systemctl is-active --quiet noktanyus; then
    echo "🔄 systemd servisi yeniden başlatılıyor..."
    sudo systemctl restart noktanyus
  else
    echo "⚠️ PM2 veya systemd bulunamadı. Lütfen background process yöneticinizi kontrol edin."
  fi
fi

# 4. Sağlık Kontrolü (Health Check)
echo "🩺 Canlılık kontrolü (Health Check) yapılıyor..."
MAX_RETRIES=12
COUNT=0
HEALTHY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
  sleep 5
  COUNT=$((COUNT + 1))
  
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Sağlık kontrolü başarılı! (HTTP 200 - Deneme: $COUNT)"
    HEALTHY=true
    break
  else
    echo "⏳ Sağlık kontrolü bekleniyor (HTTP: $HTTP_STATUS, Deneme: $COUNT/$MAX_RETRIES)..."
  fi
done

if [ "$HEALTHY" = true ]; then
  echo "========================================================"
  echo "🎉 DEPLOYMENT BAŞARIYLA TAMAMLANDI! Commit: $COMMIT_HASH"
  echo "🌐 Sunucu: yunus.tekilons.tr"
  echo "========================================================"
  exit 0
else
  echo "❌ UYARI: Sağlık kontrolü 60 saniye içinde HTTP 200 dönmedi."
  echo "Lütfen docker logs veya pm2 logs ile konteyner loglarını inceleyin."
  exit 1
fi
