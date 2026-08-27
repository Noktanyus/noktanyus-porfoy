import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messagingService } from '../service';
import { messageRepository } from '../repository';

// Repository mock
vi.mock('../repository', () => ({
  messageRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    findUnread: vi.fn(),
    findAllOrdered: vi.fn(),
    addReply: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    delete: vi.fn(),
  },
}));

// Turnstile mock
vi.mock('../turnstile', () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

describe('MessagingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitContactForm', () => {
    const validInput = {
      name: 'John',
      email: 'john@example.com',
      subject: 'Hello',
      message: 'This is a test message that is long enough',
      turnstileToken: 'token-123',
    };

    it('geçerli input ve Turnstile başarılı ise mesaj oluşturur', async () => {
      vi.mocked(messageRepository.create).mockResolvedValue({
        id: '1',
        ...validInput,
        replies: [],
        isRead: false,
        timestamp: new Date(),
      } as any);

      const result = await messagingService.submitContactForm(validInput);
      expect(result).toBeTruthy();
      expect(messageRepository.create).toHaveBeenCalled();
    });

    it('geçersiz email Zod hatası fırlatır', async () => {
      await expect(
        messagingService.submitContactForm({
          name: 'J',
          email: 'not-an-email',
          subject: 'x',
          message: 'x'.repeat(20),
          turnstileToken: 't',
        })
      ).rejects.toThrow();
      expect(messageRepository.create).not.toHaveBeenCalled();
    });

    it('çok kısa mesaj Zod hatası fırlatır', async () => {
      await expect(
        messagingService.submitContactForm({
          name: 'John',
          email: 'john@example.com',
          subject: 'Hi',
          message: 'short',
          turnstileToken: 't',
        })
      ).rejects.toThrow();
    });
  });

  describe('listMessages', () => {
    it('filter=undefined olduğunda tüm mesajları döner', async () => {
      vi.mocked(messageRepository.findAllOrdered).mockResolvedValue([]);
      await messagingService.listMessages();
      expect(messageRepository.findAllOrdered).toHaveBeenCalled();
    });

    it('filter="unread" olduğunda findUnread çağrılır', async () => {
      vi.mocked(messageRepository.findUnread).mockResolvedValue([]);
      await messagingService.listMessages('unread');
      expect(messageRepository.findUnread).toHaveBeenCalled();
    });
  });

  describe('replyToMessage', () => {
    it('validasyon ve repository.addReply çağrısı', async () => {
      vi.mocked(messageRepository.addReply).mockResolvedValue({} as any);
      await messagingService.replyToMessage('1', { message: 'Yanıtım', sentBy: 'Admin' });
      expect(messageRepository.addReply).toHaveBeenCalledWith('1', {
        message: 'Yanıtım',
        sentBy: 'Admin',
      });
    });

    it('boş mesaj Zod hatası fırlatır', async () => {
      await expect(
        messagingService.replyToMessage('1', { message: '', sentBy: 'Admin' })
      ).rejects.toThrow();
    });
  });

  describe('markRead', () => {
    it('repository.markAsRead çağrılır', async () => {
      vi.mocked(messageRepository.markAsRead).mockResolvedValue({} as any);
      await messagingService.markRead('msg-1');
      expect(messageRepository.markAsRead).toHaveBeenCalledWith('msg-1');
    });
  });
});