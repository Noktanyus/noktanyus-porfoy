// src/api/admin/git/revert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { revertCommit } from "@/lib/git-utils";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { hash } = body;

    if (!hash || typeof hash !== 'string') {
      return NextResponse.json({ error: "Geçerli bir commit hash'i gereklidir." }, { status: 400 });
    }

    await revertCommit(hash, token.email || "Bilinmeyen Kullanıcı");

    // Revert işleminden sonra ilgili sayfaların önbelleğini temizle.
    // Bu, hangi içeriğin değiştiğini bilmeyi gerektirir, bu yüzden genel bir revalidation yapıyoruz.
    revalidatePath("/", "layout");

    return NextResponse.json({ message: `Commit ${hash} başarıyla geri alındı.` });

  } catch (error) {
    console.error("Revert API hatası:", error);
    return NextResponse.json({ error: (error as Error).message || "Commit geri alınırken bir sunucu hatası oluştu." }, { status: 500 });
  }
}
