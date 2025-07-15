// src/lib/auth-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { env } from '@/lib/env';

type ApiHandler = (request: NextRequest, params: { [key: string]: any }) => Promise<NextResponse>;

/**
 * API rotalarını sarmalayarak yönetici yetkilendirmesi ekleyen bir yardımcı fonksiyon.
 *
 * @param handler - Yetkilendirme başarılı olduğunda çalıştırılacak olan asıl API işleyici fonksiyonu.
 * @returns Sarmalanmış ve yetki kontrolü yapan yeni bir API işleyici fonksiyonu.
 */
export function withAdminAuth(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, params: { [key: string]: any }) => {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });

    // 1. Oturum var mı?
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' }, { status: 401 });
    }

    // 2. Kullanıcı 'admin' rolüne sahip mi?
    if (token.role !== 'admin') {
      return NextResponse.json({ error: 'Bu işlemi yapmak için yönetici yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    // Yetkilendirme başarılı, asıl işleyiciyi çalıştır.
    return handler(request, params);
  };
}
