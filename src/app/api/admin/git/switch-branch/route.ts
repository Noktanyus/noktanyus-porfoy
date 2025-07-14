
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";
import { switchBranch } from "@/lib/git-utils";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: "Bu işlemi yapmak için yetkiniz yok." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { branch } = body;

    if (!branch || typeof branch !== 'string') {
      return NextResponse.json({ error: "Geçerli bir dal adı gereklidir." }, { status: 400 });
    }

    const result = await switchBranch(branch);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Switch Branch API Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
