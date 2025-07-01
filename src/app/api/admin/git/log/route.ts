import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import simpleGit from 'simple-git';
import path from 'path';

const portfolioDir = path.resolve(process.cwd());
const git = simpleGit(portfolioDir);

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const log = await git.log({
      '--max-count': 50, // Get latest 50 commits
    });
    return NextResponse.json(log.all);
  } catch (error) {
    console.error('Error getting git log:', error);
    return NextResponse.json({ error: 'Failed to retrieve git log' }, { status: 500 });
  }
}
