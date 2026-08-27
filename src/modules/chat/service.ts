/**
 * Chat Module — Service Layer
 *
 * Conversation ve message yonetimi, okundu isaretleme, kapatma.
 */

import { chatRepository, chatMessageRepository } from './repository';
import {
  CreateConversationSchema,
  SendMessageSchema,
  type CreateConversationInput,
  type SendMessageInput,
} from './schemas';
import { logger } from '@/lib/logger';

export const chatService = {
  /**
   * Yeni conversation olusturur ve ilk mesaji ekler.
   */
  async createConversation(
    userId: string,
    userName: string,
    input: CreateConversationInput
  ) {
    const conversation = await chatRepository.create({
      userId,
      subject: input.subject,
      status: 'open',
      lastMessageAt: new Date(),
      unreadByAdmin: 1,
    });

    await chatMessageRepository.create({
      conversationId: conversation.id,
      senderId: userId,
      senderRole: 'user',
      senderName: userName,
      content: input.message,
      attachments: [],
    });

    logger.info('Chat conversation created', {
      conversationId: conversation.id,
      userId,
    });

    return conversation;
  },

  /**
   * Conversation'a yeni mesaj ekler.
   * Sender rolune gore unread count artirilir.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: 'user' | 'admin',
    senderName: string,
    input: SendMessageInput
  ) {
    const message = await chatMessageRepository.create({
      conversationId,
      senderId,
      senderRole,
      senderName,
      content: input.content,
      attachments: input.attachments ?? [],
    });

    const isFromUser = senderRole === 'user';
    await chatRepository.update(conversationId, {
      lastMessageAt: new Date(),
      status: 'open',
      ...(isFromUser
        ? ({ unreadByAdmin: { increment: 1 } } as any)
        : ({ unreadByUser: { increment: 1 } } as any)),
    });

    return message;
  },

  /**
   * Kullanicinin conversation'larini listeler.
   */
  async listForUser(userId: string) {
    return chatRepository.findByUserId(userId);
  },

  /**
   * Admin icin acik conversation'lari listeler.
   */
  async listForAdmin() {
    return chatRepository.findOpenForAdmin();
  },

  /**
   * Tum conversation'lari listeler (admin tum gecmis dahil).
   */
  async listAllForAdmin() {
    return chatRepository.findAllForAdmin();
  },

  /**
   * Conversation mesajlarini getirir.
   */
  async getMessages(conversationId: string) {
    return chatMessageRepository.findByConversation(conversationId);
  },

  /**
   * Mesajlari okundu olarak isaretler + unread count sifirlar.
   */
  async markRead(conversationId: string, byRole: 'user' | 'admin') {
    await chatMessageRepository.markRead(conversationId, byRole);
    await chatRepository.update(conversationId, {
      ...(byRole === 'admin' ? { unreadByAdmin: 0 } : { unreadByUser: 0 }),
    });
  },

  /**
   * Conversation'i kapatir.
   */
  async close(conversationId: string) {
    return chatRepository.update(conversationId, {
      status: 'closed',
      closedAt: new Date(),
    });
  },

  /**
   * Conversation'i tekrar acar.
   */
  async reopen(conversationId: string) {
    return chatRepository.update(conversationId, {
      status: 'open',
      closedAt: null,
    });
  },

  /**
   * Conversation'a admin atar.
   */
  async assignTo(conversationId: string, adminId: string) {
    return chatRepository.update(conversationId, {
      assignedTo: adminId,
      status: 'waiting',
    });
  },
};
