// src/app/api/admin/git/commit-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { commitAllChanges } from "@/lib/git-utils";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') { // Sadece adminler yapabilsin
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Commit mesajı gereklidir." }, { status: 400 });
    }

    const result = await commitAllChanges(message, token.email || "Bilinmeyen Kullanıcı");
    return NextResponse.json(result);

  } catch (error) {
    console.error("Commit All API hatası:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
