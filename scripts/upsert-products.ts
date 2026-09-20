import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.digitalProduct.upsert({
    where: { slug: 'paytr-checkout-starter' },
    create: {
      slug: 'paytr-checkout-starter',
      title: 'PayTR Checkout Starter',
      shortDescription: 'Next.js + PayTR Direkt API örnek akış. Hash, callback, başarılı/başarısız sayfalar.',
      description: 'Türkiye pazarı için PayTR entegrasyon starter paketi.\n\n## Dahil\n- PayTR Direkt API hash / token örnekleri\n- Checkout + callback route iskeleti\n- Başarılı / başarısız sayfa şablonları\n- .env.example ve kurulum README (TR)\n- KVKK çerez banner iskeleti\n\nPayTR hesabı ve canlı anahtarlar dahil değildir.',
      thumbnail: '/images/products/paytr-starter.webp',
      fileUrl: 'r2:noktanyus/products/paytr-checkout-starter.zip',
      fileName: 'paytr-checkout-starter.zip',
      fileSize: 1843200,
      priceCents: 14900,
      currency: 'try',
      technologies: ['Next.js', 'PayTR', 'TypeScript'],
      category: 'starter',
      version: '1.0.0',
      active: true,
      featured: true,
      order: 1,
      downloadCountMax: 5,
      ttlHours: 168,
    },
    update: {
      thumbnail: '/images/products/paytr-starter.webp',
      active: true,
      featured: true,
    },
  });

  await prisma.digitalProduct.upsert({
    where: { slug: 'tr-validation-sdk' },
    create: {
      slug: 'tr-validation-sdk',
      title: 'TR Validation SDK (TypeScript)',
      shortDescription: 'TCKN, VKN, IBAN, telefon, posta, plaka, KDV — zero-dep TypeScript paket.',
      description: 'Self-host veya npm’e alabileceğin TR doğrulama kütüphanesi.\n\n## Fonksiyonlar\n- validateTckn / validateVkn / validateIban\n- validatePhone / validatePostalCode / validatePlate\n- calculateKdv / resolveIbanBank\n- Vitest suite + TypeScript types\n\nHosted API’ye ihtiyaç duymayan offline senaryolar için.',
      thumbnail: '/images/products/tr-sdk.webp',
      fileUrl: 'r2:noktanyus/products/tr-validation-sdk.zip',
      fileName: 'tr-validation-sdk.zip',
      fileSize: 524288,
      priceCents: 7900,
      currency: 'try',
      technologies: ['TypeScript', 'Vitest'],
      category: 'api',
      version: '1.0.0',
      active: true,
      featured: true,
      order: 2,
      downloadCountMax: 10,
      ttlHours: 336,
    },
    update: {
      thumbnail: '/images/products/tr-sdk.webp',
      active: true,
      featured: true,
    },
  });

  console.log('Successfully upserted paytr-checkout-starter and tr-validation-sdk');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
