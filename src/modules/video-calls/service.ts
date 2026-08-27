/**
 * Video Calls Module — Service Layer
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 * Host tabanli video call odalari. Peer connection icin signaling server
 * gerekir; bu service DB tarafini yonetir (room/participant lifecycle).
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError } from '@/modules/shared/errors';
import type { CreateVideoCallInput } from './schemas';

const MIN_CREDIT_BALANCE_MIN = 1;

export const videoCallService = {
  /**
   * Yeni video call odasi olusturur. Unique roomCode uretir.
   * scheduledAt verilmisse status="scheduled", aksi halde "active".
   */
  async create(hostId: string, input: CreateVideoCallInput) {
    const roomCode = crypto.randomBytes(8).toString('hex');

    const call = await prisma.videoCall.create({
      data: {
        hostId,
        title: input.title,
        description: input.description,
        scheduledAt: input.scheduledAt,
        durationMin: input.durationMin,
        maxParticipants: input.maxParticipants,
        productId: input.productId,
        orderId: input.orderId,
        roomCode,
        status: input.scheduledAt ? 'scheduled' : 'active',
      },
    });

    logger.info('Video call created', { callId: call.id, hostId, roomCode });

    return call;
  },

  /**
   * roomCode ile video call getirir (host + participants ile birlikte).
   */
  async getByRoomCode(roomCode: string) {
    const call = await prisma.videoCall.findUnique({
      where: { roomCode },
      include: {
        host: { select: { id: true, name: true, email: true, image: true } },
        participants: true,
      },
    });
    return call;
  },

  /**
   * Odaya katilim. Authenticated user ise userId ile, degilse guest olarak kayit olusturur.
   * Ayni kullanici ayni odaya birden fazla participant kaydi olusturabilir
   * (yeniden katilim senaryosu).
   */
  async joinRoom(
    roomCode: string,
    userId: string | null,
    guestName?: string,
    guestEmail?: string
  ) {
    const call = await prisma.videoCall.findUnique({ where: { roomCode } });
    if (!call) throw new NotFoundError('Toplantı');
    if (call.status === 'ended') throw new ValidationError('Toplantı sona erdi');
    if (call.status === 'cancelled') throw new ValidationError('Toplantı iptal edildi');

    // Kapasite kontrolu (aktif participant sayisi ile)
    const activeParticipants = await prisma.videoCallParticipant.count({
      where: { callId: call.id, leftAt: null },
    });
    if (activeParticipants >= call.maxParticipants) {
      throw new ValidationError('Toplantı kapasitesi dolu');
    }

    const participant = await prisma.videoCallParticipant.create({
      data: {
        callId: call.id,
        userId: userId ?? undefined,
        guestName: userId ? undefined : guestName,
        guestEmail: userId ? undefined : guestEmail,
        joinedAt: new Date(),
      },
    });

    logger.info('Participant joined video call', {
      callId: call.id,
      participantId: participant.id,
      userId,
    });

    return { call, participant };
  },

  /**
   * Katilimci odadan ayrildiginda leftAt guncellenir, duration hesaplanir.
   */
  async leaveRoom(participantId: string) {
    const participant = await prisma.videoCallParticipant.findUnique({
      where: { id: participantId },
    });
    if (!participant) throw new NotFoundError('Katılımcı');
    if (participant.leftAt) return participant; // Already left - idempotent

    const leftAt = new Date();
    const joinedAt = participant.joinedAt ?? leftAt;
    const durationSec = Math.max(0, Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000));

    return prisma.videoCallParticipant.update({
      where: { id: participantId },
      data: { leftAt, durationSec },
    });
  },

  /**
   * Toplantiyi sonlandirir (sadece host).
   */
  async endCall(roomCode: string, hostId: string) {
    const call = await prisma.videoCall.findUnique({ where: { roomCode } });
    if (!call) throw new NotFoundError('Toplantı');
    if (call.hostId !== hostId) {
      throw new ValidationError('Sadece toplantı sahibi sonlandırabilir');
    }

    // Tum aktif participantlari leftAt ile isaretle
    const now = new Date();
    await prisma.videoCallParticipant.updateMany({
      where: { callId: call.id, leftAt: null },
      data: { leftAt: now },
    });

    return prisma.videoCall.update({
      where: { id: call.id },
      data: { status: 'ended' },
    });
  },

  /**
   * Kullanicinin host ettigi veya katildigi toplantilari listeler.
   */
  async listMyCalls(userId: string) {
    return prisma.videoCall.findMany({
      where: {
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: true,
      },
    });
  },

  /**
   * Host'un kalan video call dakikasi (credit).
   */
  async getRemainingCredits(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { videoCallCredits: true },
    });
    return user?.videoCallCredits ?? 0;
  },

  /**
   * Toplanti basina minimum dakika kontrolu.
   * Host'un yeterli credit'i yoksa hata firlatir.
   */
  async assertHostHasCredits(hostId: string, requiredMin = MIN_CREDIT_BALANCE_MIN) {
    const remaining = await this.getRemainingCredits(hostId);
    if (remaining < requiredMin) {
      throw new ValidationError(
        `Yetersiz video call kredisi. Mevcut: ${remaining} dakika, gerekli: ${requiredMin} dakika`
      );
    }
  },
};