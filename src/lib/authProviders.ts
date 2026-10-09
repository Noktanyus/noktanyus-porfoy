/**
 * Hangi OAuth sağlayıcılarının env ile gerçekten etkin olduğunu bildirir.
 * UI’da yapılandırılmamış buton göstermemek için kullanılır.
 */

export type SocialProviderId = 'google' | 'github';

export function getEnabledSocialProviders(): SocialProviderId[] {
  const list: SocialProviderId[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    list.push('google');
  }
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    list.push('github');
  }
  return list;
}

export function isGoogleAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
