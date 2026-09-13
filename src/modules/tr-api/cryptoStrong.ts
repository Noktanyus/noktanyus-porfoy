/**
 * Crypto güçlendirme — EIP-55 (keccak) + BTC Base58Check (@noble/hashes)
 */

import { keccak_256 } from '@noble/hashes/sha3.js';
import { sha256 } from '@noble/hashes/sha2.js';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateEthAddressEip55(raw: string): {
  valid: boolean;
  normalized: string;
  checksummed?: string;
  reason?: string;
} {
  const normalized = raw.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(normalized)) {
    return { valid: false, normalized, reason: '0x + 40 hex beklenir' };
  }
  const addr = normalized.slice(2);
  if (addr === addr.toLowerCase() || addr === addr.toUpperCase()) {
    // no checksum claimed
    const hash = bytesToHex(keccak_256(new TextEncoder().encode(addr.toLowerCase())));
    let out = '0x';
    for (let i = 0; i < 40; i++) {
      out += parseInt(hash[i]!, 16) >= 8 ? addr[i]!.toUpperCase() : addr[i]!.toLowerCase();
    }
    return { valid: true, normalized, checksummed: out };
  }
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(addr.toLowerCase())));
  for (let i = 0; i < 40; i++) {
    const c = addr[i]!;
    if (/[a-fA-F]/.test(c)) {
      const wantUpper = parseInt(hash[i]!, 16) >= 8;
      if (wantUpper !== (c === c.toUpperCase())) {
        return { valid: false, normalized, reason: 'EIP-55 checksum uyuşmuyor' };
      }
    }
  }
  return { valid: true, normalized };
}

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Decode(str: string): Uint8Array | null {
  const bytes = [0];
  for (const ch of str) {
    const val = ALPHABET.indexOf(ch);
    if (val < 0) return null;
    let carry = val;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j]! * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const ch of str) {
    if (ch !== '1') break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

export function validateBtcBase58Check(raw: string): {
  valid: boolean;
  normalized: string;
  kind?: string;
  reason?: string;
} {
  const normalized = raw.trim();
  if (/^(bc1|tb1)[a-z0-9]{25,90}$/i.test(normalized)) {
    return { valid: true, normalized, kind: 'bech32' };
  }
  if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Geçersiz BTC adres formatı' };
  }
  const decoded = base58Decode(normalized);
  if (!decoded || decoded.length < 25) {
    return { valid: false, normalized, reason: 'Base58 decode başarısız' };
  }
  const data = decoded.slice(0, decoded.length - 4);
  const checksum = decoded.slice(decoded.length - 4);
  const hash = sha256(sha256(data));
  for (let i = 0; i < 4; i++) {
    if (hash[i] !== checksum[i]) {
      return { valid: false, normalized, reason: 'Base58Check checksum geçersiz' };
    }
  }
  return { valid: true, normalized, kind: 'base58check' };
}
