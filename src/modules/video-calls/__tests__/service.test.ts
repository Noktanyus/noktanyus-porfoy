/**
 * VideoCallService Tests
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    videoCall: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    videoCallParticipant: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { videoCallService } from '../service';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';

describe('VideoCallService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('export shape', () => {
    it('exposes core functions', () => {
      expect(typeof videoCallService.create).toBe('function');
      expect(typeof videoCallService.getByRoomCode).toBe('function');
      expect(typeof videoCallService.joinRoom).toBe('function');
      expect(typeof videoCallService.leaveRoom).toBe('function');
      expect(typeof videoCallService.endCall).toBe('function');
      expect(typeof videoCallService.listMyCalls).toBe('function');
      expect(typeof videoCallService.assertHostHasCredits).toBe('function');
    });
  });

  describe('create', () => {
    it('creates a video call with unique roomCode and active status when no schedule', async () => {
      const mockCall = {
        id: 'call_1',
        hostId: 'user_1',
        title: 'Demo Call',
        status: 'active',
        roomCode: 'abc123',
      };
      (prisma.videoCall.create as any).mockResolvedValue(mockCall);

      const result = await videoCallService.create('user_1', {
        title: 'Demo Call',
        durationMin: 60,
        maxParticipants: 10,
      });

      expect(result).toEqual(mockCall);
      expect(prisma.videoCall.create).toHaveBeenCalled();
      const arg = (prisma.videoCall.create as any).mock.calls[0][0];
      expect(arg.data.roomCode).toMatch(/^[a-f0-9]{16}$/);
      expect(arg.data.status).toBe('active');
    });

    it('uses status=scheduled when scheduledAt is provided', async () => {
      (prisma.videoCall.create as any).mockResolvedValue({ id: 'c1' });
      await videoCallService.create('user_1', {
        title: 'Scheduled',
        scheduledAt: new Date(),
        durationMin: 60,
        maxParticipants: 10,
      });
      const arg = (prisma.videoCall.create as any).mock.calls[0][0];
      expect(arg.data.status).toBe('scheduled');
    });
  });

  describe('joinRoom', () => {
    it('throws NotFoundError when call missing', async () => {
      (prisma.videoCall.findUnique as any).mockResolvedValue(null);
      await expect(
        videoCallService.joinRoom('nope', null, 'Guest')
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws when call ended', async () => {
      (prisma.videoCall.findUnique as any).mockResolvedValue({
        id: 'c1',
        status: 'ended',
        maxParticipants: 10,
      });
      await expect(
        videoCallService.joinRoom('abc', null, 'Guest')
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('throws when capacity full', async () => {
      (prisma.videoCall.findUnique as any).mockResolvedValue({
        id: 'c1',
        status: 'active',
        maxParticipants: 2,
      });
      (prisma.videoCallParticipant.count as any).mockResolvedValue(2);
      await expect(
        videoCallService.joinRoom('abc', null, 'Guest')
      ).rejects.toThrow('kapasitesi dolu');
    });

    it('creates participant for authenticated user', async () => {
      (prisma.videoCall.findUnique as any).mockResolvedValue({
        id: 'c1',
        status: 'active',
        maxParticipants: 10,
      });
      (prisma.videoCallParticipant.count as any).mockResolvedValue(0);
      (prisma.videoCallParticipant.create as any).mockResolvedValue({
        id: 'p1',
        callId: 'c1',
        userId: 'user_1',
      });

      await videoCallService.joinRoom('abc', 'user_1');

      const arg = (prisma.videoCallParticipant.create as any).mock.calls[0][0];
      expect(arg.data.userId).toBe('user_1');
      expect(arg.data.guestName).toBeUndefined();
    });

    it('creates guest participant when no userId', async () => {
      (prisma.videoCall.findUnique as any).mockResolvedValue({
        id: 'c1',
        status: 'active',
        maxParticipants: 10,
      });
      (prisma.videoCallParticipant.count as any).mockResolvedValue(0);
      (prisma.videoCallParticipant.create as any).mockResolvedValue({
        id: 'p1',
        guestName: 'Guest',
      });

      await videoCallService.joinRoom('abc', null, 'Guest', 'guest@mail.com');

      const arg = (prisma.videoCallParticipant.create as any).mock.calls[0][0];
      expect(arg.data.userId).toBeUndefined();
      expect(arg.data.guestName).toBe('Guest');
      expect(arg.data.guestEmail).toBe('guest@mail.com');
    });
  });

  describe('endCall', () => {
    it('only host can end', async () => {
      (prisma.videoCall.findUnique as any).mockResolvedValue({
        id: 'c1',
        hostId: 'user_other',
      });
      await expect(
        videoCallService.endCall('abc', 'user_1')
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('marks call ended and closes active participants', async () => {
      (prisma.videoCall.findUnique as any).mockResolvedValue({
        id: 'c1',
        hostId: 'user_1',
      });
      (prisma.videoCallParticipant.updateMany as any).mockResolvedValue({ count: 2 });
      (prisma.videoCall.update as any).mockResolvedValue({ id: 'c1', status: 'ended' });

      await videoCallService.endCall('abc', 'user_1');

      expect(prisma.videoCallParticipant.updateMany).toHaveBeenCalled();
      expect(prisma.videoCall.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'ended' },
        })
      );
    });
  });

  describe('assertHostHasCredits', () => {
    it('throws when host has insufficient credits', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ videoCallCredits: 5 });
      await expect(
        videoCallService.assertHostHasCredits('user_1', 60)
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('passes when host has enough credits', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ videoCallCredits: 120 });
      await expect(
        videoCallService.assertHostHasCredits('user_1', 60)
      ).resolves.toBeUndefined();
    });
  });
});