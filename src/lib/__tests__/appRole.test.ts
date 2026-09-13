import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_ADMIN_ID,
  isSyntheticAdminId,
  normalizeAppRole,
  isAppAdminRole,
  shouldRedirectSyntheticAdminFromDashboard,
  postLoginRedirect,
} from '../appRole';

describe('appRole', () => {
  it('tanır sentetik env-admin id', () => {
    expect(isSyntheticAdminId(SYNTHETIC_ADMIN_ID)).toBe(true);
    expect(isSyntheticAdminId('clxyz')).toBe(false);
    expect(isSyntheticAdminId(undefined)).toBe(false);
  });

  it('normalizeAppRole yalnızca admin stringini admin yapar', () => {
    expect(normalizeAppRole('admin')).toBe('admin');
    expect(normalizeAppRole('user')).toBe('user');
    expect(normalizeAppRole('ADMIN')).toBe('user');
    expect(normalizeAppRole(null)).toBe('user');
  });

  it('isAppAdminRole', () => {
    expect(isAppAdminRole('admin')).toBe(true);
    expect(isAppAdminRole('user')).toBe(false);
  });

  it('yalnızca sentetik admin dashboard dışına yönlenir', () => {
    expect(shouldRedirectSyntheticAdminFromDashboard('admin')).toBe(true);
    expect(shouldRedirectSyntheticAdminFromDashboard('user-cuid')).toBe(false);
  });

  it('postLoginRedirect env-admini yönetim paneline, hesabı callbacka yollar', () => {
    expect(postLoginRedirect('admin', '/dashboard')).toBe('/admin/dashboard');
    expect(postLoginRedirect('user-cuid', '/dashboard')).toBe('/dashboard');
    expect(postLoginRedirect('user-cuid', '/magaza')).toBe('/magaza');
  });
});
