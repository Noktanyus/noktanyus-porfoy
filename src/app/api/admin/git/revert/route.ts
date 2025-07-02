/**
 * @file Belirli bir Git commit'ini geri almak için API rotası.
 * @description Bu rota, yönetim panelinden gönderilen bir commit hash'ini kullanarak
 *              ilgili değişikliği geri alır (`git revert`). İşlem sonrası ilgili
 *              sayfaların önbelleğini temizler. Sadece kimliği doğrulanmış
 *              kullanıcılar bu işlemi yapabilir.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { revertCommit } from "@/lib/git-utils";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  // İstek yapan kullanıcının token'ını ve oturum bilgilerini al
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });

  // Kullanıcı oturum açmamışsa, yetkisiz erişim hatası döndür
  if (!token) {
    return NextResponse.json({ error: "Bu işlemi yapmak için yetkiniz yok." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { hash } = body;

    // Gelen hash geçerli bir string değilse hata döndür
    if (!hash || typeof hash !== 'string') {
      return NextResponse.json({ error: "Geçerli bir commit hash'i gereklidir." }, { status: 400 });
    }

    // Git geri alma işlemini gerçekleştiren yardımcı fonksiyonu çağır
    await revertCommit(hash, token.email || "Bilinmeyen Kullanıcı");

    // Revert işleminden sonra, değişikliğin sitede görünür olması için
    // tüm sayfaların önbelleğini temizle. 'layout' parametresi tüm siteyi kapsar.
    revalidatePath("/", "layout");

    // Başarılı sonuç mesajını istemciye gönder
    return NextResponse.json({ message: `'${hash.substring(0,7)}' hash'li commit başarıyla geri alındı.` });

  } catch (error) {
    // İşlem sırasında bir hata oluşursa, hatayı logla ve istemciye 500 durum koduyla hata mesajı gönder
    console.error("Revert API Hatası:", error);
    return NextResponse.json({ error: (error as Error).message || "Commit geri alınırken bir sunucu hatası oluştu." }, { status: 500 });
  }
}
