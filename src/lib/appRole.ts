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
  if (typeof role === 'string' && role.trim().toLowerCase() === 'admin') {
    return 'admin';
  }
  return 'user';
}

export function isAppAdminRole(role: unknown): boolean {
  return normalizeAppRole(role) === 'admin';
}

/**
 * Sentetik env-admin'in müşteri dashboard'undan zorla yönlendirilmesi iptal edildi.
 * Yönetici hem kullanıcı dashboard'unu (/dashboard) hem yönetim panelini (/admin)
 * birbirinden bağımsız şekilde kullanabilir.
 */
export function shouldRedirectSyntheticAdminFromDashboard(
  _userId: string | null | undefined,
): boolean {
  return false;
}

/** Giriş sonrası yönlendirme: belirtilen callbackUrl'e yönlendirir. */
export function postLoginRedirect(
  _userId: string | null | undefined,
  callbackUrl: string,
): string {
  return callbackUrl;
}
