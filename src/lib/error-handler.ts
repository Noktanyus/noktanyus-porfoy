/**
 * @file Hata yönetimi için yardımcı fonksiyonlar
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Production'da kullanıcıya göstereceğimiz güvenli varsayılan 500 mesajı.
 * ASLA internal hata detayı içermez (stack trace, SQL, credentials, vb.).
 */
const PRODUCTION_GENERIC_500 = 'Beklenmeyen bir sunucu hatası oluştu.';

/**
 * Bilinen Prisma hata sınıfları — string match yerine constructor / code
 * kontrolü tercih edilir, ancak Prisma'nın client API'si her zaman aynı
 * sınıfları export etmediği için string fallback ile birlikte savunma
 * katmanı olarak kullanılır.
 */
function classifyPrismaError(message: string): { message: string; statusCode: number } | null {
  // Unique constraint (P2002)
  if (message.includes('Unique constraint') || message.includes('P2002')) {
    return { message: 'Bu kayıt zaten mevcut.', statusCode: 409 };
  }
  // Record not found (P2025)
  if (message.includes('Record to update not found') || message.includes('P2025')) {
    return { message: 'Güncellenecek kayıt bulunamadı.', statusCode: 404 };
  }
  // Foreign key constraint (P2003)
  if (message.includes('Foreign key constraint') || message.includes('P2003')) {
    return {
      message: 'İlişkili kayıtlar nedeniyle işlem gerçekleştirilemedi.',
      statusCode: 400,
    };
  }
  return null;
}

function isZodError(error: Error): boolean {
  return (
    error.name === 'ZodError' ||
    error.constructor?.name === 'ZodError' ||
    // Zod'un kendi `issues` alanı — diğer error sınıflarıyla çakışma riski düşük
    Array.isArray((error as unknown as { issues?: unknown }).issues)
  );
}

export function handleApiError(error: unknown): { message: string; statusCode: number } {
  // AppError her zaman kullanıcı-dostu mesaj taşır (uygulama katmanı
  // tarafından üretildiği için safe kabul edilir).
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Prisma — bilinen hatalar
    const prismaClassified = classifyPrismaError(error.message);
    if (prismaClassified) return prismaClassified;

    // Zod — input validation
    if (isZodError(error)) {
      return {
        message: 'Geçersiz veri formatı.',
        statusCode: 400,
      };
    }

    // Production'da internal Error.message ASLA sızdırılmaz.
    // Sadece geliştirme ortamında ham mesaj kullanıcıya gösterilir.
    if (isProduction()) {
      // Log internal error for ops; response is generic.
      console.error('[error-handler] masked internal error:', {
        name: error.name,
        message: error.message,
      });
      return {
        message: PRODUCTION_GENERIC_500,
        statusCode: 500,
      };
    }

    return {
      message: error.message,
      statusCode: 500,
    };
  }

  // Non-Error throwables (string, number, undefined, ...) — production'da
  // ASLA ham değeri dışarıya verme.
  if (isProduction()) {
    return {
      message: PRODUCTION_GENERIC_500,
      statusCode: 500,
    };
  }
  return {
    message: 'Bilinmeyen bir hata oluştu.',
    statusCode: 500,
  };
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  
  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr}${error.name}: ${error.message}`);
    if (!isProduction()) {
      console.error(error.stack);
    }
  } else {
    console.error(`${timestamp} ${contextStr}Unknown error:`, error);
  }
}