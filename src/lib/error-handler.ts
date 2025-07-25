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

export function handleApiError(error: unknown): { message: string; statusCode: number } {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Prisma hataları
    if (error.message.includes('Unique constraint')) {
      return {
        message: 'Bu kayıt zaten mevcut.',
        statusCode: 409,
      };
    }

    if (error.message.includes('Record to update not found')) {
      return {
        message: 'Güncellenecek kayıt bulunamadı.',
        statusCode: 404,
      };
    }

    if (error.message.includes('Foreign key constraint')) {
      return {
        message: 'İlişkili kayıtlar nedeniyle işlem gerçekleştirilemedi.',
        statusCode: 400,
      };
    }

    // Zod validation hataları
    if (error.name === 'ZodError') {
      return {
        message: 'Geçersiz veri formatı.',
        statusCode: 400,
      };
    }

    return {
      message: error.message,
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