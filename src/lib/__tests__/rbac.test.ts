/**
 * @file RBAC (Role-Based Access Control) unit testleri.
 * @description `checkPermission`, `requirePermission`, `requireWorkspaceMember`
 *              fonksiyonlarının rol bazlı davranışlarını doğrular.
 *
 *   WorkspaceRepository mock'lanır — gerçek DB'ye dokunmadan saf logic test edilir.
 */

import { describe, it, expect, vi } from 'vitest';

// WorkspaceRepository'yi mockla — gerçek DB bağlantısı kurmamak için
vi.mock('@/modules/admin/workspaceRepository', () => ({
  workspaceRepository: {
    isMember: vi.fn(),
  },
}));

import { workspaceRepository } from '@/modules/admin/workspaceRepository';
import { checkPermission, requirePermission, requireWorkspaceMember } from '../rbac';

describe('RBAC', () => {
  it('OWNER has all permissions', async () => {
    vi.mocked(workspaceRepository.isMember).mockResolvedValue('OWNER');
    expect(await checkPermission('ws1', 'user1', 'admin')).toBe(true);
    expect(await checkPermission('ws1', 'user1', 'write')).toBe(true);
    expect(await checkPermission('ws1', 'user1', 'transfer_ownership')).toBe(true);
  });

  it('ADMIN has admin/write but not transfer', async () => {
    vi.mocked(workspaceRepository.isMember).mockResolvedValue('ADMIN');
    expect(await checkPermission('ws1', 'user1', 'admin')).toBe(true);
    expect(await checkPermission('ws1', 'user1', 'write')).toBe(true);
    expect(await checkPermission('ws1', 'user1', 'transfer_ownership')).toBe(false);
  });

  it('EDITOR can read and write only', async () => {
    vi.mocked(workspaceRepository.isMember).mockResolvedValue('EDITOR');
    expect(await checkPermission('ws1', 'user1', 'read')).toBe(true);
    expect(await checkPermission('ws1', 'user1', 'write')).toBe(true);
    expect(await checkPermission('ws1', 'user1', 'delete')).toBe(false);
  });

  it('VIEWER read only', async () => {
    vi.mocked(workspaceRepository.isMember).mockResolvedValue('VIEWER');
    expect(await checkPermission('ws1', 'user1', 'read')).toBe(true);
    expect(await checkPermission('ws1', 'user1', 'write')).toBe(false);
  });

  it('non-member has no access', async () => {
    vi.mocked(workspaceRepository.isMember).mockResolvedValue(null);
    expect(await checkPermission('ws1', 'user1', 'read')).toBe(false);
  });

  it('requireWorkspaceMember returns role for member', async () => {
    vi.mocked(workspaceRepository.isMember).mockResolvedValue('EDITOR');
    const role = await requireWorkspaceMember('ws1', 'user1');
    expect(role).toBe('EDITOR');
  });

  it('requireWorkspaceMember throws for non-member', async () => {
    vi.mocked(workspaceRepository.isMember).mockResolvedValue(null);
    await expect(requireWorkspaceMember('ws1', 'user1')).rejects.toThrow();
  });

  it('requirePermission throws ForbiddenError for insufficient permission', async () => {
    vi.mocked(workspaceRepository.isMember).mockResolvedValue('VIEWER');
    await expect(requirePermission('ws1', 'user1', 'write')).rejects.toThrow();
  });
});