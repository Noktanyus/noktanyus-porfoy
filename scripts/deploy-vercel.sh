#!/bin/bash
# Vercel deployment script
# Kullanım: ./scripts/deploy-vercel.sh [preview|production]

set -e

ENV=${1:-preview}

echo "🚀 Vercel deployment başlıyor — ortam: $ENV"

# 1. Pre-flight checks
echo "📋 Pre-flight kontrolleri..."

if [ ! -f "package.json" ]; then
  echo "❌ package.json bulunamadı. Proje root'undan çalıştırın."
  exit 1
fi

if ! command -v vercel &> /dev/null; then
  echo "⚠️  Vercel CLI bulunamadı. Kurulum: npm i -g vercel"
  exit 1
fi

# 2. Build test (production)
if [ "$ENV" = "production" ]; then
  echo "🔨 Production build test ediliyor..."
  npm run build || {
    echo "❌ Build başarısız. Deploy iptal."
    exit 1
  }
fi

# 3. Test çalıştır
echo "🧪 Test suite çalıştırılıyor..."
npm run test -- --run || {
  echo "⚠️  Bazı testler başarısız ama deploy ediliyor..."
}

# 4. Deploy
if [ "$ENV" = "production" ]; then
  echo "📦 Production deploy başlıyor..."
  vercel --prod --yes
else
  echo "📦 Preview deploy başlıyor..."
  vercel --yes
fi

echo "✅ Deploy tamamlandı!"
echo "🔗 URL: $(vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo 'vercel ls ile kontrol edin')"