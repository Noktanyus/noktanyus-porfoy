/**
 * @file TOTP tabanli 2FA (iki faktorlu kimlik dogrulama) yardimci modulu.
 * @description
 *   - Secret uretimi ve dogrulamasi (otpauth / RFC 6238)
 *   - QR kod olusturma (qrcode)
 *   - Backup kodlari (sha256 hash'li, tek kullanimlik)
 *
 *   Tum fonksiyonlar saf (pure) ve yan etkisizdir. Veritabani
 *   islemleri route katmaninda yapilir.
 */

import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";

const ISSUER = "Noktanyus";
const PERIOD = 30; // saniye
const DIGITS = 6;
const ALGORITHM = "SHA1";
const WINDOW = 1; // +/-1 step (toplam 90s tolerans)

/**
 * Yeni bir TOTP secret'i uretir (base32, 20 byte / 32 karakter).
 */
export function generateSecret(): string {
  return new Secret({ size: 20 }).base32;
}

/**
 * Verilen kullanici email + secret icin otpauth:// URI olusturur
 * ve bunu PNG data URL (base64) olarak QR koduna cevirir.
 * Authenticator uygulamalari (Google Authenticator, Authy, 1Password)
 * bu QR kodu okutarak hesabi ekler.
 */
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const totp = new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
  });
  // Secret'i set et (URI olusturmadan once)
  totp.secret = Secret.fromBase32(secret);
  const otpauth = totp.toString();
  return QRCode.toDataURL(otpauth);
}

/**
 * Kullanicinin girdigi 6 haneli token'i secret ile dogrular.
 * Hata durumunda false doner (exception firlatmaz).
 */
export function verifyToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  // Sadece 6 haneli rakamlari kabul et
  if (!/^\d{6}$/.test(token)) return false;
  try {
    const delta = TOTP.validate({
      token,
      secret: Secret.fromBase32(secret),
      algorithm: ALGORITHM,
      digits: DIGITS,
      period: PERIOD,
      window: WINDOW,
    });
    return delta !== null;
  } catch {
    return false;
  }
}

/**
 * Backup kodu uretir (orn: A1B2C3D4). Buyuk harf hex, 8 karakter.
 * Kullanici hesabi kaybetmesi durumunda bu kodlardan biri ile giris yapabilir.
 */
export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
}

/**
 * Backup kodlarini sha256 ile hash'ler. Veritabaninda sadece hash'ler
 * saklanir, plain kodlar SADECE kullaniciya gosterildikten sonra silinir.
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(
    codes.map((c) =>
      crypto.createHash("sha256").update(c.toUpperCase()).digest("hex")
    )
  );
}

/**
 * Verilen bir backup kodunun hash'lenmis backup kod listesinden
 * herhangi biriyle eslesip eslesmedigini kontrol eder.
 * Eslesen kodun indeksini doner (kullanim sonrasi listeden cikarilmak icin),
 * eslesme yoksa -1 doner.
 *
 * Not: Constant-time karsilastirma (timing attack korumasi) kullanir.
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  if (!code || !Array.isArray(hashedCodes)) return -1;
  const normalized = code.trim().toUpperCase();
  const candidate = crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex");
  for (let i = 0; i < hashedCodes.length; i++) {
    const a = Buffer.from(candidate, "hex");
    const b = Buffer.from(hashedCodes[i], "hex");
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return i;
    }
  }
  return -1;
}

/**
 * Kullanilmis bir backup kodunu hash listesinden cikarir.
 * Tek-kullanimlik semantiktir: bir kod basariyla kullanildiktan sonra
 * bir daha calismaz.
 */
export function consumeBackupCode(hashedCodes: string[], index: number): string[] {
  if (index < 0 || index >= hashedCodes.length) return hashedCodes;
  return [...hashedCodes.slice(0, index), ...hashedCodes.slice(index + 1)];
}

export const twoFactor = {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  consumeBackupCode,
};
