/**
 * API key IP allowlist — exact IPv4/IPv6 veya /8–/32 CIDR.
 * Boş liste = kısıt yok.
 */

export function normalizeClientIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim() ?? '';
  if (!first) return null;
  // IPv4-mapped IPv6
  if (first.startsWith('::ffff:')) return first.slice(7);
  return first;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

function matchCidrV4(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  if (!base || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const ipN = ipv4ToInt(ip);
  const baseN = ipv4ToInt(base);
  if (ipN == null || baseN == null) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0;
  return (ipN & mask) === (baseN & mask);
}

/** entry: "1.2.3.4" | "10.0.0.0/8" | IPv6 exact */
export function ipAllowed(clientIp: string | null, allowlist: string[]): boolean {
  if (!allowlist.length) return true;
  if (!clientIp) return false;
  const ip = clientIp.trim().toLowerCase();
  for (const raw of allowlist) {
    const entry = raw.trim().toLowerCase();
    if (!entry) continue;
    if (entry.includes('/')) {
      if (ip.includes('.') && matchCidrV4(ip, entry)) return true;
      continue;
    }
    if (entry === ip) return true;
  }
  return false;
}

export function parseAllowlistInput(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}
