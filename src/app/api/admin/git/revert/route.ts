/**
 * @file Belirli bir Git commit'ini geri almak için API rotası.
 * @description Bu rota, yönetim panelinden gönderilen bir commit hash'ini kullanarak
 *              ilgili değişikliği geri alır (`git revert`). İşlem sonrası ilgili
 *              sayfaların önbelleğini temizler. Sadece 'admin' rolüne sahip
 *              kullanıcılar bu işlemi yapabilir.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { revertCommit } from "@/lib/git-utils";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  // 1. Yetkilendirme: Kullanıcı admin mi?
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: "Bu işlemi yapmak için yönetici yetkiniz bulunmamaktadır." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { hash } = body;

    // 2. Veri Doğrulama: Hash geçerli mi?
    if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
      return NextResponse.json({ error: "Geçerli bir commit hash'i gereklidir." }, { status: 400 });
    }

    // 3. Güvenli İşlem: Merkezi fonksiyonu çağır
    await revertCommit(hash, token.email || "Bilinmeyen Kullanıcı");

    // 4. Önbellek Temizleme: Değişikliğin siteye yansımasını sağla
    revalidatePath("/", "layout");

    return NextResponse.json({ message: `'${hash.substring(0,7)}' hash'li commit başarıyla geri alındı.` });

  } catch (error) {
    console.error("Revert API Hatası:", error);
    return NextResponse.json({ error: (error as Error).message || "Commit geri alınırken bir sunucu hatası oluştu." }, { status: 500 });
  }
}
