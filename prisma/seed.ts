import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database...');

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
      name: 'Yunus Emre',
      title: 'Full Stack Developer',
      subTitle: 'I build things for the web.',
      headerTitle: 'Hi, I am Yunus',
      content: 'This is a bio.',
      profileImage: '/images/profile.webp', // Profil resmi güncellendi
      contactEmail: 'y.emre.d@msn.com', // İletişim e-postası eklendi
      socialGithub: 'https://github.com/example',
      socialLinkedin: 'https://linkedin.com/in/example',
      socialInstagram: 'https://instagram.com/example',
    },
  });

  // Seed Experiences
  await prisma.experience.createMany({
    data: [
      { title: 'Software Engineer', company: 'Tech Corp', date: '2022 - Present', description: 'Developing awesome stuff.', aboutId: about.id },
      { title: 'Junior Developer', company: 'Startup Inc.', date: '2020 - 2022', description: 'Learning and growing.', aboutId: about.id },
    ],
  });

  // Seed Skills
  await prisma.skill.createMany({
    data: [
      { name: 'TypeScript', icon: 'SiTypescript', aboutId: about.id },
      { name: 'React', icon: 'FaReact', aboutId: about.id },
      { name: 'Node.js', icon: 'FaNodeJs', aboutId: about.id },
      { name: 'Prisma', icon: 'SiPrisma', aboutId: about.id },
      { name: 'Next.js', icon: 'SiNextdotjs', aboutId: about.id },
      { name: 'PostgreSQL', icon: 'SiPostgresql', aboutId: about.id },
    ],
  });

  // Seed Blog
  await prisma.blog.create({
    data: {
      slug: 'first-post',
      title: 'My First Blog Post',
      description: 'This is the first post on my new blog.',
      author: 'Yunus Emre',
      category: 'Technology',
      content: 'Hello world!',
    },
  });

  // Seed Project
  await prisma.project.create({
    data: {
      slug: 'portfolio-project',
      title: 'My Portfolio',
      description: 'The very portfolio you are looking at.',
      technologies: 'Next.js,TypeScript,Prisma',
      content: 'Some details about the project.',
      order: 1,
      featured: true,
      isLive: true,
    },
  });

  // Seed Popup
  await prisma.popup.create({
    data: {
      slug: 'welcome-popup',
      title: 'Welcome!',
      content: 'Thanks for visiting my portfolio.',
      isActive: true,
    },
  });

  // Seed Message
  await prisma.message.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      subject: 'Hello',
      message: 'Just wanted to say hi.',
    },
  });

  // Seed Testimonial
  await prisma.testimonial.create({
    data: {
      name: 'Jane Smith',
      title: 'CEO',
      company: 'Another Corp',
      comment: 'Yunus is a great developer!',
    },
  });

  // Seed HomeSettings
  await prisma.homeSettings.create({
    data: {
      featuredContentType: 'blog',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      textTitle: 'Welcome to my page',
      textContent: 'Feel free to look around.',
    },
  });

  // Seed SeoSettings
  await prisma.seoSettings.create({
    data: {
      siteTitle: 'Yunus Emre - Portfolio',
      siteDescription: 'My personal portfolio website.',
      canonicalUrl: 'https://example.com',
      robots: 'index, follow',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
