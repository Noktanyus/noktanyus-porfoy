/**
 * Messaging Module — Repository Layer
 *
 * Message modeline erişim. BaseRepository + özel domain method'ları.
 */

import { BaseRepository } from '../shared/repository';
import type { Message } from '@prisma/client';
import { NotFoundError } from '../shared/errors';

export class MessageRepository extends BaseRepository<Message> {
  protected get model() {
    return this.prisma.message;
  }

  async findUnread(): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { isRead: false },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findAllOrdered(): Promise<Message[]> {
    return this.prisma.message.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }

  async markAsRead(id: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAsUnread(id: string): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data: { isRead: false },
    });
  }

  async addReply(
    id: string,
    reply: { message: string; sentBy: string }
  ): Promise<Message> {
    const msg = await this.findById(id);
    if (!msg) throw new NotFoundError('Mesaj');

    const replies = Array.isArray(msg.replies) ? msg.replies : [];
    const newReplies = [
      ...(replies as Array<{ message: string; sentBy: string; sentAt?: string }>),
      { ...reply, sentAt: new Date().toISOString() },
    ];
    return this.prisma.message.update({
      where: { id },
      data: {
        replies: newReplies as unknown as object,
      },
    });
  }
}

export const messageRepository = new MessageRepository();