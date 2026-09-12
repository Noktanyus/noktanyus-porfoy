/**
 * Workspace Invitation Token Tests
 *
 * Validates that invitation tokens are generated using a cryptographically
 * secure source — long enough to prevent brute-force on the token space.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaceInvitation: {
      create: vi.fn(async ({ data }) => ({
        id: 'inv_1',
        ...data,
        status: 'PENDING',
        acceptedAt: null,
        createdAt: new Date(),
      })),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      create: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => cb({})),
  },
}));

import { prisma } from '@/lib/prisma';
import { workspaceRepository } from '../workspaceRepository';

describe('workspaceRepository.createInvitation — token security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits an inv_ prefixed token', async () => {
    await workspaceRepository.createInvitation({
      workspaceId: 'ws1',
      email: 'guest@example.com',
      role: 'MEMBER' as any,
      invitedBy: 'owner-1',
    });

    const createCall = vi.mocked(prisma.workspaceInvitation.create).mock.calls[0][0];
    expect(createCall.data.token).toMatch(/^inv_/);
  });

  it('token length is large enough to resist brute force (>=32 random chars)', async () => {
    await workspaceRepository.createInvitation({
      workspaceId: 'ws1',
      email: 'guest@example.com',
      role: 'MEMBER' as any,
      invitedBy: 'owner-1',
    });

    const createCall = vi.mocked(prisma.workspaceInvitation.create).mock.calls[0][0];
    const randomPart = createCall.data.token.replace(/^inv_/, '');
    // 36-base (Math.random) gives at most ~6 chars per 20-bit pull (10 chars total).
    // crypto.randomBytes(24).toString('hex') gives 48 hex chars — far stronger.
    expect(randomPart.length).toBeGreaterThanOrEqual(32);
  });

  it('two invitations produce different tokens (entropy)', async () => {
    const captured: string[] = [];
    vi.mocked(prisma.workspaceInvitation.create).mockImplementation(
      (async ({ data }: any) => {
        captured.push(data.token);
        return { id: captured.length.toString(), ...data } as any;
      }) as any
    );

    await Promise.all([
      workspaceRepository.createInvitation({
        workspaceId: 'ws1',
        email: 'a@example.com',
        role: 'MEMBER' as any,
        invitedBy: 'owner-1',
      }),
      workspaceRepository.createInvitation({
        workspaceId: 'ws1',
        email: 'b@example.com',
        role: 'MEMBER' as any,
        invitedBy: 'owner-1',
      }),
    ]);

    expect(captured.length).toBe(2);
    expect(captured[0]).not.toBe(captured[1]);
  });
});