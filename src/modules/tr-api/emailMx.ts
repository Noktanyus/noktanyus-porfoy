import { resolveMx } from 'node:dns/promises';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/** Format + MX kaydı (SMTP handshake yok) - Server only */
export async function validateEmailMx(raw: string): Promise<{
  valid: boolean;
  normalized: string;
  domain?: string;
  hasMx?: boolean;
  mxHosts?: string[];
  reason?: string;
}> {
  const normalized = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    return { valid: false, normalized, reason: 'E-posta formatı geçersiz' };
  }
  const domain = normalized.split('@')[1]!;
  try {
    const records = await resolveMx(domain);
    if (!records.length) {
      return { valid: false, normalized, domain, hasMx: false, reason: 'MX kaydı yok' };
    }
    const mxHosts = records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange);
    return { valid: true, normalized, domain, hasMx: true, mxHosts };
  } catch {
    return { valid: false, normalized, domain, hasMx: false, reason: 'DNS / MX sorgu başarısız' };
  }
}
