/**
 * @file Git commit geçmişini getiren API rotası.
 * @description Bu rota, sunucudaki Git deposunun son 50 commit'ini
 *              alır ve JSON formatında istemciye döndürür. Sadece kimliği
 *              doğrulanmış kullanıcılar erişebilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import simpleGit from 'simple-git';
import path from 'path';
import { env } from '@/lib/env';

// Proje kök dizinini belirle
const portfolioDir = path.resolve(process.cwd());
const git = simpleGit(portfolioDir);

export async function GET(request: NextRequest) {
  // İstek yapan kullanıcının token'ını ve oturum bilgilerini al
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });

  // Kullanıcı oturum açmamışsa, yetkisiz erişim hatası döndür
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    // Git deposundan son 50 commit'i al
    const log = await git.log({
      '--max-count': 50,
    });
    // Commit listesini JSON olarak döndür
    return NextResponse.json(log.all);
  } catch (error) {
    // İşlem sırasında bir hata oluşursa, hatayı logla ve istemciye 500 durum koduyla hata mesajı gönder
    console.error('Git geçmişi alınırken hata:', error);
    return NextResponse.json({ error: 'Git geçmişi alınırken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
