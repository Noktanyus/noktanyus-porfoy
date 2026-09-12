/**
 * @file OAuth 2.0 Service — Authorization Code + PKCE + Refresh Token Rotation
 *          (RFC 6749 + RFC 7636 + L3 refresh token rotation)
 * @description Public API OAuth akışının çekirdek iş mantığı.
 *
 *              Akış:
 *              1. Client kayıt (createClient) → clientId + clientSecret (plain, sadece 1 kez döner)
 *              2. Client → /authorize (GET) → Consent UI redirect
 *              3. User karar → /authorize/decision (POST) → createAuthorizationCode
 *                 → Client'a redirect (?code=...)
 *              4. Client → /token (POST) → exchangeAuthorizationCode
 *                 → access_token (1 saat TTL) + refresh_token (30g TTL, OAuthRefreshToken tablosunda)
 *              5. validateAccessToken → protected resource'ları korumak için
 *              6. revokeAccessToken → manuel logout
 *              7. rotateRefreshToken → refresh grant; eski token revoke + replacedById set,
 *                 yeni access + refresh cifti olusturur (atomic transaction)
 *
 *              Güvenlik:
 *              - PKCE: code_verifier SHA256 → base64url karşılaştırma (S256)
 *              - client_secret bcrypt (cost 12)
 *              - access_token plain DB'de TUTULMAZ, SHA256 hash saklanır (plain sadece response'da)
 *              - refresh_token plain DB'de TUTULMAZ, SHA256 hash saklanır (OAuthRefreshToken tablosu)
 *              - Authorization code 10dk TTL + single-use (usedAt set edilir)
 *              - Refresh token rotation: eski token revokedAt set edilir, replacedById yeni token'a isaret eder
 *              - Constant-time karşılaştırma (timing attack koruması)
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AppError, NotFoundError, ValidationError } from '@/modules/shared/errors';
import type { CreateClientInput } from './schemas';

// --- Constants ---
const CLIENT_ID_LENGTH = 24; // 24 byte hex
const CLIENT_SECRET_LENGTH = 32; // 32 byte hex
const AUTHORIZATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 dakika
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gun
const REFRESH_TOKEN_BYTES = 48; // 48 byte → 64 char base64url (256-bit entropy)
const PKCE_BCRYPT_COST = 12;

// ============================================================================
// PKCE — Proof Key for Code Exchange (RFC 7636)
// ============================================================================

/**
 * Base64url encode (RFC 7636 § 3).
 * Standart base64'ün URL-safe versiyonu: + → -, / → _, padding kaldırılır.
 */
function base64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * PKCE code_verifier → code_challenge dönüşümü (S256).
 * SHA256(code_verifier) → base64url.
 */
function challengeFromVerifier(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64url(hash);
}

/**
 * PKCE doğrulama. S256 yöntemi: server'da SHA256(verifier) hesaplanır,
 * stored challenge ile constant-time karşılaştırılır.
 *
 * `plain` yöntemi sadece test/dev için kabul edilir; prod'da S256 zorunlu olmalı.
 */
export function verifyPkce(
  verifier: string,
  storedChallenge: string,
  method: string = 'S256'
): boolean {
  if (method === 'plain') {
    return safeEqualStrings(verifier, storedChallenge);
  }
  // S256 default
  const computed = challengeFromVerifier(verifier);
  return safeEqualStrings(computed, storedChallenge);
}

/**
 * Timing-safe string comparison. crypto.timingSafeEqual Buffer bekler.
 */
function safeEqualStrings(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// ============================================================================
// Client yönetimi
// ============================================================================

/**
 * Cryptographically secure client ID üret (hex).
 */
export function generateClientId(): string {
  return crypto.randomBytes(CLIENT_ID_LENGTH).toString('hex');
}

/**
 * Cryptographically secure client secret üret (hex).
 * Format: client secret düz döner, DB'de bcrypt hash saklanır.
 */
export function generateClientSecret(): string {
  return crypto.randomBytes(CLIENT_SECRET_LENGTH).toString('hex');
}

/**
 * Client secret → bcrypt hash.
 * Production'da cost=12 (env'den override edilebilir).
 */
export function hashClientSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, PKCE_BCRYPT_COST);
}

/**
 * Bcrypt hash'i doğrula. Constant-time bcrypt.compare.
 */
export function verifyClientSecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Yeni OAuth client oluştur.
 * Dönüş: { client: db record, clientSecret: plain (sadece burada döner!) }
 */
export async function createClient(
  ownerId: string,
  input: CreateClientInput
): Promise<{ client: any; clientSecret: string }> {
  const clientId = generateClientId();
  const clientSecret = generateClientSecret();
  const secretHash = await hashClientSecret(clientSecret);

  const client = await prisma.oAuthClient.create({
    data: {
      clientId,
      clientSecret: secretHash,
      name: input.name,
      redirectUris: input.redirectUris as unknown as object,
      scopes: input.scopes as unknown as object,
      ownerId,
    },
  });

  logger.info('[oauth] client created', {
    clientId,
    ownerId,
    name: input.name,
    scopes: input.scopes,
  });

  return { client, clientSecret };
}

/**
 * Client'ı client_id ile bul. redirect_uri doğrulaması dahili olarak yapılır.
 * İptal edilmiş (revokedAt set) client'lar null döner.
 */
export async function findActiveClient(clientId: string) {
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });
  if (!client || client.revokedAt) return null;
  return client;
}

/**
 * Redirect URI'nin client'ın whitelist'inde olduğunu doğrula (exact match).
 * RFC 6749 § 3.1.2: query/fragment farkı önemsiz, path exact match.
 */
export function validateRedirectUri(client: { redirectUris: unknown }, redirectUri: string): boolean {
  const list = client.redirectUris as string[];
  return Array.isArray(list) && list.includes(redirectUri);
}

/**
 * Talep edilen scope'lar client'ın yetkili scope'larının alt kümesi mi?
 * İleride ek scope = 400 invalid_scope.
 */
export function validateScopes(
  client: { scopes: unknown },
  requestedScopes: string[]
): { valid: boolean; granted: string[] } {
  const allowed = new Set(client.scopes as string[]);
  const granted = requestedScopes.filter((s) => allowed.has(s));
  return { valid: granted.length === requestedScopes.length, granted };
}

// ============================================================================
// Authorization Code
// ============================================================================

/**
 * Cryptographically secure authorization code üret.
 * 32 byte → 64 char hex.
 */
function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Authorization code oluştur. PKCE challenge DB'ye yazılır (doğrulama token exchange'de).
 *
 * @param expiresInMs default 10 dakika (RFC 6749 § 4.1.2 tavsiyesi)
 */
export async function createAuthorizationCode(params: {
  clientId: string;
  userId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresInMs?: number;
}): Promise<{ code: string; expiresAt: Date }> {
  const code = generateAuthorizationCode();
  const ttl = params.expiresInMs ?? AUTHORIZATION_CODE_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);

  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      clientId: params.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      scopes: params.scopes as unknown as object,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      expiresAt,
    },
  });

  logger.info('[oauth] authorization code created', {
    clientId: params.clientId,
    userId: params.userId,
    expiresAt,
  });

  return { code, expiresAt };
}

/**
 * Authorization code'u access token ile değiş.
 *
 * Akış (RFC 6749 § 4.1.3):
 *   1. Client var mı + secret doğru mu?
 *   2. Code DB'de var mı?
 *   3. Code süresi dolmamış mı?
 *   4. Code daha önce kullanılmış mı? (single-use)
 *   5. redirect_uri code'daki ile birebir eşleşiyor mu?
 *   6. PKCE doğrula (code_verifier ↔ code_challenge)
 *   7. usedAt set et (atomik transaction)
 *   8. access_token + refresh_token üret
 *   9. OAuthAccessToken kaydı aç
 */
export async function exchangeAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
}> {
  // 1) Client lookup + secret verify
  const client = await findActiveClient(params.clientId);
  if (!client) {
    throw new AppError('Geçersiz client', 401, 'INVALID_CLIENT');
  }
  const secretOk = await verifyClientSecret(params.clientSecret, client.clientSecret);
  if (!secretOk) {
    logger.warn('[oauth] client secret mismatch', { clientId: params.clientId });
    throw new AppError('Geçersiz client credentials', 401, 'INVALID_CLIENT');
  }

  // 2) Code lookup
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code: params.code },
  });
  if (!authCode || authCode.clientId !== params.clientId) {
    throw new AppError('Geçersiz authorization code', 400, 'INVALID_GRANT');
  }

  // 3) Expiry check
  if (authCode.expiresAt < new Date()) {
    throw new AppError('Authorization code süresi dolmuş', 400, 'INVALID_GRANT');
  }

  // 4) Single-use check
  if (authCode.usedAt) {
    logger.warn('[oauth] authorization code reuse attempt', {
      clientId: params.clientId,
      code: params.code.slice(0, 8) + '...',
    });
    throw new AppError('Authorization code zaten kullanılmış', 400, 'INVALID_GRANT');
  }

  // 5) redirect_uri exact match
  if (authCode.redirectUri !== params.redirectUri) {
    throw new AppError('redirect_uri uyuşmuyor', 400, 'INVALID_GRANT');
  }

  // 6) PKCE verify
  const pkceOk = verifyPkce(params.codeVerifier, authCode.codeChallenge, authCode.codeChallengeMethod);
  if (!pkceOk) {
    logger.warn('[oauth] PKCE verification failed', {
      clientId: params.clientId,
      method: authCode.codeChallengeMethod,
    });
    throw new AppError('PKCE doğrulaması başarısız', 400, 'INVALID_GRANT');
  }

  // 7-9) Atomic: code'u mark + token yarat (race condition koruması)
  // Access token: OAuthAccessToken tablosu, 1 saat TTL
  // Refresh token: OAuthRefreshToken tablosu, 30 gün TTL (L3 ayrı model)
  const accessToken = generateAccessToken();
  const accessTokenHash = hashAccessToken(accessToken);
  const accessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

  // issueRefreshToken DB'ye yazar; plain token'ı response için döner.
  // Transaction dışında çağrılır; refreshToken oluşturma başarısız olursa
  // outer catch AppError fırlatır.
  let plainRefresh: string;
  try {
    plainRefresh = await issueRefreshToken({
      clientId: params.clientId,
      userId: authCode.userId,
      scopes: authCode.scopes as string[],
    });
  } catch (err) {
    logger.error('[oauth] refresh token issuance failed', { err });
    throw new AppError('Refresh token oluşturulamadı', 500, 'SERVER_ERROR');
  }
  const refreshToken = plainRefresh;

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic single-use enforcement — aynı code ile iki eşzamanlı exchange
      // yalnızca birinin update etmesine izin verir.
      const updated = await tx.oAuthAuthorizationCode.updateMany({
        where: { code: params.code, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (updated.count === 0) {
        throw new AppError('Authorization code zaten kullanılmış', 400, 'INVALID_GRANT');
      }

      await tx.oAuthAccessToken.create({
        data: {
          tokenHash: accessTokenHash,
          clientId: params.clientId,
          userId: authCode.userId,
          scopes: authCode.scopes as unknown as object,
          expiresAt: accessExpiresAt,
        },
      });
      // Refresh token zaten issueRefreshToken ile DB'ye yazıldı (transaction dışı).
      // Burada tekrar yazmıyoruz; plain token sadece bu scope'ta return edilecek.
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('[oauth] token exchange transaction failed', { err });
    throw new AppError('Token değişimi başarısız', 500, 'SERVER_ERROR');
  }

  const scopes = (authCode.scopes as string[]).join(' ');

  logger.info('[oauth] token exchanged', {
    clientId: params.clientId,
    userId: authCode.userId,
    scopes,
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    scope: scopes,
  };
}

// ============================================================================
// Access Token
// ============================================================================

/**
 * Access token üret (plain). DB'de hash saklanır.
 */
export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Refresh token üret (plain). DB'de SHA256 hash saklanır.
 * 48 byte → 64 char base64url (256-bit+ entropy).
 * Access token'dan daha uzun: rotation audit trail'i icin daha genis alan.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

/**
 * SHA256 hash (base64url) — DB'de plain token yerine saklanır.
 * Doğrulama sırasında aynı hash hesaplanır, lookup edilir.
 *
 * NOT: Access ve refresh token'lar ayni hash algoritmasini kullanir (SHA256)
 * fakat farkli tablolarda (OAuthAccessToken vs OAuthRefreshToken) saklanirlar.
 * Hash collision yapisal olarak 256-bit oldugu icin ihmal edilebilir; ama
 * izolasyon amaciyla ayri tutulur.
 */
export function hashAccessToken(plain: string): string {
  return base64url(crypto.createHash('sha256').update(plain).digest());
}

/**
 * Alias for clarity at call sites. SHA256 plain → base64url.
 * Refresh token hashing icin kullanilir; hashAccessToken ile ayni implementasyon.
 */
export const hashRefreshToken = hashAccessToken;

/**
 * Access token doğrula. Dönüş: { userId, clientId, scopes } veya null.
 * Kontroller: hash eşleşmesi, expired değil, revoked değil.
 */
export async function validateAccessToken(plain: string): Promise<{
  userId: string;
  clientId: string;
  scopes: string[];
  tokenId: string;
} | null> {
  const tokenHash = hashAccessToken(plain);
  const token = await prisma.oAuthAccessToken.findUnique({
    where: { tokenHash },
  });
  if (!token) return null;
  if (token.revokedAt) return null;
  if (token.expiresAt < new Date()) return null;

  return {
    userId: token.userId,
    clientId: token.clientId,
    scopes: token.scopes as string[],
    tokenId: token.id,
  };
}

/**
 * Access token'ı iptal et (logout / client revoke).
 */
export async function revokeAccessToken(plain: string): Promise<boolean> {
  const tokenHash = hashAccessToken(plain);
  const result = await prisma.oAuthAccessToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

/**
 * Client'ın tüm token'larını iptal et (client revoke).
 * Access + refresh token'lar paralel revoke edilir; toplam sayıyı döner.
 */
export async function revokeAllClientTokens(clientId: string): Promise<number> {
  const [accessResult, refreshResult] = await prisma.$transaction([
    prisma.oAuthAccessToken.updateMany({
      where: { clientId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.oAuthRefreshToken.updateMany({
      where: { clientId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  return accessResult.count + refreshResult.count;
}

// ============================================================================
// Refresh Token — L3 rotation + revocation (RFC 6749 § 6)
// ============================================================================

/**
 * Yeni refresh token üret ve DB'ye yaz. Plain token sadece burada return edilir —
 * sonraki adımda client'a response olarak gönderilir. Hash saklanır.
 *
 * NOT: Bu fonksiyon transaction DIŞINDA çağrılır (tekil kayıt ekleme). Cift
 * token (access + refresh) olusturulurken outer transaction tarafından
 * sarılabilir, ancak tek başına atomic'tir (refresh token revoke edilmeden
 * once her zaman DB'de var olmalı; race condition yok).
 */
export async function issueRefreshToken(params: {
  clientId: string;
  userId: string;
  scopes: string[];
  expiresInMs?: number;
}): Promise<string> {
  const plain = generateRefreshToken();
  const tokenHash = hashRefreshToken(plain);
  const expiresAt = new Date(
    Date.now() + (params.expiresInMs ?? REFRESH_TOKEN_TTL_MS)
  );

  await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash,
      clientId: params.clientId,
      userId: params.userId,
      scopes: params.scopes as unknown as object,
      expiresAt,
    },
  });

  logger.info('[oauth] refresh token issued', {
    clientId: params.clientId,
    userId: params.userId,
    expiresAt,
  });

  return plain;
}

/**
 * Refresh token rotation (RFC 6749 § 6 + draft-ietf-oauth-security-topics).
 *
 * Akış:
 *   1. Hash'le, DB'de lookup
 *   2. Varsa: revoked mı? expired mı? client eşleşiyor mu?
 *   3. Yeni access token + refresh token üret (atomic transaction)
 *   4. Eski refresh token'ı revoke et + replacedById = yeni token'a işaret et
 *   5. lastUsedAt güncelle (audit trail)
 *
 * Reuse detection: Eğer revoked bir refresh token rotate için kullanılırsa,
 * tum kullanicinin o client icin olan tum aktif refresh token'lari revoke edilir
 * (RFC 6749 § 10.4 — stolen token mitigation).
 */
export async function rotateRefreshToken(params: {
  plainRefreshToken: string;
  clientId: string;
  // Opsiyonel scope: talep edilen scope, mevcut scope'un altkumesi olmali (RFC 6749 § 6)
  requestedScope?: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
}> {
  const tokenHash = hashRefreshToken(params.plainRefreshToken);

  // 1) DB lookup
  const existing = await prisma.oAuthRefreshToken.findUnique({
    where: { tokenHash },
  });

  if (!existing || existing.clientId !== params.clientId) {
    throw new AppError('Geçersiz refresh token', 400, 'INVALID_GRANT');
  }

  // 2a) Reuse detection: revoked token rotate icin geldi → tum aktif refresh'leri revoke et
  if (existing.revokedAt) {
    logger.warn('[oauth] refresh token reuse detected — revoking all user refresh tokens', {
      clientId: params.clientId,
      userId: existing.userId,
      revokedAt: existing.revokedAt,
    });
    await prisma.oAuthRefreshToken.updateMany({
      where: {
        userId: existing.userId,
        clientId: params.clientId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    throw new AppError(
      'Refresh token reuse tespit edildi — tüm oturumlar iptal edildi',
      400,
      'INVALID_GRANT'
    );
  }

  // 2b) Expiry check
  if (existing.expiresAt < new Date()) {
    throw new AppError('Refresh token süresi dolmuş', 400, 'INVALID_GRANT');
  }

  // 3) Scope kontrol: scope talep edilmisse, mevcut scope altkumesi olmali
  const existingScopes = existing.scopes as string[];
  let grantedScopes = existingScopes;
  if (params.requestedScope) {
    const requested = params.requestedScope.trim().split(/\s+/).filter(Boolean);
    const allowed = new Set(existingScopes);
    const filtered = requested.filter((s) => allowed.has(s));
    if (filtered.length !== requested.length) {
      throw new AppError(
        'Talep edilen scope mevcut scope altkümesi değil',
        400,
        'INVALID_SCOPE'
      );
    }
    grantedScopes = filtered;
  }

  // 4) Yeni access token + refresh token üret (atomic transaction)
  const accessToken = generateAccessToken();
  const accessTokenHash = hashAccessToken(accessToken);
  const accessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const newRefreshPlain = generateRefreshToken();
  const newRefreshHash = hashRefreshToken(newRefreshPlain);

  let newRefreshId: string;

  try {
    newRefreshId = await prisma.$transaction(async (tx) => {
      // Onceki refresh token revoked mi kontrol et (race condition guard)
      const stillValid = await tx.oAuthRefreshToken.findUnique({
        where: { id: existing.id },
      });
      if (!stillValid || stillValid.revokedAt) {
        // Baska bir istek esnasinda rotate edildi → reuse sayilir
        throw new AppError(
          'Refresh token concurrent rotation tespit edildi',
          400,
          'INVALID_GRANT'
        );
      }

      // Yeni refresh token'i olustur
      const newRefresh = await tx.oAuthRefreshToken.create({
        data: {
          tokenHash: newRefreshHash,
          clientId: params.clientId,
          userId: existing.userId,
          scopes: grantedScopes as unknown as object,
          expiresAt: refreshExpiresAt,
        },
      });

      // Eski refresh token'i revoke et + replacedById isaretle + lastUsedAt guncelle
      // replacedById unique oldugu icin ayni token'a iki kez rotate edilemez
      await tx.oAuthRefreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: new Date(),
          replacedById: newRefresh.id,
          lastUsedAt: new Date(),
        },
      });

      // Yeni access token'i olustur
      await tx.oAuthAccessToken.create({
        data: {
          tokenHash: accessTokenHash,
          clientId: params.clientId,
          userId: existing.userId,
          scopes: grantedScopes as unknown as object,
          expiresAt: accessExpiresAt,
        },
      });

      return newRefresh.id;
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('[oauth] refresh rotation transaction failed', { err });
    throw new AppError('Refresh token rotasyonu başarısız', 500, 'SERVER_ERROR');
  }

  logger.info('[oauth] refresh token rotated', {
    clientId: params.clientId,
    userId: existing.userId,
    oldId: existing.id,
    newId: newRefreshId,
    scopeDowngrade: params.requestedScope ? true : false,
  });

  return {
    accessToken,
    refreshToken: newRefreshPlain,
    tokenType: 'Bearer',
    expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    scope: grantedScopes.join(' '),
  };
}

/**
 * Tek bir refresh token'ı iptal et (logout).
 * Plain token SHA256 hash'lenip lookup edilir; revoke edilir.
 */
export async function revokeRefreshToken(plainRefreshToken: string): Promise<boolean> {
  const tokenHash = hashRefreshToken(plainRefreshToken);
  const result = await prisma.oAuthRefreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

/**
 * Belirli bir user + client icin TUM aktif refresh token'lari iptal et.
 * "Sign out from this app" / "compromise suspected" senaryolarinda kullanilir.
 */
export async function revokeAllUserClientRefreshTokens(
  userId: string,
  clientId: string
): Promise<number> {
  const result = await prisma.oAuthRefreshToken.updateMany({
    where: { userId, clientId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

/**
 * Client'ın secret'ını rotate et.
 * - Eski secret revoke edilemez (client zaten kimlik dogrulama gecmis);
 *   bu nedenle secret rotation'da yeni secret olusturulur ve eski secret
 *   bir "grace period" icin kabul edilebilir olarak isaretlenir.
 *
 * Mevcut OAuthClient model'inde grace period yok; bu nedenle rotation
 * atomik olarak eski hash'i silip yeni hash set eder. Tum aktif access +
 * refresh token'lar da revoke edilir (güvenlik).
 *
 * Return: { clientSecret: plain (sadece burada doner!) }
 */
export async function rotateClientSecret(clientId: string): Promise<{
  clientSecret: string;
  revokedAccessTokens: number;
  revokedRefreshTokens: number;
}> {
  const newPlainSecret = generateClientSecret();
  const newHash = await hashClientSecret(newPlainSecret);

  // Client var mi kontrol
  const existing = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });
  if (!existing || existing.revokedAt) {
    throw new NotFoundError('OAuthClient');
  }

  const [_, accessRevoked, refreshRevoked] = await prisma.$transaction([
    prisma.oAuthClient.update({
      where: { clientId },
      data: { clientSecret: newHash },
    }),
    prisma.oAuthAccessToken.updateMany({
      where: { clientId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.oAuthRefreshToken.updateMany({
      where: { clientId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  logger.info('[oauth] client secret rotated', {
    clientId,
    revokedAccessTokens: accessRevoked.count,
    revokedRefreshTokens: refreshRevoked.count,
  });

  return {
    clientSecret: newPlainSecret,
    revokedAccessTokens: accessRevoked.count,
    revokedRefreshTokens: refreshRevoked.count,
  };
}
