/**
 * /api/chat/conversations/[id]/read
 *   POST — Conversation mesajlarini okundu olarak isaretler.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatService } from '@/modules/chat';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: params.id },
    });
    if (!conversation) {
      return fail({ code: 'NOT_FOUND', message: 'Konuşma bulunamadı', statusCode: 404 } as any);
    }
    if (role !== 'admin' && conversation.userId !== userId) {
      return fail({ code: 'FORBIDDEN', message: 'Bu konuşmaya erişim yetkiniz yok', statusCode: 403 } as any);
    }

    const byRole: 'user' | 'admin' = role === 'admin' ? 'admin' : 'user';
    await chatService.markRead(params.id, byRole);

    return ok({ success: true });
  });
}
