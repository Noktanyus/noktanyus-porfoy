import { describe, it, expect, vi } from 'vitest';

// Prisma mock (import side effect'lerini önlemek için)
vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

// next-auth server-side mock
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
  default: vi.fn(() => ({})),
}));

// sharp mock — gerçek sharp binary test ortamında sorun çıkarabilir
vi.mock('sharp', () => {
  const sharpMock = vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized')),
  }));
  return { default: sharpMock };
});

describe('Upload API', () => {
  it('exports POST handler', async () => {
    const route = await import('../route');
    expect(typeof route.POST).toBe('function');
  });

  it('exports runtime nodejs for buffer support', async () => {
    const route = await import('../route');
    expect(route.runtime).toBe('nodejs');
  });

  it('exports dynamic = force-dynamic', async () => {
    const route = await import('../route');
    expect(route.dynamic).toBe('force-dynamic');
  });
});
