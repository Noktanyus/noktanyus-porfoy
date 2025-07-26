import "@/lib/env";
/**
 * @file İletişim formundan gelen verileri işlemek için API rotası.
 * @description Bu rota, iletişim formundan gönderilen mesajları alır ve
 *              gelen veriyi doğrular ve Prisma aracılığıyla veritabanına kaydeder.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';

// Gelen isteğin gövdesini doğrulamak için Zod şeması
const contactSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").max(100, "İsim çok uzun."),
  email: z.string().email({ message: "Lütfen geçerli bir e-posta adresi girin." }),
  subject: z.string().min(3, "Konu en az 3 karakter olmalıdır.").max(200, "Konu çok uzun."),
  message: z.string().min(10, "Mesajınız en az 10 karakter olmalıdır.").max(5000, "Mesajınız çok uzun."),
  turnstileToken: z.string().min(1, "Güvenlik doğrulaması gerekli."),
});

// Turnstile doğrulama fonksiyonu
async function verifyTurnstile(token: string): Promise<boolean> {
  try {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('Turnstile secret key bulunamadı');
      return false;
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile doğrulama hatası:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Veri Doğrulama
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      const zodError = validation.error as ZodError;
      const errorMessage = zodError.errors.map(err => err.message).join(' ');
      return NextResponse.json({ error: `Geçersiz form verisi: ${errorMessage}` }, { status: 400 });
    }
    
    const { name, email, subject, message, turnstileToken } = validation.data;

    // 2. Turnstile Doğrulama
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return NextResponse.json({ error: 'Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.' }, { status: 400 });
    }

    // 3. Veritabanına Kaydetme
    await prisma.message.create({
      data: {
        name,
        email,
        subject,
        message,
        // isRead ve timestamp varsayılan değerlerini şemadan alacak
      }
    });

    return NextResponse.json({ success: true, message: 'Mesajınız başarıyla tarafımıza iletilmiştir. En kısa sürede dönüş yapılacaktır.' });
  } catch (error) {
    console.error('İletişim Formu API Hatası:', error);
    return NextResponse.json({ error: 'Mesajınız gönderilirken sunucu tarafında bir hata oluştu.' }, { status: 500 });
  }
}
