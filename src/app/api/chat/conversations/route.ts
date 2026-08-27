/**
 * /api/chat/conversations
 *   GET  — Kullanicinin (veya admin) tum conversation listesini getirir.
 *   POST — Yeni conversation olusturur + ilk mesaji ekler.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatService } from '@/modules/chat';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { CreateConversationSchema } from '@/modules/chat/schemas';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === 'admin') {
      const conversations = await chatService.listAllForAdmin();
      return ok({ conversations });
    }

    const conversations = await chatService.listForUser(userId);
    return ok({ conversations });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi', statusCode: 400 } as any);
    }

    const data = CreateConversationSchema.parse(body);

    const conversation = await chatService.createConversation(
      userId,
      session.user.name ?? 'Kullanıcı',
      data
    );
    return ok({ conversation }, { status: 201 });
  });
}
