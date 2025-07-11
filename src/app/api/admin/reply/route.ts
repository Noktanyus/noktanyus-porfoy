/**
 * @file Yönetim panelinden e-posta yanıtı göndermek için API rotası.
 * @description Bu rota, gelen mesajlara yönetim paneli üzerinden doğrudan
 *              e-posta ile yanıt gönderilmesini sağlar. Sadece 'admin' rolüne
 *              sahip kullanıcılar erişebilir ve tüm girdiler doğrulanır.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import nodemailer from 'nodemailer';
import { env } from '@/lib/env';
import { z, ZodError } from 'zod';

// Gelen isteğin gövdesini doğrulamak için Zod şeması
const replySchema = z.object({
  to: z.string().email({ message: "Geçersiz e-posta adresi." }),
  subject: z.string().min(1, "Konu alanı boş olamaz.").max(200, "Konu çok uzun."),
  html: z.string().min(1, "E-posta içeriği boş olamaz."),
});

export async function POST(req: NextRequest) {
  // 1. Yetkilendirme: Kullanıcı admin mi?
  const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Bu işlemi yapmak için yönetici yetkiniz bulunmamaktadır.' }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "İstek gövdesi (body) hatalı veya boş." }, { status: 400 });
  }

  // 2. Veri Doğrulama: Gelen veri beklenen yapıda ve geçerli mi?
  const validation = replySchema.safeParse(body);
  if (!validation.success) {
    const zodError = validation.error as ZodError;
    const errorMessage = zodError.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
    return NextResponse.json({ error: `Veri doğrulama hatası: ${errorMessage}` }, { status: 400 });
  }
  
  const { to, subject, html } = validation.data;

  try {
    // 3. E-posta Gönderme İşlemi
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_SERVER,
      port: Number(env.EMAIL_PORT),
      secure: Number(env.EMAIL_PORT) === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, message: 'E-posta başarıyla gönderildi.' });
  } catch (error) {
    console.error('E-posta Yanıt API Hatası:', error);
    return NextResponse.json({ error: 'E-posta gönderilirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
