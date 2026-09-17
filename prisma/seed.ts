import { prisma } from '../src/lib/prisma';
import { INDIVIDUAL_PLANS } from '../src/lib/individualPlans';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Zengin seed verisi yükleniyor...');

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.popup.deleteMany();
  await prisma.project.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.homeSettings.deleteMany();
  await prisma.seoSettings.deleteMany();
  await prisma.about.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.digitalProduct.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.userSubscription.deleteMany();
  await prisma.apiCreditLedger.deleteMany();
  await prisma.order.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.license.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.auditLog.deleteMany();

  // ====== Normal Kullanıcılar (User tablosu, bcrypt) ======
  // Auth: NextAuth Credentials provider, src/lib/auth.ts
  // Şifreler bcrypt 12 round ile hash'lendi. Plain text asla DB'ye yazılmaz.
  // Demo amaçlı: emailVerified = now, referralCode = benzersiz.
  // Her onaylı kullanıcıya başlangıçta 100 ücretsiz API kredisi tanımlanır.
  // upsert kullanıyoruz ki seed'i birden fazla kez çalıştırınca duplicate olmasın.
  const now = new Date();
  const usersData = [
    {
      email: 'ahmetyilmaz@gmail.com',
      name: 'Ahmet Yılmaz',
      password: 'Test12345',
      referralCode: 'AHMET2026',
    },
    {
      email: 'zeynepkaya@gmail.com',
      name: 'Zeynep Kaya',
      password: 'Sifre2026!',
      referralCode: 'ZEYNEP26',
    },
    {
      email: 'mehmetdemir@gmail.com',
      name: 'Mehmet Demir',
      password: 'Demo12345',
      referralCode: 'MEHMET26',
    },
    {
      email: 'ayseselcuk@example.com',
      name: 'Ayşe Selçuk',
      password: 'User2026!',
      referralCode: 'AYSE2026',
    },
  ];

  const users = [];
  for (const u of usersData) {
    const hashed = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        password: hashed,
        emailVerified: now,
        referralCode: u.referralCode,
        apiCreditBalance: 100,
      },
      create: {
        email: u.email,
        name: u.name,
        password: hashed,
        emailVerified: now,
        referralCode: u.referralCode,
        apiCreditBalance: 100,
      },
    });

    // 100 hoş geldin kredisi ledger kaydı
    await prisma.apiCreditLedger.create({
      data: {
        userId: user.id,
        delta: 100,
        balanceAfter: 100,
        reason: 'welcome_bonus',
        metadata: { note: 'E-posta onaylı kullanıcı hoş geldin kredisi' },
      },
    });

    users.push({ user, plainPassword: u.password });
  }

  console.log(`   - User: ${users.length} normal kullanıcı oluşturuldu (her birine 100 hoş geldin kredisi tanımlandı)`);
  users.forEach(({ user, plainPassword }) =>
    console.log(`     · ${user.email} / ${plainPassword} (100 kredi)`)
  );

  // ====== About ======
  const about = await prisma.about.create({
    data: {
      name: 'Yunus Tuğhan',
      title: 'Software Developer',
      subTitle: 'Akdeniz Üniversitesi bünyesinde yazılım çözümleri üretiyorum.',
      headerTitle: 'Yunus Tuğhan',
      content: 'Akdeniz Üniversitesi Bilgi İşlem Daire Başkanlığı bünyesinde stajyerlik sürecimi tamamladıktan sonra şu an aktif olarak yazılım geliştirici olarak görev yapıyorum. eSAS (Eğitim ve Sosyal Tesisler) başta olmak üzere üniversite genelindeki dijital dönüşüm süreçlerine katkı sağlıyorum.',
      profileImage: '/images/profile.webp',
      contactEmail: 'tughan@akdeniz.edu.tr',
      socialGithub: 'https://github.com/Noktanyus',
      socialLinkedin: 'https://linkedin.com/in/yunus-tughan',
      socialInstagram: 'https://instagram.com/noktanyus',
      workingOn: 'eSAS Tesis Yönetim Yazılımı',
    },
  });

  // Experiences
  await prisma.experience.createMany({
    data: [
      {
        title: 'Yazılım Geliştirici',
        company: 'Akdeniz Üniversitesi',
        date: '2024 - Günümüz',
        description: 'eSAS - Eğitim ve Sosyal Tesisler (sporalanlari.akdeniz.edu.tr) yazılımının geliştirilmesi, bakımı ve yeni özelliklerin entegrasyonu.',
        aboutId: about.id,
      },
      {
        title: 'Stajyer Yazılım Geliştirici',
        company: 'Akdeniz Üniversitesi',
        date: '2023 - 2024',
        description: 'Akdeniz Üniversitesi Bilgi İşlem Daire Başkanlığı bünyesinde staj yaparak kurumsal yazılım süreçlerini öğrendim ve projelere destek verdim.',
        aboutId: about.id,
      },
    ],
  });

  // Skills
  await prisma.skill.createMany({
    data: [
      { name: 'C# / .NET', icon: 'SiDotnet', aboutId: about.id },
      { name: 'ASP.NET MVC', icon: 'SiDotnet', aboutId: about.id },
      { name: 'TypeScript', icon: 'SiTypescript', aboutId: about.id },
      { name: 'React', icon: 'FaReact', aboutId: about.id },
      { name: 'Next.js', icon: 'SiNextdotjs', aboutId: about.id },
      { name: 'Node.js', icon: 'FaNodeJs', aboutId: about.id },
      { name: 'PostgreSQL', icon: 'SiPostgresql', aboutId: about.id },
      { name: 'Docker', icon: 'FaDocker', aboutId: about.id },
      { name: 'Tailwind CSS', icon: 'SiTailwindcss', aboutId: about.id },
      { name: 'Prisma', icon: 'SiPrisma', aboutId: about.id },
    ],
  });

  // ====== Projects (4 tane, 3 featured) ======
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        slug: 'esas-spor-tesisleri',
        title: 'eSAS Spor Tesisleri',
        description: 'Akdeniz Üniversitesi Eğitim ve Sosyal Tesisler (eSAS) Rezervasyon ve Yönetim Sistemi. Öğrenciler ve personeller için spor alanlarının kullanımını dijitalleştiren kapsamlı bir yazılım.',
        mainImage: '/images/projects/esas.webp',
        technologies: ['.NET', 'ASP.NET MVC', 'C#', 'SQL Server', 'JavaScript'],
        liveDemo: 'https://sporalanlari.akdeniz.edu.tr',
        order: 1,
        featured: true,
        isLive: true,
        content: `Akdeniz Üniversitesi eSAS spor alanlarının (tenis kortları, halı sahalar, salonlar vb.) online rezervasyon, ödeme ve yönetim süreçlerini kapsayan projedir.

## Özellikler
- Online rezervasyon sistemi
- Ödeme entegrasyonu (Stripe)
- Kullanıcı yönetimi
- Admin panel
- Raporlama
- Bildirimler

## Teknolojiler
- Backend: ASP.NET MVC, C#
- Database: SQL Server
- Frontend: Razor, JavaScript
- Ödeme: Stripe

## Sonuç
50+ aktif kullanıcı, günde 200+ rezervasyon, %99 uptime.`,
        date: new Date('2024-09-01'),
      },
    }),
    prisma.project.create({
      data: {
        slug: 'noktanyus-portfolio',
        title: 'Noktanyus Portfolio',
        description: 'Kişisel portfolyo ve SaaS + e-ticaret hibrit platform. Modern web teknolojileri ile geliştirilmiş.',
        mainImage: '/images/projects/portfolio.webp',
        technologies: ['Next.js 14', 'TypeScript', 'Prisma', 'PostgreSQL', 'Stripe', 'Tailwind CSS'],
        liveDemo: 'https://noktanyus.com',
        githubRepo: 'https://github.com/Noktanyus/noktanyus-porfoy',
        order: 2,
        featured: true,
        isLive: true,
        content: `Modern, performant ve güvenli bir kişisel portfolyo + SaaS + e-ticaret platform.

## Özellikler
- Blog sistemi
- Proje portföyü
- Dijital ürün satışı (Stripe)
- Abonelik yönetimi
- Admin panel (NextAuth)
- Cloudflare Turnstile koruması
- Glassmorphism UI

## Teknoloji Stack
- Next.js 14 (App Router)
- TypeScript, React 18
- Prisma ORM + PostgreSQL
- next-themes (Light/Dark)
- Framer Motion
- Zod validation
- Stripe + Resend

## Performans
Lighthouse: 95+ (Performance, Accessibility, Best Practices, SEO)`,
        date: new Date('2026-01-15'),
      },
    }),
    prisma.project.create({
      data: {
        slug: 'akdeniz-universitesi-portal',
        title: 'Akdeniz Üniversitesi Portal',
        description: 'Üniversite öğrencileri için bilgi ve hizmet portalı. Duyurular, etkinlikler, ders programları.',
        mainImage: '/images/projects/portal.webp',
        technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
        order: 3,
        featured: true,
        isLive: false,
        content: `Akdeniz Üniversitesi öğrencileri için merkezi bilgi portalı.

## Modüller
- Duyurular
- Etkinlik takvimi
- Ders programı
- Yemek listesi
- Kampüs haritası

Henüz geliştirme aşamasında.`,
        date: new Date('2025-12-01'),
      },
    }),
    prisma.project.create({
      data: {
        slug: 'mobil-rezervasyon-app',
        title: 'Mobil Rezervasyon Uygulaması',
        description: 'Cross-platform mobil rezervasyon uygulaması. React Native ile geliştirilmiş, native performans.',
        mainImage: '/images/projects/mobile.webp',
        technologies: ['React Native', 'TypeScript', 'Expo', 'Firebase'],
        githubRepo: 'https://github.com/Noktanyus/mobile-app',
        order: 4,
        featured: false,
        isLive: false,
        content: 'Cross-platform mobil uygulama. Native iOS ve Android desteği, offline çalışma, push notifications.',
        date: new Date('2025-11-10'),
      },
    }),
  ]);

  // ====== Blog (8 yazı) ======
  const blogs = await Promise.all([
    prisma.blog.create({
      data: {
        slug: 'esas-dijital-donusum',
        title: 'eSAS İle Dijital Dönüşüm',
        description: 'Üniversite eğitim ve sosyal tesislerinin yönetiminde dijitalleşme sürecini nasıl yönettik?',
        author: 'Yunus Tuğhan',
        category: 'Software Development',
        thumbnail: '/images/projects/esas.webp',
        content: `# eSAS İle Dijital Dönüşüm

Akdeniz Üniversitesi Eğitim ve Sosyal Tesisler Müdürlüğü (eSAS) spor alanları yönetim sisteminin geliştirilme sürecinden bahsedeceğim.

## Başlangıç
Spor tesisleri rezervasyonu manuel olarak yapılıyordu. Telefon, kağıt, Excel...

## Dijitalleşme Süreci
İlk olarak ASP.NET MVC ile bir web uygulaması geliştirdik. Sonra Next.js ile modernize ettik.

## Kazanımlar
- %80 daha hızlı rezervasyon
- 7/24 erişim
- Otomatik ödeme
- Detaylı raporlar

## Sonuç
Sistem artık tüm üniversite tarafından aktif olarak kullanılıyor.`,
        tags: ['.NET', 'MVC', 'Dijital Dönüşüm', 'Akdeniz Üniversitesi'],
        date: new Date('2026-01-20'),
      },
    }),
    prisma.blog.create({
      data: {
        slug: 'nextjs-14-app-router',
        title: 'Next.js 14 App Router Derinlemesine',
        description: 'Next.js 14 ile gelen yenilikler, Server Components, Streaming ve en iyi pratikler.',
        author: 'Yunus Tuğhan',
        category: 'Frontend',
        thumbnail: '/images/projects/portal.webp',
        content: `# Next.js 14 App Router

Next.js 14 App Router, modern web geliştirmede yeni bir çağ açtı.

## Server Components
Default olarak Server Component geliyor. Client gerektiğinde 'use client' ekliyoruz.

## Streaming & Suspense
\`\`\`typescript
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
\`\`\`

## Server Actions
Form submit'lerde artık API route'a gerek yok, direkt server function çağırabiliyoruz.

## Performans
Lighthouse skoru %30 arttı, bundle size %40 azaldı.`,
        tags: ['Next.js', 'React', 'Performance'],
        date: new Date('2026-01-15'),
      },
    }),
    prisma.blog.create({
      data: {
        slug: 'prisma-vs-drizzle',
        title: 'Prisma vs Drizzle: Hangisi Tercih Edilmeli?',
        description: 'İki popüler TypeScript ORM arasındaki farklar, performans karşılaştırması ve kullanım senaryoları.',
        author: 'Yunus Tuğhan',
        category: 'Backend',
        thumbnail: '/images/projects/portfolio.webp',
        content: `# Prisma vs Drizzle

Her iki ORM de TypeScript-first yaklaşım sunuyor.

## Prisma
- Schema-first yaklaşım
- Mükemmel tip güvenliği
- Zengin migration tooling
- Dezavantaj: Bundle size

## Drizzle
- SQL-first yaklaşım
- Daha küçük bundle
- Daha hızlı cold start
- Dezavantaj: Migration tooling daha az

## Sonuç
Çoğu uygulama için Prisma yeterli. Edge veya serverless ortamda Drizzle daha iyi olabilir.`,
        tags: ['Prisma', 'Drizzle', 'ORM', 'TypeScript', 'Backend'],
        date: new Date('2026-01-10'),
      },
    }),
    prisma.blog.create({
      data: {
        slug: 'glassmorphism-ui-trend',
        title: 'Glassmorphism: 2026 UI Trendleri',
        description: 'Cam efektli tasarım trendi, nerede kullanılmalı, performans ipuçları.',
        author: 'Yunus Tuğhan',
        category: 'Design',
        thumbnail: '/images/01d7e936-6698-4271-8087-855b92bf9771.webp',
        content: `# Glassmorphism

Apple, Stripe, Linear gibi şirketlerin popülerleştirdiği glassmorphism, 2026'da da güçlü bir trend.

## CSS Implementasyonu
\`\`\`css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
\`\`\`

## Performans
\`backdrop-filter\` GPU kullanır ama her element için maliyetli. Çok fazla glassmorphism kullanmayın.

## Erişilebilirlik
Yeterli contrast ratio sağlamak önemli. WCAG AA minimum.`,
        tags: ['CSS', 'UI', 'Glassmorphism', 'Design'],
        date: new Date('2026-01-05'),
      },
    }),
    prisma.blog.create({
      data: {
        slug: 'stripe-entegrasyonu',
        title: 'Stripe ile E-Ticaret Entegrasyonu',
        description: 'Stripe Checkout, Webhooks, Subscription modeli kurulumu ve Türkiye özel notlar.',
        author: 'Yunus Tuğhan',
        category: 'Backend',
        thumbnail: '/images/2e6068a2-7738-4b32-bd42-a475ca5dffea.webp',
        content: `# Stripe Entegrasyonu

Stripe, global ödeme altyapısında lider.

## Checkout Session
\`\`\`typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [...],
  success_url: '...',
  cancel_url: '...',
});
\`\`\`

## Webhook
\`checkout.session.completed\` event'ini handle ediyoruz. Idempotency için webhook event ID'sini DB'de tutuyoruz.

## Türkiye Notu
iyzico TR müşteriler için daha iyi başarı oranı sunuyor. Provider abstraction ile ikisini de desteklemek mantıklı.`,
        tags: ['Stripe', 'Ödeme', 'E-Ticaret', 'Webhook'],
        date: new Date('2025-12-28'),
      },
    }),
    prisma.blog.create({
      data: {
        slug: 'typescript-zod-runtime-validation',
        title: 'Zod ile Runtime Type Safety',
        description: 'JSON alanlarında tip güvenliği, form validasyonu, API contract validation.',
        author: 'Yunus Tuğhan',
        category: 'TypeScript',
        thumbnail: '/images/b94746f0-1857-4257-978c-198368832a5c.webp',
        content: `# Zod ile Runtime Type Safety

TypeScript sadece compile-time güvenliği sağlar. Runtime'da hâlâ 'any' olabilir.

## Zod ile Schema
\`\`\`typescript
const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().min(0),
});
\`\`\`

## Tip Çıkarımı
\`\`\`typescript
type User = z.infer<typeof UserSchema>;
\`\`\`

## Avantajları
- Tek kaynaktan tip + validasyon
- API contract kontrolü
- Form validasyonu
- JSON alanları için ideal`,
        tags: ['TypeScript', 'Zod', 'Validation'],
        date: new Date('2025-12-20'),
      },
    }),
    prisma.blog.create({
      data: {
        slug: 'docker-postgres-development',
        title: 'Docker ile Geliştirme Ortamı',
        description: 'PostgreSQL + Docker Compose, volume yönetimi, production benzeri dev ortamı.',
        author: 'Yunus Tuğhan',
        category: 'DevOps',
        thumbnail: '/images/projects/mobile.webp',
        content: `# Docker ile Geliştirme

Local'de PostgreSQL kurmak yerine Docker kullanmak pratik.

## docker-compose.yml
\`\`\`yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: noktanyus
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
\`\`\`

## Avantajları
- Hızlı kurulum
- Production benzeri ortam
- Takım arası tutarlılık
- Kolay temizlik (\`docker compose down -v\`)`,
        tags: ['Docker', 'PostgreSQL', 'DevOps'],
        date: new Date('2025-12-15'),
      },
    }),
    prisma.blog.create({
      data: {
        slug: 'tailwind-v4-vs-v3',
        title: 'Tailwind CSS v4: Geçiş Rehberi',
        description: 'Tailwind v4 yenilikleri, OKLCH renkler, native CSS variables, performans iyileştirmeleri.',
        author: 'Yunus Tuğhan',
        category: 'Frontend',
        thumbnail: '/images/bfadcce2-585a-49e4-8807-9c9ea0d076b6.webp',
        content: `# Tailwind v4

Tailwind v4, native CSS variable desteği ve OKLCH renk uzayı ile geliyor.

## Yeni Özellikler
- \`@theme\` direktifi
- OKLCH renkler
- Container queries (native)
- CSS layers

## Performans
Build time %50 azaldı, bundle size %20 küçüldü.

## Geçiş
v3'ten v4'e geçiş kolay, breaking change'ler minimal.`,
        tags: ['Tailwind', 'CSS', 'Frontend'],
        date: new Date('2025-12-10'),
      },
    }),
  ]);

  // ====== Digital Products ======
  //
  // Mağaza vitrini (/magaza/urunler) bilinçli olarak DAR tutuluyor: sadece
  // satışa hazır 2 ürün `active: true`. Sebep — ProductRepository.findActive
  // yalnızca active kayıtları listeler, dolayısıyla vitrinde ne varsa
  // "satın alınabilir ve teslim edilebilir" olmak zorunda.
  //
  // Yayında olan 2 ürün:
  //   1. paytr-checkout-starter  (₺149, category: starter)
  //   2. tr-validation-sdk       (₺79,  category: api)
  //
  // Kalan kayıtlar `active: false` ile duruyor — silinmediler ki geçmiş
  // sipariş/lisans referansları ve ürün metinleri kaybolmasın. Dosyası R2'ye
  // yüklenip fiyatı netleşen ürün admin panelinden (veya buradan) aktif edilir.
  await prisma.digitalProduct.createMany({
    data: [
      // --- YAYINDA: 1/2 — PayTR başlangıç kiti ---
      {
        slug: 'paytr-checkout-starter',
        title: 'PayTR Checkout Starter',
        shortDescription: 'Next.js + PayTR Direkt API örnek akış. Hash, callback, başarılı/başarısız sayfalar.',
        description: `Türkiye pazarı için PayTR entegrasyon starter paketi.

## Dahil
- PayTR Direkt API hash / token örnekleri
- Checkout + callback route iskeleti
- Başarılı / başarısız sayfa şablonları
- .env.example ve kurulum README (TR)
- KVKK çerez banner iskeleti

PayTR hesabı ve canlı anahtarlar dahil değildir.`,
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
      // --- YAYINDA: 2/2 — TR API/SDK paketi ---
      {
        slug: 'tr-validation-sdk',
        title: 'TR Validation SDK (TypeScript)',
        shortDescription: 'TCKN, VKN, IBAN, telefon, posta, plaka, KDV — zero-dep TypeScript paket.',
        description: `Self-host veya npm’e alabileceğin TR doğrulama kütüphanesi.

## Fonksiyonlar
- validateTckn / validateVkn / validateIban
- validatePhone / validatePostalCode / validatePlate
- calculateKdv / resolveIbanBank
- Vitest suite + TypeScript types

Hosted API’ye ihtiyaç duymayan offline senaryolar için.`,
        thumbnail: '/images/products/tr-sdk.webp',
        fileUrl: 'r2:noktanyus/products/tr-validation-sdk.zip',
        fileName: 'tr-validation-sdk.zip',
        fileSize: 524288,
        priceCents: 7900,
        currency: 'try',
        technologies: ['TypeScript', 'Vitest'],
        // 'api' = "API paketi / indirmeli SDK" (src/lib/storeCatalog.ts).
        // Vitrindeki iki ürünün kategorisi böylece ayrışıyor: starter + api.
        category: 'api',
        version: '1.0.0',
        active: true,
        featured: true,
        order: 2,
        downloadCountMax: 10,
        ttlHours: 336,
      },

      // --- PASİF: aşağıdakiler vitrinde görünmez (active: false) ---
      {
        slug: 'nextjs-saas-starter',
        title: 'Next.js 14 SaaS Starter Kit',
        shortDescription: 'Production-ready Next.js 14 SaaS starter. Auth, Stripe, admin panel, i18n dahil.',
        description: `Production-ready Next.js 14 SaaS starter template.

## Özellikler
- NextAuth authentication
- Stripe subscription entegrasyonu
- Admin panel
- i18n (TR/EN)
- Dark mode
- Responsive tasarım

## Teknolojiler
- Next.js 14 (App Router), TypeScript, Prisma, Tailwind CSS`,
        thumbnail: '/images/products/saas-starter.webp',
        fileUrl: 'r2:noktanyus/products/nextjs-saas-starter.zip',
        fileName: 'nextjs-saas-starter.zip',
        fileSize: 5242880,
        priceCents: 19900,
        currency: 'try',
        technologies: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Stripe'],
        category: 'starter',
        version: '1.0.0',
        active: false,
        featured: false,
        downloadCountMax: 5,
        ttlHours: 168,
      },
      {
        slug: 'portfolio-template',
        title: 'Modern Portfolio Template',
        shortDescription: 'Glassmorphism tasarımlı kişisel portfolyo template. Light + Dark, animasyonlar, blog.',
        description: `Modern portfolyo template: light/dark, blog, iletişim, SEO.`,
        thumbnail: '/images/products/portfolio-template.webp',
        fileUrl: 'r2:noktanyus/products/portfolio-template.zip',
        fileName: 'portfolio-template.zip',
        fileSize: 3145728,
        priceCents: 9900,
        currency: 'try',
        technologies: ['Next.js', 'Tailwind CSS', 'Framer Motion'],
        category: 'template',
        version: '2.1.0',
        active: false,
        featured: false,
        downloadCountMax: 3,
        ttlHours: 168,
      },
      {
        slug: 'kvkk-legal-pack',
        title: 'KVKK & Mesafeli Satış Metin Paketi',
        shortDescription: 'KVKK, gizlilik, çerez, mesafeli satış, cayma — düzenlenebilir Markdown taslakları.',
        description: `E-ticaret / SaaS için hukuki metin taslakları (avukat onayı gerekir).

## İçerik
- KVKK aydınlatma metni
- Gizlilik politikası
- Çerez politikası
- Mesafeli satış sözleşmesi
- Cayma hakkı formu
- Uygulama kontrol listesi`,
        thumbnail: '/images/products/kvkk-pack.webp',
        fileUrl: 'r2:noktanyus/products/kvkk-legal-pack.zip',
        fileName: 'kvkk-legal-pack.zip',
        fileSize: 256000,
        priceCents: 3900,
        currency: 'try',
        technologies: ['Markdown'],
        category: 'general',
        version: '1.0.0',
        active: false,
        featured: false,
        downloadCountMax: 10,
        ttlHours: 720,
      },
      {
        slug: 'ui-component-library',
        title: 'UI Component Library',
        shortDescription: '50+ modern React component. Tailwind, Framer Motion.',
        description: `50+ React component: Button, Card, Modal, Form, Table. TypeScript + a11y.`,
        thumbnail: '/images/products/ui-library.webp',
        fileUrl: 'r2:noktanyus/products/ui-library.zip',
        fileName: 'ui-library.zip',
        fileSize: 2097152,
        priceCents: 4900,
        currency: 'try',
        technologies: ['React', 'TypeScript', 'Tailwind CSS'],
        category: 'library',
        version: '3.0.0',
        active: false,
        featured: false,
        downloadCountMax: 5,
        ttlHours: 168,
      },
      {
        slug: 'api-boilerplate',
        title: 'Node.js API Boilerplate',
        shortDescription: 'Express + TypeScript + Prisma API starter. JWT, rate limit, Zod.',
        description: `Express + TS + Prisma API iskeleti: JWT, rate limit, logging, Vitest.`,
        thumbnail: '/images/products/api-boilerplate.webp',
        fileUrl: 'r2:noktanyus/products/api-boilerplate.zip',
        fileName: 'api-boilerplate.zip',
        fileSize: 1572864,
        priceCents: 7900,
        currency: 'try',
        technologies: ['Node.js', 'Express', 'TypeScript', 'Prisma'],
        category: 'boilerplate',
        version: '1.5.0',
        active: false,
        featured: false,
        downloadCountMax: 5,
        ttlHours: 168,
      },
      {
        slug: 'trendyol-invoice-helper',
        title: 'Pazaryeri Fatura PDF Helper',
        shortDescription: 'Sipariş satırlarından teklif/fatura PDF üreten script + örnek CLI.',
        description: `Trendyol / Hepsiburada sipariş JSON’undan PDF üretme örneği.

## Not
GİB e-fatura değildir. Pazaryeri fatura dosyası yükleme öncesi PDF üretimi için yardımcıdır.
Hosted API: POST /api/v1/invoice/pdf ile aynı mantık.`,
        thumbnail: '/images/products/invoice-helper.webp',
        fileUrl: 'r2:noktanyus/products/trendyol-invoice-helper.zip',
        fileName: 'trendyol-invoice-helper.zip',
        fileSize: 384000,
        priceCents: 5900,
        currency: 'try',
        technologies: ['TypeScript', 'Node.js'],
        category: 'script',
        version: '1.0.0',
        active: false,
        featured: false,
        downloadCountMax: 8,
        ttlHours: 336,
      },
    ],
  });

  // ====== TemplateListing (/marketplace) — bilinçli olarak seed edilmiyor ======
  //
  // /marketplace vitrini TemplateListing okur, ama oradaki satın alma akışı
  // (POST /api/templates/checkout) slug → Gumroad product_id / Lemon Squeezy
  // variant_id eşlemesini GUMROAD_PRODUCT_MAP veya LEMONSQUEEZY_PRODUCT_MAP
  // env'inden çözer. Eşleme yoksa checkout "ürün eşlemesi yok" ile düşer.
  //
  // Yani buraya template kaydı eklemek, satın alınamayan bir vitrin üretir.
  // Gerçek Gumroad/Lemon ürünü açılıp product map env'i doldurulduktan sonra
  // template'ler admin panelinden (/admin/templates/new) eklenmeli.
  // Şu an satılabilir template teklifi DigitalProduct olarak /magaza/urunler
  // üzerinden sunuluyor (yukarıdaki 2 aktif ürün).

  // ====== Plans — bireysel merdiven (slug'lar onboarding ile uyumlu) ======
  for (const plan of INDIVIDUAL_PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        stripePriceId: plan.stripePriceId,
        stripeProductId: plan.stripeProductId,
        interval: plan.interval,
        priceCents: plan.priceCents,
        currency: plan.currency,
        features: {
          marketing: [...plan.marketing],
          limits: { ...plan.limits },
        },
        active: true,
        isFeatured: plan.isFeatured,
        order: plan.order,
        trialDays: plan.trialDays,
      },
      update: {
        name: plan.name,
        description: plan.description,
        priceCents: plan.priceCents,
        currency: plan.currency,
        features: {
          marketing: [...plan.marketing],
          limits: { ...plan.limits },
        },
        active: true,
        isFeatured: plan.isFeatured,
        order: plan.order,
        trialDays: plan.trialDays,
      },
    });
  }

  // ====== User Subscriptions (Örnek abonelikler) ======
  if (users.length >= 2) {
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const monthEnd = new Date(now);
    monthEnd.setDate(monthEnd.getDate() + 30);

    // Ahmet: 14 günlük Starter denemesinde
    await prisma.userSubscription.create({
      data: {
        userId: users[0].user.id,
        planSlug: 'starter',
        status: 'trialing',
        startedAt: now,
        expiresAt: trialEnd,
        trialEndsAt: trialEnd,
        autoRenew: false,
      },
    });

    // Zeynep: Aktif Pro aboneliğinde
    await prisma.userSubscription.create({
      data: {
        userId: users[1].user.id,
        planSlug: 'pro',
        status: 'active',
        startedAt: now,
        expiresAt: monthEnd,
        autoRenew: true,
      },
    });
  }

  // ====== HomeSettings ======
  await prisma.homeSettings.create({
    data: {
      featuredContentType: 'project',
      youtubeUrl: '',
      textTitle: 'Yunus Tuğhan',
      textContent: 'Akdeniz Üniversitesi Yazılım Geliştirici | eSAS Spor Tesisleri Yazılım Sorumlusu',
    },
  });

  // ====== SeoSettings ======
  await prisma.seoSettings.create({
    data: {
      siteTitle: 'Yunus Tuğhan - Portfolio & SaaS',
      siteDescription: 'Akdeniz Üniversitesi Yazılım Geliştirici. Modern web teknolojileri, SaaS, e-ticaret ve kişisel projeler.',
      siteKeywords: 'yazılım, developer, portfolio, saas, e-ticaret, nextjs, typescript, noktanyus',
      canonicalUrl: 'https://noktanyus.com',
      robots: 'index, follow',
      ogTitle: 'Yunus Tuğhan - Software Developer',
      ogDescription: 'Modern web teknolojileri ile geliştirilmiş kişisel portföy, SaaS ve e-ticaret çözümleri.',
      ogImage: '/images/og-cover.webp',
      ogType: 'website',
      ogUrl: 'https://noktanyus.com',
      ogSiteName: 'Noktanyus',
      twitterCard: 'summary_large_image',
      twitterSite: '@noktanyus',
      twitterCreator: '@noktanyus',
      twitterTitle: 'Yunus Tuğhan - Software Developer',
      twitterDescription: 'Software Developer & SaaS Builder',
      twitterImage: '/images/twitter-cover.webp',
    },
  });

  // ====== Testimonial ======
  await prisma.testimonial.createMany({
    data: [
      {
        name: 'Mehmet Yılmaz',
        title: 'Proje Yöneticisi',
        company: 'Akdeniz Üniversitesi',
        avatar: '/images/testimonials/mehmet.webp',
        comment: 'Yunus, eSAS projesinde gösterdiği performans ve problem çözme becerisiyle ekibimize büyük katkı sağladı.',
      },
      {
        name: 'Ayşe Kaya',
        title: 'Bilgi İşlem Daire Başkanı',
        company: 'Akdeniz Üniversitesi',
        avatar: '/images/testimonials/ayse.webp',
        comment: 'Yunus, dijital dönüşüm projelerimizde yenilikçi çözümler sunan, güvenilir bir yazılım geliştirici.',
      },
      {
        name: 'Ali Demir',
        title: 'Senior Developer',
        company: 'Tech Co.',
        avatar: '/images/testimonials/ali.webp',
        comment: 'Teknik bilgisi güçlü, takım çalışmasına yatkın, problemlere yapıcı yaklaşım sergileyen bir geliştirici.',
      },
    ],
  });

  // ====== Coupons ======
  await prisma.coupon.create({
    data: {
      code: 'HOSGELDIN20',
      description: 'Yeni müşterilere özel %20 indirim',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderCents: 0,
      maxDiscountCents: 5000,
      maxUses: 100,
      maxUsesPerUser: 1,
      active: true,
      expiresAt: new Date('2026-12-31'),
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'SUMMER50',
      description: 'Yaz kampanyası 50 TL indirim',
      discountType: 'FIXED_AMOUNT',
      discountValue: 5000,
      minOrderCents: 10000,
      maxUses: 50,
      maxUsesPerUser: 2,
      active: true,
      expiresAt: new Date('2026-08-31'),
    },
  });

  console.log('✅ Seed tamamlandı!');
  console.log(`   - About: 1`);
  console.log(`   - Experience: 2`);
  console.log(`   - Skill: 10`);
  console.log(`   - Project: ${projects.length} (featured: ${projects.filter(p => p.featured).length})`);
  console.log(`   - Blog: ${blogs.length}`);
  console.log(`   - DigitalProduct: 9 (yayında 2: paytr-checkout-starter, tr-validation-sdk)`);
  console.log(`   - Plan: 3`);
  console.log(`   - Testimonial: 3`);
  console.log(`   - Coupon: 2`);
  console.log(`   - User: ${users.length} (normal)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
