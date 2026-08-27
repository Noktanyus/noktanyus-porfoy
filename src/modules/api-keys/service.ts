/**
 * API Key Module — Service Layer
 *
 * API anahtarı üretimi, iptali, güncellenmesi ve doğrulanması.
 * Cryptographically secure key generation + usage tracking.
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { apiKeyRepository, apiKeyUsageRepository } from './repository';
import type { CreateApiKeyInput, UpdateApiKeyInput } from './schemas';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';

const KEY_PREFIX = 'nokt_';

/**
 * Cryptographically secure API key üret.
 * Format: nokt_<env>_<48 char hex>
 * - env: 'live' (production) veya 'test' (development)
 * - prefix: UI'da göstermek için ilk 12 karakter
 */
function generateApiKey(): { full: string; prefix: string } {
  const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  const random = crypto.randomBytes(24).toString('hex'); // 48 char
  const full = `${KEY_PREFIX}${env}_${random}`;
  const prefix = full.substring(0, 12);
  return { full, prefix };
}

/**
 * Service public API. Sade-tarz object üzerinden fonksiyonlar.
 */
export const apiKeyService = {
  /**
   * Kullanıcının tüm aktif API anahtarlarını listele.
   */
  async listApiKeys(userId: string) {
    return apiKeyRepository.findByUserId(userId);
  },

  /**
   * Yeni API anahtarı oluştur. Dönen `key` değeri sadece 1 kez gösterilir.
   */
  async createApiKey(userId: string, input: CreateApiKeyInput) {
    const { full, prefix } = generateApiKey();

    const apiKey = await apiKeyRepository.create({
      userId,
      name: input.name,
      key: full,
      prefix,
      scopes: input.scopes,
      rateLimit: input.rateLimit,
      monthlyQuota: input.monthlyQuota ?? null,
      expiresAt: input.expiresAt ?? null,
    });

    logger.info('API key created', {
      userId,
      keyId: apiKey.id,
      prefix,
      scopes: input.scopes,
    });

    // full key sadece burada return edilir — repository'de sadece prefix tutulur.
    return { ...apiKey, key: full };
  },

  /**
   * API anahtarını iptal et (soft delete). revokedAt set edilir.
   */
  async revokeApiKey(userId: string, keyId: string, reason?: string) {
    const key = await apiKeyRepository.findById(keyId);
    if (!key || key.userId !== userId) throw new NotFoundError('API anahtarı');
    if (key.revokedAt) throw new ValidationError('Bu anahtar zaten iptal edilmiş');

    const updated = await apiKeyRepository.update(keyId, {
      revokedAt: new Date(),
      revokedReason: reason ?? null,
    });

    logger.info('API key revoked', { userId, keyId, reason });
    return updated;
  },

  /**
   * API anahtarını güncelle (name, scopes, rateLimit, monthlyQuota, expiresAt).
   * İptal edilmiş anahtar güncellenemez.
   */
  async updateApiKey(userId: string, keyId: string, input: UpdateApiKeyInput) {
    const key = await apiKeyRepository.findById(keyId);
    if (!key || key.userId !== userId) throw new NotFoundError('API anahtarı');
    if (key.revokedAt) throw new ValidationError('İptal edilmiş anahtar güncellenemez');

    return apiKeyRepository.update(keyId, input);
  },

  /**
   * API anahtarını kalıcı olarak sil (hard delete).
   * Usage kayıtları cascade ile silinir (schema'da onDelete: Cascade).
   */
  async deleteApiKey(userId: string, keyId: string) {
    const key = await apiKeyRepository.findById(keyId);
    if (!key || key.userId !== userId) throw new NotFoundError('API anahtarı');
    return apiKeyRepository.delete(keyId);
  },

  /**
   * Son 24 saatlik usage istatistikleri.
   */
  async getUsageStats(userId: string, keyId: string) {
    const key = await apiKeyRepository.findById(keyId);
    if (!key || key.userId !== userId) throw new NotFoundError('API anahtarı');
    return apiKeyRepository.getUsageStats(keyId);
  },

  /**
   * API key doğrulama — middleware tarafından her istekte çağrılır.
   * Dönüş: userId, keyId, scopes, rateLimit veya null (geçersiz).
   *
   * Kontroller:
     1. Key DB'de var mı?
     2. İptal edilmiş mi?
     3. Süresi dolmuş mu?
     4. Aylık quota aşılmış mı?
   */
  async validateKey(key: string) {
    const apiKey = await apiKeyRepository.findByKey(key);
    if (!apiKey) return null;

    // 1. Revoked
    if (apiKey.revokedAt) return null;

    // 2. Expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // 3. Monthly quota
    if (apiKey.monthlyQuota) {
      const usage = await apiKeyUsageRepository.countMonthlyUsage(apiKey.id);
      if (usage >= apiKey.monthlyQuota) return null;
    }

    return {
      userId: apiKey.userId,
      keyId: apiKey.id,
      scopes: apiKey.scopes as string[],
      rateLimit: apiKey.rateLimit,
    };
  },

  /**
   * Kullanım tracking — response sonrası fire-and-forget çağrılır.
   * Hata olursa loglanır, istek başarısız olmaz.
   */
  async trackUsage(
    apiKeyId: string,
    data: {
      endpoint: string;
      method: string;
      statusCode: number;
      ipAddress?: string;
    }
  ) {
    try {
      await prisma.apiKeyUsage.create({
        data: { apiKeyId, ...data },
      });
      await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { lastUsedAt: new Date(), totalRequests: { increment: 1 } },
      });
    } catch (err) {
      logger.error('API key usage tracking failed', {
        error: err instanceof Error ? err.message : String(err),
        apiKeyId,
      });
    }
  },
};