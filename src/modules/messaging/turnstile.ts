/**
 * Turnstile Verification
 *
 * Cloudflare Turnstile token doğrulaması.
 * Test ortamında secret yoksa veya "XXXX" token gelirse başarılı kabul eder.
 */

import { env } from '@/lib/env';

export async function verifyTurnstile(token: string): Promise<boolean> {
  try {
    const secretKey = env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.warn('[Turnstile] Secret key tanımlı değil — bypass aktif');
      return true;
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: secretKey, response: token }),
      }
    );

    const data = await response.json();
    return data?.success === true;
  } catch (error) {
    console.error('[Turnstile] doğrulama hatası:', error);
    return false;
  }
}