
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";
import { getBranches } from "@/lib/git-utils";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: "Bu işlemi yapmak için yetkiniz yok." }, { status: 403 });
  }

  try {
    const branches = await getBranches();
    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Get Branches API Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
