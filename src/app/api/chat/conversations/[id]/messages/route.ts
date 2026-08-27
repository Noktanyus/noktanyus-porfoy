/**
 * /api/chat/conversations/[id]/messages
 *   GET  — Conversation mesajlarini listeler.
 *   POST — Conversation'a yeni mesaj ekler.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatService } from '@/modules/chat';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { SendMessageSchema } from '@/modules/chat/schemas';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: params.id },
    });
    if (!conversation) {
      return fail({ code: 'NOT_FOUND', message: 'Konuşma bulunamadı', statusCode: 404 } as any);
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    if (role !== 'admin' && conversation.userId !== userId) {
      return fail({ code: 'FORBIDDEN', message: 'Bu konuşmaya erişim yetkiniz yok', statusCode: 403 } as any);
    }

    const messages = await chatService.getMessages(params.id);
    return ok({ messages });
  });
}

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
      return fail({ code: 'FORBIDDEN', message: 'Bu konuşmaya mesaj gönderme yetkiniz yok', statusCode: 403 } as any);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi', statusCode: 400 } as any);
    }

    const data = SendMessageSchema.parse(body);

    const senderRole: 'user' | 'admin' = role === 'admin' ? 'admin' : 'user';
    const senderId = role === 'admin' ? userId ?? 'admin' : userId;
    const senderName =
      role === 'admin'
        ? session.user.name ?? 'Destek'
        : session.user.name ?? 'Kullanıcı';

    const message = await chatService.sendMessage(
      params.id,
      senderId,
      senderRole,
      senderName,
      data
    );
    return ok({ message }, { status: 201 });
  });
}
