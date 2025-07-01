import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

async function verifyTurnstile(token: string) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${encodeURIComponent(process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!)}&response=${encodeURIComponent(token)}`,
  });
  const data = await response.json();
  return data.success;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, turnstileToken } = body;

    if (!turnstileToken) {
      return NextResponse.json({ error: 'Doğrulama tokenı eksik.' }, { status: 400 });
    }

    const isTokenValid = await verifyTurnstile(turnstileToken);
    if (!isTokenValid) {
      return NextResponse.json({ error: 'Doğrulama başarısız.' }, { status: 401 });
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 });
    }

    const newMessage = {
      id: uuidv4(),
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      replies: [],
    };

    const messagesDir = path.join(process.cwd(), 'content', 'messages');
    await fs.mkdir(messagesDir, { recursive: true });
    const filePath = path.join(messagesDir, `${newMessage.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(newMessage, null, 2));

    return NextResponse.json({ success: true, message: 'Mesajınız başarıyla gönderildi.' });
  } catch (error) {
    console.error('İletişim formu hatası:', error);
    return NextResponse.json({ error: 'Mesaj gönderilirken bir hata oluştu.' }, { status: 500 });
  }
}
