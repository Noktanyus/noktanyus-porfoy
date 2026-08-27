/**
 * Chat Module — Repository Layer
 *
 * Prisma-backed repository for ChatConversation + ChatMessage.
 */

import { BaseRepository } from '../shared/repository';
import type { ChatConversation, ChatMessage } from '@prisma/client';

export class ChatRepository extends BaseRepository<ChatConversation> {
  protected get model() {
    return this.prisma.chatConversation;
  }

  async findByUserId(userId: string) {
    return this.prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async findOpenForAdmin(limit = 50) {
    return this.prisma.chatConversation.findMany({
      where: { status: { in: ['open', 'waiting'] } },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
    });
  }

  async findAllForAdmin(limit = 100) {
    return this.prisma.chatConversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
    });
  }
}

export class ChatMessageRepository extends BaseRepository<ChatMessage> {
  protected get model() {
    return this.prisma.chatMessage;
  }

  async findByConversation(conversationId: string) {
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markRead(conversationId: string, byRole: 'user' | 'admin') {
    // Mark all messages from opposite role as read
    return this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderRole: byRole === 'admin' ? 'user' : 'admin',
        read: false,
      },
      data: { read: true, readAt: new Date() },
    });
  }
}

export const chatRepository = new ChatRepository();
export const chatMessageRepository = new ChatMessageRepository();
