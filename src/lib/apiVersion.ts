/**
 * API versiyon sözleşmesi + deprecation metadata (Stripe/HubSpot tarzı).
 */

export const API_VERSION = '2026-10-09';

/** Path prefix → sunset ISO date (opsiyonel). */
const DEPRECATED_PREFIXES: Array<{ prefix: string; sunset?: string; successor?: string }> = [
  // Örnek rezerv: eski AI uçları kaldırıldıktan sonra burada tutulur
];

export function matchDeprecation(pathname: string): {
  deprecated: boolean;
  sunset?: string;
  successor?: string;
} {
  for (const d of DEPRECATED_PREFIXES) {
    if (pathname === d.prefix || pathname.startsWith(d.prefix + '/')) {
      return { deprecated: true, sunset: d.sunset, successor: d.successor };
    }
  }
  return { deprecated: false };
}

/** NextResponse headers üzerine versiyon / deprecation bas. */
export function applyApiVersionHeaders(
  headers: Headers,
  pathname: string
): void {
  headers.set('X-API-Version', API_VERSION);
  headers.set('API-Version', API_VERSION);
  const dep = matchDeprecation(pathname);
  if (dep.deprecated) {
    headers.set('Deprecation', 'true');
    if (dep.sunset) headers.set('Sunset', dep.sunset);
    if (dep.successor) {
      headers.set('Link', `<${dep.successor}>; rel="successor-version"`);
    }
  }
}
