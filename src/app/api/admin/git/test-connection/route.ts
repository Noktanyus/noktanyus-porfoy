import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { testGitConnection } from '@/lib/git-utils';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await testGitConnection();
    if (result.ok) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ message: `GitHub connection test failed: ${result.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error during git connection test:', error);
    return NextResponse.json({ message: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}