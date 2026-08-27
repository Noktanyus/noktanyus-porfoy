/**
 * @file RBAC (Role-Based Access Control) — Rol bazlı yetkilendirme helper'ları.
 * @description Workspace üyelerinin sahip olduğu rolleri ve bunların izinlerini tanımlar.
 *
 *   Permission setleri:
 *     OWNER   → Tüm izinler (admin, read, write, delete, invite, remove, transfer_ownership)
 *     ADMIN   → admin, read, write, delete, invite, remove
 *     EDITOR  → read, write
 *     VIEWER  → read
 *
 *   requirePermission / requireWorkspaceMember aksi başarısız olursa
 *   AppError (ForbiddenError / UnauthorizedError) fırlatır — API katmanında
 *   bu hatalar 401/403'e map'lenir.
 */

import type { WorkspaceRole } from '@prisma/client';
import { workspaceRepository } from '@/modules/admin/workspaceRepository';
import { ForbiddenError, UnauthorizedError } from '@/modules/shared/errors';

export const RolePermissions: Record<WorkspaceRole, string[]> = {
  OWNER: ['admin', 'read', 'write', 'delete', 'invite', 'remove', 'transfer_ownership'],
  ADMIN: ['admin', 'read', 'write', 'delete', 'invite', 'remove'],
  EDITOR: ['read', 'write'],
  VIEWER: ['read'],
};

export type Permission =
  | 'admin'
  | 'read'
  | 'write'
  | 'delete'
  | 'invite'
  | 'remove'
  | 'transfer_ownership';

/**
 * Kullanıcının workspace'te belirli bir izne sahip olup olmadığını kontrol eder.
 * Hata fırlatmaz, sadece boolean döner.
 */
export async function checkPermission(
  workspaceId: string,
  userId: string,
  requiredPermission: Permission
): Promise<boolean> {
  const role = await workspaceRepository.isMember(workspaceId, userId);
  if (!role) return false;
  return RolePermissions[role].includes(requiredPermission);
}

/**
 * Kullanıcının belirli bir izne sahip olmasını ZORUNLU kılar.
 * İzin yoksa ForbiddenError fırlatır.
 */
export async function requirePermission(
  workspaceId: string,
  userId: string,
  permission: Permission
): Promise<void> {
  const hasPermission = await checkPermission(workspaceId, userId, permission);
  if (!hasPermission) {
    throw new ForbiddenError(`Bu işlem için ${permission} yetkisi gerekli`);
  }
}

/**
 * Kullanıcının workspace üyesi olmasını ZORUNLU kılar.
 * Üye değilse UnauthorizedError fırlatır ve rolü döner.
 */
export async function requireWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole> {
  const role = await workspaceRepository.isMember(workspaceId, userId);
  if (!role) {
    throw new UnauthorizedError("Bu workspace'e erişim yetkiniz yok");
  }
  return role;
}