/**
 * @file İletişim formundan gelen verileri işlemek için API rotası.
 * @description Bu rota, iletişim formundan gönderilen mesajları alır.
 *              Önce Cloudflare Turnstile ile bot doğrulaması yapar, ardından
 *              gelen mesajı benzersiz bir ID ile bir JSON dosyası olarak
 *              `content/messages` dizinine kaydeder.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '@/lib/env';

/**
 * Cloudflare Turnstile token'ını doğrular.
 * @param token - İstemciden gelen Turnstile token'ı.
 * @returns {Promise<boolean>} Token geçerliyse `true`, değilse `false`.
 */
async function verifyTurnstile(token: string): Promise<boolean> {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${encodeURIComponent(env.TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(token)}`,
  });
  const data = await response.json();
  return data.success;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, turnstileToken } = body;

    // Turnstile token'ının varlığını kontrol et
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Doğrulama tokenı eksik. Lütfen sayfayı yenileyip tekrar deneyin.' }, { status: 400 });
    }

    // Turnstile token'ını doğrula
    const isTokenValid = await verifyTurnstile(turnstileToken);
    if (!isTokenValid) {
      return NextResponse.json({ error: 'Bot doğrulaması başarısız oldu. Bir insan olduğunuzdan emin misiniz?' }, { status: 401 });
    }

    // Gerekli tüm form alanlarının dolu olduğunu kontrol et
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Tüm alanların doldurulması zorunludur.' }, { status: 400 });
    }

    // Kaydedilecek yeni mesaj nesnesini oluştur
    const newMessage = {
      id: uuidv4(), // Benzersiz bir ID ata
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(), // Mesajın zaman damgası
      isRead: false, // Okunma durumu (varsayılan: okunmadı)
      replies: [],   // Yanıtlar için boş bir dizi
    };

    // Mesajı `content/messages` dizinine kaydet
    const messagesDir = path.join(process.cwd(), 'content', 'messages');
    await fs.mkdir(messagesDir, { recursive: true }); // Dizin yoksa oluştur
    const filePath = path.join(messagesDir, `${newMessage.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(newMessage, null, 2));

    // Başarılı yanıtı döndür
    return NextResponse.json({ success: true, message: 'Mesajınız başarıyla tarafımıza iletilmiştir.' });
  } catch (error) {
    // Hata durumunda sunucu konsoluna hatayı yazdır ve genel bir hata mesajı döndür
    console.error('İletişim Formu API Hatası:', error);
    return NextResponse.json({ error: 'Mesajınız gönderilirken beklenmedik bir hata oluştu.' }, { status: 500 });
  }
}
