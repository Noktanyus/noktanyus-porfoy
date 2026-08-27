/**
 * @file Workspace Service — Business logic katmanı.
 * @description Repository'yi sarmalayan business operasyonları:
 *
 *   - Workspace oluşturma (otomatik owner member olarak eklenir)
 *   - Üye davet etme (email gönderimi ile)
 *   - Davet kabul etme (transactional)
 *   - Üye çıkarma
 *
 *   Repository doğrudan expose edilmez — API katmanı sadece service'i kullanır.
 */

import { workspaceRepository } from './workspaceRepository';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import type { WorkspaceRole } from '@prisma/client';
import { ConflictError } from '@/modules/shared/errors';

export const workspaceService = {
  /**
   * Yeni workspace oluşturur ve sahibini otomatik OWNER olarak ekler.
   * Slug çakışması durumunda ConflictError fırlatır.
   */
  async createWorkspace(data: {
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    ownerEmail: string;
    ownerName?: string;
  }) {
    const existing = await workspaceRepository.findBySlug(data.slug);
    if (existing) throw new ConflictError('Bu slug zaten kullanımda');

    const ws = await workspaceRepository.create({
      slug: data.slug,
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
    });

    // Owner her zaman member tablosunda da görünür
    await workspaceRepository.addMember(ws.id, {
      userId: data.ownerId,
      userEmail: data.ownerEmail,
      userName: data.ownerName,
      role: 'OWNER',
    });

    return ws;
  },

  /**
   * Workspace'e email ile üye davet eder.
   * Davet token'ı üretilir, davet email'i gönderilir.
   * Email gönderimi başarısız olursa loglanır ama akış devam eder
   * (davet kaydı DB'de var, kullanıcı link'i alabilir).
   */
  async inviteMember(data: {
    workspaceId: string;
    email: string;
    role: WorkspaceRole;
    invitedBy: string;
    workspaceName: string;
  }) {
    const invitation = await workspaceRepository.createInvitation({
      workspaceId: data.workspaceId,
      email: data.email,
      role: data.role,
      invitedBy: data.invitedBy,
    });

    // Email gönderimi hata toleranslı — DB kaydı oluştu, link paylaşılabilir
    try {
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
      await sendEmail({
        to: data.email,
        subject: `${data.workspaceName} daveti`,
        html: `
          <h2>Merhaba,</h2>
          <p>${data.workspaceName} workspace'ine <strong>${data.role}</strong> olarak davet edildiniz.</p>
          <p><a href="${baseUrl}/workspace/invite/accept?token=${invitation.token}" style="display:inline-block;padding:12px 24px;background:#0078D4;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Daveti Kabul Et</a></p>
          <p>Veya bu token'ı kullanın: <code>${invitation.token}</code></p>
          <p style="color:#6b7280;font-size:14px;">Bu davet 7 gün içinde geçerlidir.</p>
        `,
      });
    } catch (err) {
      logger.error('Failed to send workspace invitation', { error: err });
    }

    return invitation;
  },

  async acceptInvitation(token: string, userId: string) {
    return workspaceRepository.acceptInvitation(token, userId);
  },

  async removeMember(memberId: string) {
    return workspaceRepository.removeMember(memberId);
  },

  async listForUser(userId: string) {
    return workspaceRepository.listForUser(userId);
  },
};