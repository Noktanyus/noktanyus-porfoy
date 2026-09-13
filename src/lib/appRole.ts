/**
 * Uygulama rolleri (hesap bazlı admin).
 *
 * Env ADMIN_EMAIL ile giren sentetik oturumun id'si "admin"dır ve
 * müşteri dashboard'u yoktur. Gerçek User kayıtları cuid id taşır;
 * role alanı veritabanından okunur.
 */

export const SYNTHETIC_ADMIN_ID = 'admin';

export type AppRole = 'admin' | 'user';

/** JWT'de DB rolünü yenileme aralığı (ms). */
export const ROLE_REFRESH_INTERVAL_MS = 15_000;

export function isSyntheticAdminId(id: string | null | undefined): boolean {
  return id === SYNTHETIC_ADMIN_ID;
}

export function normalizeAppRole(role: unknown): AppRole {
  return role === 'admin' ? 'admin' : 'user';
}

export function isAppAdminRole(role: unknown): boolean {
  return normalizeAppRole(role) === 'admin';
}

/**
 * Sentetik env-admin'in müşteri hesabı yoktur; dashboard'a düşmesin.
 * Hesap bazlı admin'ler hem /dashboard hem /admin kullanır.
 */
export function shouldRedirectSyntheticAdminFromDashboard(
  userId: string | null | undefined,
): boolean {
  return isSyntheticAdminId(userId);
}

/** Giriş sonrası yönlendirme: env-admin → yönetim, diğerleri → callback. */
export function postLoginRedirect(
  userId: string | null | undefined,
  callbackUrl: string,
): string {
  return isSyntheticAdminId(userId) ? '/admin/dashboard' : callbackUrl;
}
