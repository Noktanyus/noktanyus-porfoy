/**
 * @file GitHub bağlantısını test etmek için API rotası.
 * @description Bu rota, .env dosyasındaki GitHub kimlik bilgilerinin
 *              doğruluğunu ve uzak depoya erişilip erişilemediğini test eder.
 *              Sadece 'admin' rolüne sahip kullanıcılar erişebilir.
 */

import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { testGitConnection } from '@/lib/git-utils';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  // İstek yapan kullanıcının token'ını ve oturum bilgilerini al
  const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });

  // Kullanıcı oturum açmamışsa veya rolü 'admin' değilse, yetkisiz erişim hatası döndür
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Bu işlemi yapmak için yetkiniz yok.' }, { status: 403 });
  }

  try {
    // Bağlantı testini yapan yardımcı fonksiyonu çağır
    const result = await testGitConnection();
    
    // Sonuca göre başarılı veya başarısız yanıtı döndür
    if (result.ok) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ message: `GitHub bağlantı testi başarısız: ${result.message}` }, { status: 500 });
    }
  } catch (error: any) {
    // Beklenmedik bir hata oluşursa, hatayı logla ve istemciye 500 durum koduyla hata mesajı gönder
    console.error('Git bağlantı testi sırasında beklenmedik hata:', error);
    return NextResponse.json({ message: `Beklenmedik bir hata oluştu: ${error.message}` }, { status: 500 });
  }
}
