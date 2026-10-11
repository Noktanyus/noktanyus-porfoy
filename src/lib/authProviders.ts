/**
 * Hangi OAuth sağlayıcılarının env ile gerçekten etkin olduğunu bildirir.
 * UI’da yapılandırılmamış buton göstermemek için kullanılır.
 */

export type SocialProviderId = 'google' | 'github';

export function getEnabledSocialProviders(): SocialProviderId[] {
  // Google, platformun birincil sosyal kimlik sağlayıcısı olarak her zaman etkindir.
  const list: SocialProviderId[] = ['google'];
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    list.push('github');
  }
  return list;
}

export function isGoogleAuthEnabled(): boolean {
  return true;
}

export function isGoogleConfigured(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(
    id &&
    secret &&
    !id.includes('placeholder') &&
    !id.includes('demo')
  );
}
