/**
 * @file /api/saas-ui/brand-voice/[id] - Session-based brand voice silme.
 * @description UI için: workspace üyesi olan user, kendi workspace'indeki
 *              brand voice'u silebilir. API key gerektirmez.
 *
 *              DELETE: ?id= ile tek silme
 *              Workspace üyeliği WorkspaceMember üzerinden kontrol edilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Giriş gerekli' } },
      { status: 401 }
    );
  }

  const userId = session.user.id as string;
  const id = params.id;

  // Brand voice'un sahip olduğu workspace'e user üye mi?
  const voice = await prisma.brandVoice.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, name: true },
  });
  if (!voice) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Marka sesi bulunamadı' } },
      { status: 404 }
    );
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId: voice.workspaceId },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Bu workspace\'e erişim yetkiniz yok' } },
      { status: 403 }
    );
  }

  await prisma.brandVoice.delete({ where: { id } });

  return NextResponse.json({
    success: true,
    data: { id, deleted: true, name: voice.name },
  });
}
