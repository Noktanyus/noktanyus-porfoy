/**
 * @file İletişim formundan gelen verileri işlemek için API rotası.
 * @description Bu rota, iletişim formundan gönderilen mesajları alır ve
 *              gelen veriyi doğrular ve Prisma aracılığıyla veritabanına kaydeder.
 *
 *              Rate limiting, error handling ve audit logging tüm
 *              standart middleware'lerle sarmalanmıştır (withRateLimit,
 *              withErrorHandling).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { ValidationError } from '@/lib/errors';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

// Gelen isteğin gövdesini doğrulamak için Zod şeması
const contactSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır.').max(100, 'İsim çok uzun.'),
  email: z.string().email({ message: 'Lütfen geçerli bir e-posta adresi girin.' }),
  subject: z.string().min(3, 'Konu en az 3 karakter olmalıdır.').max(200, 'Konu çok uzun.'),
  message: z.string().min(10, 'Mesajınız en az 10 karakter olmalıdır.').max(5000, 'Mesajınız çok uzun.'),
  turnstileToken: z.string().min(1, 'Güvenlik doğrulaması gerekli.'),
});

// Turnstile doğrulama fonksiyonu
async function verifyTurnstile(token: string): Promise<boolean> {
  try {
    const secretKey = env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      // Secret key yoksa reddet — production'da yanlış pozitif kabul etmek
      // güvenlik açığıdır. Lokal/dev ortamda kasten devre dışı bırakmak
      // isterseniz bu satırı kaldırın; aksi halde her zaman başarısız olur.
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

    if (!response.ok) return false;
    const data = await response.json();
    return data.success === true;
  } catch {
    // Turnstile servisi erişilemezse güvenli tarafta kal — mesajı reddet.
    return false;
  }
}

export const POST = withRateLimit(RateLimits.contactForm, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => {
      throw new ValidationError('Geçersiz JSON gövdesi');
    });
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        'Geçersiz form verisi: ' + parsed.error.errors.map(e => e.message).join(' ')
      );
    }
    const { name, email, subject, message, turnstileToken } = parsed.data;

    // 2. Turnstile Doğrulama
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      throw new ValidationError('Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.');
    }

    // 3. Veritabanına Kaydetme
    const created = await prisma.message.create({
      data: { name, email, subject, message },
      select: { id: true, timestamp: true },
    });

    // 4. Audit log — fire-and-forget (KVKK uyumlu)
    logAudit({
      action: 'CREATE',
      resource: 'message',
      resourceId: created.id,
      details: { subject, hasEmail: Boolean(email) },
    }).catch(() => undefined);

    return ok({
      message: 'Mesajınız başarıyla tarafımıza iletilmiştir. En kısa sürede dönüş yapılacaktır.',
    });
  });
});

// Hata formatı yardımcısı — fail() ile uyumlu (geriye dönük uyumluluk)
// Not: withErrorHandling zaten bunu otomatik yapar; burada export etmiyoruz
// çünkü route içinde kullanılmıyor. Eski API'yi kullanan caller varsa
// NextResponse.json ile dönüş zaten uyumlu.
export const _unused = fail;
