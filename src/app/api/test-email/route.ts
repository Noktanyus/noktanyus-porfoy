import { env } from '@/lib/env';
/**
 * @file SMTP e-posta sunucusu bağlantısını test etmek için API rotası.
 * @description Bu rota, .env dosyasında tanımlanan SMTP ayarlarını kullanarak
 *              e-posta sunucusuna bir bağlantı kurmayı dener. Sadece 'admin'
 *              rolüne sahip kullanıcılar bu işlemi yapabilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  // 1. Yetkilendirme: Kullanıcı admin mi?
  const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Bu işlemi yapmak için yönetici yetkiniz bulunmamaktadır.' }, { status: 403 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_SERVER,
      port: Number(env.EMAIL_PORT),
      secure: Number(env.EMAIL_PORT) === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
      // Daha kısa bir timeout süresi belirleyerek DoS saldırılarına karşı daha dirençli hale getir
      connectionTimeout: 10 * 1000, // 10 saniye
    });

    await transporter.verify();

    return NextResponse.json({ success: true, message: 'SMTP bağlantısı başarıyla doğrulandı.' });
  } catch (error) {
    // 2. Güvenlik: Hassas hata detaylarını sızdırma
    console.error('E-posta bağlantı testi hatası:', error);
    // İstemciye sadece genel bir hata mesajı gönder
    return NextResponse.json(
      { 
        success: false, 
        error: 'SMTP bağlantısı başarısız oldu. Lütfen .env dosyasındaki EMAIL_ ayarlarınızı kontrol edin.' 
      }, 
      { status: 500 }
    );
  }
}
