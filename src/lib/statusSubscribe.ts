/**
 * Public status / incident e-posta aboneliği — saf yardımcılar.
 * Newsletter altyapısını `incidents` kategorisi + `durum` kaynağı ile yeniden kullanır.
 */

export const STATUS_INCIDENT_CATEGORY = 'incidents' as const;
export const STATUS_SUBSCRIBE_SOURCE = 'durum' as const;

export type StatusVerifyCopy = {
  subject: string;
  heading: string;
  intro: string;
  cta: string;
};

/** Abonelik payload'ında incident/status niyeti var mı? */
export function isStatusIncidentSubscribe(input: {
  source?: string | null;
  categories?: string[] | null;
}): boolean {
  const source = (input.source ?? '').trim().toLowerCase();
  if (source === STATUS_SUBSCRIBE_SOURCE || source === 'status') return true;

  const cats = input.categories ?? [];
  return cats.some((c) => {
    const n = c.trim().toLowerCase();
    return n === STATUS_INCIDENT_CATEGORY || n === 'status' || n === 'durum';
  });
}

/** Double opt-in doğrulama e-postası metni (TR). */
export function statusVerifyEmailCopy(isIncident: boolean): StatusVerifyCopy {
  if (isIncident) {
    return {
      subject: 'Noktanyus — Kesinti bildirimi aboneliği',
      heading: 'Kesinti bildirimlerini onaylayın',
      intro:
        'Noktanyus sistem durumu (kesinti / olay) e-posta bildirimlerine abone olmak istediniz.',
      cta: 'Bildirimleri onayla',
    };
  }
  return {
    subject: 'Noktanyus Blog - Abonelik Onayı',
    heading: 'Aboneliğinizi Onaylayın',
    intro: "Noktanyus blog'una abone olduğunuz için teşekkürler!",
    cta: 'Aboneliği Onayla',
  };
}

/** README / durum sayfası gömme için hazır Markdown. */
export function statusBadgeMarkdown(baseUrl = 'https://noktanyus.com'): string {
  const origin = baseUrl.replace(/\/$/, '');
  return `[![Noktanyus status](${origin}/api/health/badge)](${origin}/durum)`;
}

/** Makine-okunur sağlık özeti uçları (SVG + JSON). */
export function publicStatusEndpoints(baseUrl = 'https://noktanyus.com'): {
  badgeSvg: string;
  healthJson: string;
  durumPage: string;
} {
  const origin = baseUrl.replace(/\/$/, '');
  return {
    badgeSvg: `${origin}/api/health/badge`,
    healthJson: `${origin}/api/health`,
    durumPage: `${origin}/durum`,
  };
}
