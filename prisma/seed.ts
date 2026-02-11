import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database with real data...');

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


  // Seed About
  const about = await prisma.about.create({
    data: {
      name: 'Yunus Tuğhan',
      title: 'Software Developer',
      subTitle: 'Akdeniz Üniversitesi bünyesinde yazılım çözümleri üretiyorum.',
      headerTitle: 'Merhaba, Ben Yunus Tuğhan',
      content: 'Akdeniz Üniversitesi Bilgi İşlem Daire Başkanlığı bünyesinde stajyerlik sürecimi tamamladıktan sonra şu an aktif olarak yazılım geliştirici olarak görev yapıyorum. ESTM Spor Tesisleri başta olmak üzere üniversite genelindeki dijital dönüşüm süreçlerine katkı sağlıyorum.',
      profileImage: '/images/profile.webp',
      contactEmail: 'tughan@akdeniz.edu.tr',
      socialGithub: 'https://github.com/Noktanyus',
      socialLinkedin: 'https://linkedin.com/in/yunus-tughan',
      workingOn: 'ESTM Spor Tesisleri Yazılımı',
    },
  });

  // Seed Experiences
  await prisma.experience.createMany({
    data: [
      { 
        title: 'Yazılım Geliştirici', 
        company: 'Akdeniz Üniversitesi', 
        date: '2024 - Günümüz', 
        description: 'ESTM Spor Tesisleri (sporalanlari.akdeniz.edu.tr) yazılımının geliştirilmesi, bakımı ve yeni özelliklerin entegrasyonu.', 
        aboutId: about.id 
      },
      { 
        title: 'Stajyer Yazılım Geliştirici', 
        company: 'Akdeniz Üniversitesi', 
        date: '2023 - 2024', 
        description: 'Akdeniz Üniversitesi Bilgi İşlem Daire Başkanlığı bünyesinde staj yaparak kurumsal yazılım süreçlerini öğrendim ve projelere destek verdim.', 
        aboutId: about.id 
      },
    ],
  });

  // Seed Skills
  await prisma.skill.createMany({
    data: [
      { name: 'C# / .NET', icon: 'SiDotnet', aboutId: about.id },
      { name: 'ASP.NET MVC', icon: 'SiDotnet', aboutId: about.id },
      { name: 'TypeScript', icon: 'SiTypescript', aboutId: about.id },
      { name: 'React', icon: 'FaReact', aboutId: about.id },
      { name: 'Node.js', icon: 'FaNodeJs', aboutId: about.id },
      { name: 'PostgreSQL', icon: 'SiPostgresql', aboutId: about.id },
      { name: 'Docker', icon: 'FaDocker', aboutId: about.id },
    ],
  });

  // Seed Project
  await prisma.project.create({
    data: {
      slug: 'estm-spor-tesisleri',
      title: 'ESTM Spor Tesisleri',
      description: 'Akdeniz Üniversitesi Spor Tesisleri Rezervasyon ve Yönetim Sistemi. Öğrenciler ve personeller için spor alanlarının kullanımını dijitalleştiren kapsamlı bir yazılım.',
      technologies: ['.NET', 'ASP.NET MVC', 'C#', 'SQL Server', 'JavaScript'],
      content: 'Akdeniz Üniversitesi spor alanlarının (tenis kortları, halı sahalar, salonlar vb.) online rezervasyon, ödeme ve yönetim süreçlerini kapsayan projedir.',
      liveDemo: 'https://sporalanlari.akdeniz.edu.tr',
      order: 1,
      featured: true,
      isLive: true,
    },
  });

  // Seed Blog
  await prisma.blog.create({
    data: {
      slug: 'estm-dijital-donusum',
      title: 'ESTM İle Dijital Dönüşüm',
      description: 'Üniversite spor tesislerinin yönetiminde dijitalleşme sürecini nasıl yönettik?',
      author: 'Yunus Tuğhan',
      category: 'Software Development',
      content: 'Bu makalede Akdeniz Üniversitesi spor tesisleri yönetim sisteminin geliştirilme sürecinden bahsedeceğiz...',
      tags: ['.NET', 'MVC', 'Dijital Dönüşüm']
    },
  });

  // Seed HomeSettings
  await prisma.homeSettings.create({
    data: {
      featuredContentType: 'project',
      textTitle: 'Yunus Tuğhan',
      textContent: 'Akdeniz Üniversitesi Yazılım Geliştirici | ESTM Spor Tesisleri Yazılım Sorumlusu',
    },
  });

  // Seed SeoSettings
  await prisma.seoSettings.create({
    data: {
      siteTitle: 'Yunus Tuğhan - Portfolio',
      siteDescription: 'Yunus Tuğhan - Akdeniz Üniversitesi Yazılım Geliştirici Kişisel Portfolyo Sitesi',
      canonicalUrl: 'https://sporalanlari.akdeniz.edu.tr',
      robots: 'index, follow',
    },
  });

  console.log('Database seeded successfully with real data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
