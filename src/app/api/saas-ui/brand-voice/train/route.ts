/**
 * @file /api/saas-ui/brand-voice/train - Session-based brand voice training.
 * @description /api/saas/brand-voice/train API-key tabanlıdır; UI için
 *              session-bridged sürüm. Workspace otomatik çözümlenir.
 *
 *              Auth: getServerSession
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { brandVoiceService } from '@/modules/brand-voice/service';
import { TrainBrandVoiceSchema } from '@/modules/brand-voice/schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Giriş gerekli' } },
      { status: 401 }
    );
  }

  const userId = session.user.id as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_BODY', message: 'JSON body gerekli' } },
      { status: 400 }
    );
  }

  const { workspaceId: _ignored, ...rest } = (body ?? {}) as Record<string, unknown>;
  void _ignored;

  const parsed = TrainBrandVoiceSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validasyon hatası',
          details: parsed.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  // Workspace otomatik çöz
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'desc' },
    select: { workspaceId: true },
  });
  if (!membership) {
    return NextResponse.json(
      { success: false, error: { code: 'WORKSPACE_REQUIRED', message: 'Önce bir workspace oluşturun' } },
      { status: 400 }
    );
  }

  try {
    const voice = await brandVoiceService.trainBrandVoice(
      membership.workspaceId,
      {
        name: parsed.data.name,
        description: parsed.data.description,
        samples: parsed.data.samples,
      },
      { userId, userEmail: session.user.email ?? undefined }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: voice.id,
        workspaceId: voice.workspaceId,
        name: voice.name,
        description: voice.description,
        model: voice.model,
        trainedAt: voice.trainedAt?.toISOString() ?? null,
        createdAt: voice.createdAt.toISOString(),
        updatedAt: voice.updatedAt.toISOString(),
        sampleCount: voice.sampleCount,
        patterns: voice.patterns,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eğitim başarısız';
    return NextResponse.json(
      { success: false, error: { code: 'TRAIN_FAILED', message } },
      { status: 500 }
    );
  }
}
