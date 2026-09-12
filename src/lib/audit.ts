/**
 * @file Admin Audit Log Utility
 * @description Admin panelinden yapılan kritik işlemleri kayıt altına alan yardımcı modül.
 *
 * - Prisma üzerinden `audit_logs` tablosuna yazar
 * - Hata durumunda ana işlemi BLOKlamaz (fire-and-forget semantiği)
 * - `logger` üzerinden Sentry'ye bildirim gönderir
 */

import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from './logger';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'EXPORT'
  | 'IMPORT'
  | 'GIT_COMMIT'
  | 'GIT_REVERT'
  | 'GIT_CHECKOUT'
  | 'IMAGE_UPLOAD'
  | 'IMAGE_DELETE'
  | 'SETTINGS_UPDATE'
  | 'REFUND'
  | 'AI_GENERATE'
  | 'DATA_ACCESS'        // KVKK Madde 11 — kullanıcı verisine erişim
  | 'DATA_EXPORT'        // KVKK Madde 11 — veri ihracı talebi
  | 'CONSENT_GRANT'      // Cookie/consent kayıt
  | 'CONSENT_REVOKE'     // Consent iptali
  | 'REGISTER'           // Self-serve onboarding
  | 'PASSWORD_RESET';    // Password reset completed

export interface AuditEntry {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure';
}

/**
 * Başarılı bir audit log kaydı oluşturur.
 * Hata durumunda loglama yapar ama çağıran fonksiyona hata fırlatmaz.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const data: Prisma.AuditLogCreateInput = {
      user: entry.userId ? { connect: { id: entry.userId } } : undefined,
      userEmail: entry.userEmail ?? null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      details: entry.details
        ? (entry.details as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
      status: entry.status ?? 'success',
    };

    await prisma.auditLog.create({ data });
  } catch (error) {
    logger.error('Audit log failed', { error, entry });
  }
}

/**
 * Başarısız işlem için audit log kaydı oluşturur.
 */
export async function logAuditFailure(
  entry: Omit<AuditEntry, 'details'>,
  error: unknown
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        user: entry.userId ? { connect: { id: entry.userId } } : undefined,
        userEmail: entry.userEmail ?? null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        status: 'failure',
        errorMessage: error instanceof Error ? error.message : String(error),
      } as Prisma.AuditLogCreateInput,
    });
  } catch (e) {
    logger.error('Audit log failure record failed', { error: e });
  }
}

/**
 * Son N audit log kaydını getirir.
 */
export async function getRecentAuditLogs(limit = 50) {
  return prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Belirli bir resource için audit log kayıtlarını getirir.
 */
export async function getAuditLogsByResource(resource: string, resourceId?: string) {
  return prisma.auditLog.findMany({
    where: {
      resource,
      ...(resourceId ? { resourceId } : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
}

/**
 * Phase 4 C.8 — KVKK Madde 11 / GDPR Article 15 kapsamında, kullanıcı
 * kişisel verilerine erişim olduğunda (GET endpoint'leri) çağrılır.
 *
 * - `action: 'DATA_ACCESS'` olarak kayıt düşer.
 * - Fire-and-forget: ana request'i BLOKLamaz (void promise).
 * - Çağıran taraf await ETMEMELİ — performans için tasarlandı.
 *
 * @example
 *   logDataAccess({
 *     userId, resource: 'api_key', resourceId: id,
 *     ipAddress, userAgent,
 *   });
 */
export function logDataAccess(entry: {
  userId: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}): void {
  // Fire-and-forget — promise'i beklemiyoruz
  void (async () => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: 'DATA_ACCESS',
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent?.slice(0, 500) ?? null,
          details: entry.details
            ? (entry.details as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          status: 'success',
        },
      });
    } catch (error) {
      logger.error('logDataAccess failed', { error, entry });
    }
  })();
}
