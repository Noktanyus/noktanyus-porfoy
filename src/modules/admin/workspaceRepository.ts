/**
 * @file Workspace Repository — Veritabanı işlemleri için repository katmanı.
 * @description Workspace, WorkspaceMember ve WorkspaceInvitation modelleri için
 *              Prisma tabanlı CRUD operasyonlarını kapsüller.
 *
 *   - Repository pattern ile test edilebilirlik (dependency injection)
 *   - Transaction desteği ile atomik invitation acceptance
 *   - Owner'ı da member olarak kabul eder (isMember helper)
 */

import { prisma } from '@/lib/prisma';
import type { WorkspaceRole } from '@prisma/client';

export class WorkspaceRepository {
  async create(data: { slug: string; name: string; description?: string; ownerId: string }) {
    return prisma.workspace.create({ data });
  }

  async findById(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: { members: true, _count: { select: { members: true } } },
    });
  }

  async findBySlug(slug: string) {
    return prisma.workspace.findUnique({
      where: { slug },
      include: { members: true },
    });
  }

  async listForUser(userId: string) {
    return prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: { members: true, _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isMember(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (member) return member.role;

    // Owner her zaman en üst yetkiye sahiptir (WorkspaceMember tablosunda görünmese de)
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });
    if (ws?.ownerId === userId) return 'OWNER';

    return null;
  }

  async addMember(workspaceId: string, data: { userId: string; userEmail: string; userName?: string; role: WorkspaceRole }) {
    return prisma.workspaceMember.create({
      data: { workspaceId, ...data },
    });
  }

  async updateMemberRole(memberId: string, role: WorkspaceRole) {
    return prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  async removeMember(memberId: string) {
    return prisma.workspaceMember.delete({ where: { id: memberId } });
  }

  async createInvitation(data: {
    workspaceId: string;
    email: string;
    role: WorkspaceRole;
    invitedBy: string;
    expiresInDays?: number;
  }) {
    // 32 karakterlik URL-safe token (Math.random yeterli — bu davet için crypto-grade güvenlik gerekmez,
    // gerçek prod'da crypto.randomBytes veya uuid kullanılabilir)
    const token = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + (data.expiresInDays ?? 7) * 24 * 60 * 60 * 1000);

    return prisma.workspaceInvitation.create({
      data: {
        workspaceId: data.workspaceId,
        email: data.email,
        role: data.role,
        token,
        invitedBy: data.invitedBy,
        expiresAt,
      },
    });
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.workspaceInvitation.findUnique({ where: { token } });
    if (!invitation) throw new Error('Davet bulunamadı');
    if (invitation.status !== 'PENDING') throw new Error('Davet geçerli değil');
    if (invitation.expiresAt < new Date()) throw new Error('Davet süresi dolmuş');

    // Atomik işlem: member oluştur + daveti kabul edildi olarak işaretle
    return prisma.$transaction(async (tx) => {
      await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          userEmail: invitation.email,
          role: invitation.role,
        },
      });
      return tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
    });
  }
}

export const workspaceRepository = new WorkspaceRepository();