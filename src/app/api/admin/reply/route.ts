/**
 * @file Yönetim panelinden e-posta yanıtı göndermek için API rotası.
 * @description Bu rota, gelen mesajlara yönetim paneli üzerinden doğrudan
 *              e-posta ile yanıt gönderilmesini sağlar. `nodemailer` kütüphanesini
 *              kullanarak SMTP sunucusu üzerinden e-posta gönderir. Sadece kimliği
 *              doğrulanmış kullanıcılar erişebilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import nodemailer from 'nodemailer';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  // İstek yapan kullanıcının token'ını ve oturum bilgilerini al
  const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });

  // Kullanıcı oturum açmamışsa, yetkisiz erişim hatası döndür
  if (!token) {
    return NextResponse.json({ error: 'Bu işlemi yapmak için yetkiniz yok.' }, { status: 401 });
  }

  try {
    const { to, subject, html } = await req.json();

    // Gerekli alanların (alıcı, konu, içerik) varlığını kontrol et
    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Alıcı, konu ve içerik alanları zorunludur.' }, { status: 400 });
    }

    // .env dosyasındaki SMTP ayarlarıyla nodemailer taşıyıcısını oluştur
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_SERVER,
      port: Number(env.EMAIL_PORT),
      secure: Number(env.EMAIL_PORT) === 465, // Port 465 ise SSL kullan
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });

    // E-postayı gönder
    await transporter.sendMail({
      from: env.EMAIL_FROM, // Gönderen adresi
      to,                  // Alıcı adresi
      subject,             // E-posta konusu
      html,                // HTML formatındaki e-posta içeriği
    });

    // Başarılı yanıtı döndür
    return NextResponse.json({ success: true, message: 'E-posta başarıyla gönderildi.' });
  } catch (error) {
    // İşlem sırasında bir hata oluşursa, hatayı logla ve istemciye 500 durum koduyla hata mesajı gönder
    console.error('E-posta Yanıt API Hatası:', error);
    return NextResponse.json({ error: 'E-posta gönderilirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
