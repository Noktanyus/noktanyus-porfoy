/**
 * Messaging Module — Service Layer
 *
 * Business logic: Contact form validation, Turnstile, message operations.
 */

import {
  ContactFormSchema,
  MessageReplyInputSchema,
} from './schemas';
import { messageRepository } from './repository';
import { verifyTurnstile } from './turnstile';
import { ValidationError } from '@/modules/shared/errors';

export const messagingService = {
  /**
   * İletişim formu submission'ı.
   * Turnstile doğrular, validate eder, DB'ye yazar.
   */
  async submitContactForm(input: unknown) {
    const validated = ContactFormSchema.parse(input);

    const isValid = await verifyTurnstile(validated.turnstileToken);
    if (!isValid) {
      throw new ValidationError('Bot doğrulaması başarısız');
    }

    return messageRepository.create({
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
      message: validated.message,
      replies: [],
    });
  },

  async listMessages(filter?: 'unread' | 'all') {
    if (filter === 'unread') {
      return messageRepository.findUnread();
    }
    return messageRepository.findAllOrdered();
  },

  async getMessageById(id: string) {
    const msg = await messageRepository.findById(id);
    if (!msg) {
      const { NotFoundError } = await import('@/modules/shared/errors');
      throw new NotFoundError('Mesaj');
    }
    return msg;
  },

  async replyToMessage(id: string, input: unknown) {
    const validated = MessageReplyInputSchema.parse(input);
    return messageRepository.addReply(id, validated);
  },

  async markRead(id: string) {
    return messageRepository.markAsRead(id);
  },

  async markUnread(id: string) {
    return messageRepository.markAsUnread(id);
  },

  async deleteMessage(id: string) {
    return messageRepository.delete(id);
  },
};