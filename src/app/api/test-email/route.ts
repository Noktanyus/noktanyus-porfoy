/**
 * @file SMTP e-posta sunucusu bağlantısını test etmek için API rotası.
 * @description Bu rota, .env dosyasında tanımlanan SMTP ayarlarını kullanarak
 *              e-posta sunucusuna bir bağlantı kurmayı dener. Bu, yönetim
 *              panelinden e-posta ayarlarının doğruluğunu kontrol etmek için
 *              kullanışlıdır.
 */

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
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

    // `verify` metodu ile sunucuya bağlanmayı ve kimlik doğrulamayı dene
    await transporter.verify();

    // Bağlantı başarılı olursa, başarılı bir yanıt döndür
    return NextResponse.json({ success: true, message: 'SMTP bağlantısı başarıyla doğrulandı.' });
  } catch (error) {
    // Hata durumunda, hatayı konsola yazdır ve detaylı bir hata mesajı döndür
    console.error('E-posta bağlantı testi hatası:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'SMTP bağlantısı başarısız oldu.', 
        details: errorMessage 
      }, 
      { status: 500 }
    );
  }
}
