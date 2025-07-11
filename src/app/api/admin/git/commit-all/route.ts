/**
 * @file Kaynak kodundaki tüm değişiklikleri commit'leyip göndermek için API rotası.
 * @description Bu rota, yönetim panelinden tetiklenerek, 'content' klasörü dışındaki
 *              tüm değişiklikleri alır, belirtilen bir mesajla commit'ler ve uzak
 *              depoya (GitHub) gönderir. Sadece 'admin' rolüne sahip kullanıcılar
 *              bu işlemi gerçekleştirebilir.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { commitAllChanges } from "@/lib/git-utils";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  // İstek yapan kullanıcının token'ını ve oturum bilgilerini al
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });

  // Kullanıcı oturum açmamışsa veya rolü 'admin' değilse, yetkisiz erişim hatası döndür
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: "Bu işlemi yapmak için yetkiniz yok." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { message } = body;

    // Commit mesajı boş veya geçersizse, hata döndür
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: "Geçerli bir commit mesajı gereklidir." }, { status: 400 });
    }

    // Git işlemini gerçekleştiren yardımcı fonksiyonu çağır
    const result = await commitAllChanges(message, token.email || "Bilinmeyen Kullanıcı");
    
    // Başarılı sonuç dönerse, istemciye başarı mesajı gönder
    return NextResponse.json(result);

  } catch (error) {
    // İşlem sırasında bir hata oluşursa, hatayı logla ve istemciye 500 durum koduyla hata mesajı gönder
    console.error("Commit All API Hatası:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
