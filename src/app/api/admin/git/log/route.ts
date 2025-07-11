/**
 * @file Git commit geçmişini getiren API rotası.
 * @description Bu rota, `git-utils` kullanarak sunucudaki Git deposunun
 *              son 50 commit'ini alır ve hassas verilerden arındırarak
 *              JSON formatında istemciye döndürür. Sadece kimliği
 *              doğrulanmış kullanıcılar erişebilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getCommitHistory } from '@/lib/git-utils';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  // 1. Yetkilendirme: Kullanıcı oturum açmış mı?
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: 'Bu bilgilere erişim yetkiniz bulunmamaktadır.' }, { status: 401 });
  }

  try {
    // 2. Merkezi Fonksiyonu Kullanma: Kod tekrarını önle
    const history = await getCommitHistory();

    // 3. Güvenlik: Hassas verileri yanıttan temizle
    const sanitizedHistory = history.map(commit => {
      // E-posta adreslerini ve potansiyel olarak hassas diğer alanları kaldır
      const { author_email, body, ...rest } = commit;
      return rest;
    });

    return NextResponse.json(sanitizedHistory);
    
  } catch (error) {
    console.error('Git geçmişi API hatası:', error);
    return NextResponse.json({ error: 'Git geçmişi alınırken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
