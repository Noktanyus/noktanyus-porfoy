/**
 * Chat service temel fonksiyon export testi.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    chatConversation: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    chatMessage: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ChatService', () => {
  it('exposes core service methods', async () => {
    const { chatService } = await import('../service');
    expect(typeof chatService.createConversation).toBe('function');
    expect(typeof chatService.sendMessage).toBe('function');
    expect(typeof chatService.listForUser).toBe('function');
    expect(typeof chatService.listForAdmin).toBe('function');
    expect(typeof chatService.getMessages).toBe('function');
    expect(typeof chatService.markRead).toBe('function');
    expect(typeof chatService.close).toBe('function');
    expect(typeof chatService.reopen).toBe('function');
    expect(typeof chatService.assignTo).toBe('function');
  });

  it('exports repository singletons', async () => {
    const repo = await import('../repository');
    expect(repo.chatRepository).toBeDefined();
    expect(repo.chatMessageRepository).toBeDefined();
  });

  it('exports schemas', async () => {
    const schemas = await import('../schemas');
    expect(schemas.CreateConversationSchema).toBeDefined();
    expect(schemas.SendMessageSchema).toBeDefined();
  });
});
