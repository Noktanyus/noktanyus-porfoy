import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { revalidatePath } from 'next/cache';
import { z, ZodError } from 'zod';

// Zod şemaları ile veri doğrulama
const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Yetenek adı boş olamaz."),
  icon: z.string().nullable().optional(),
});

const experienceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Unvan boş olamaz."),
  company: z.string().min(1, "Şirket adı boş olamaz."),
  date: z.string().min(1, "Tarih aralığı boş olamaz."),
  description: z.string().min(1, "Açıklama boş olamaz."),
});

const aboutPayloadSchema = z.object({
  about: z.object({
    id: z.string(),
    content: z.string().optional(),
    // Diğer 'about' alanları da buraya eklenebilir, şimdilik esnek bırakıyoruz.
  }).passthrough(),
  skills: z.array(skillSchema),
  experiences: z.array(experienceSchema),
});


export async function POST(request: NextRequest) {
  // 1. Yetkilendirme: Kullanıcı admin mi?
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Bu işlemi yapmak için yönetici yetkiniz bulunmamaktadır.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "İstek gövdesi (body) hatalı veya boş." }, { status: 400 });
  }

  // 2. Veri Doğrulama: Gelen veri beklenen yapıda mı?
  const validation = aboutPayloadSchema.safeParse(body);
  if (!validation.success) {
    const zodError = validation.error as ZodError;
    const errorMessage = zodError.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
    return NextResponse.json({ error: `Veri doğrulama hatası: ${errorMessage}` }, { status: 400 });
  }

  const { about, skills, experiences } = validation.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Hatanın kaynağını düzelt: `about` nesnesinden ilişkisel alanları çıkar.
      const { id: aboutId, content, skills: _skills, experiences: _experiences, ...aboutData } = about;

      // 3. Veritabanı İşlemleri
      // Sadece `About` modeline ait alanları güncelle.
      const updatedAbout = await tx.about.update({
        where: { id: aboutId },
        data: { ...aboutData, content },
      });

      // --- Skills (Yetenekler) için güncelleme mantığı ---
      const incomingSkillIds = skills.map(s => s.id).filter(id => !id.startsWith('new_'));
      await tx.skill.deleteMany({
        where: { aboutId, id: { notIn: incomingSkillIds } },
      });

      for (const skill of skills) {
        const { id, name, icon } = skill;
        const skillData = { name, icon, aboutId };
        if (id.startsWith('new_')) {
          await tx.skill.create({ data: skillData });
        } else {
          await tx.skill.update({ where: { id }, data: skillData });
        }
      }

      // --- Experiences (Tecrübeler) için güncelleme mantığı ---
      // Önce mevcut tüm tecrübeleri silip, gelenleri yeniden eklemek daha basit ve hatasız bir yöntem.
      await tx.experience.deleteMany({ where: { aboutId } });
      if (experiences && experiences.length > 0) {
        await tx.experience.createMany({
          data: experiences.map(exp => ({
            title: exp.title,
            company: exp.company,
            date: exp.date,
            description: exp.description,
            aboutId,
          })),
        });
      }

      return updatedAbout;
    });

    // 4. Önbellek Temizleme
    revalidatePath('/hakkimda');
    revalidatePath('/');
    revalidatePath('/admin/hakkimda');

    return NextResponse.json({ success: true, message: "Hakkımda sayfası bilgileri başarıyla güncellendi." });
  } catch (error: any) {
    console.error("Hakkımda güncelleme API hatası:", error);
    // Prisma'nın daha okunabilir hata mesajını döndür
    if (error.name === 'PrismaClientValidationError') {
       return NextResponse.json({ error: "Veritabanı doğrulama hatası: Gönderilen veri yapısı hatalı." }, { status: 400 });
    }
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 });
  }
}
