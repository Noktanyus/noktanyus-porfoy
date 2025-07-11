
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";
import { analyzeChanges } from "@/lib/git-utils";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: "Bu işlemi yapmak için yetkiniz yok." }, { status: 403 });
  }

  try {
    const suggestion = await analyzeChanges();
    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Analyze Changes API Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
