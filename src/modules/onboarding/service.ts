/**
 * Onboarding Service — Phase D (SaaS Blockers)
 *
 * Self-serve user journey:
 *   1. Register → email verification token issued
 *   2. Verify email → trial subscription auto-started
 *   3. Login (with 2FA if enabled)
 *   4. Password reset via email link
 *   5. Account lockout on brute-force attempts
 *
 * Pattern references:
 *   - NewsletterSubscriber.verifyToken + verifiedAt → adapted for User
 *   - src/lib/auth.ts NextAuth CredentialsProvider
 *   - src/lib/emailService.ts sendEmail helper
 *   - src/lib/planGate.ts quota + plan lookup
 */

import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';
import { sendEmail } from '@/lib/emailService';
import { logAudit } from '@/lib/audit';
import { verifyTotp } from '@/lib/twoFactor';
import { subscriptionSyncService } from '@/modules/commerce/subscriptionSync';
import type {
  OnboardingPayload,
  OnboardingPlan,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  TwoFactorLoginInput,
} from './schemas';

// === Token Generation ===

const VERIFY_TOKEN_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_HOURS = 1;
const TRIAL_DAYS = 14;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

function hashTokenForStorage(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function expiryFromNow(hours: number): Date {
  const d = new Date();
  // setUTCHours sadece integer saat kabul eder; sub-hour degerler
  // (orn. 0.25 saat = 15 dakika) icin setUTCMilliseconds kullanilir.
  // Bu sayede LOCKOUT_MINUTES / 60 gibi kesirli saatler dogru eklenir.
  d.setUTCMilliseconds(d.getUTCMilliseconds() + Math.round(hours * 60 * 60 * 1000));
  return d;
}

// === D.1 — Registration ===

export interface RegisterResult {
  userId: string;
  email: string;
  name: string;
  emailVerificationRequired: boolean;
}

export async function registerUser(
  payload: OnboardingPayload,
  ctx: { ipAddress?: string; userAgent?: string } = {}
): Promise<RegisterResult> {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true, emailVerified: true },
  });

  if (existing) {
    // Idempotent: if user exists but never verified, allow re-register by re-issuing token
    if (existing.emailVerified) {
      throw new Error('Bu e-posta zaten kayıtlı. Giriş sayfasına yönlendiriliyorsunuz.');
    }
    const token = generateSecureToken();
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        emailVerifyToken: hashTokenForStorage(token),
        emailVerifyExpires: expiryFromNow(VERIFY_TOKEN_TTL_HOURS),
      },
    });
    await sendVerificationEmail(payload.email, token);
    return {
      userId: existing.id,
      email: payload.email,
      name: payload.name,
      emailVerificationRequired: true,
    };
  }

  const passwordHash = await hashPassword(payload.password);
  const token = generateSecureToken();

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      name: payload.name,
      password: passwordHash,
      emailVerifyToken: hashTokenForStorage(token),
      emailVerifyExpires: expiryFromNow(VERIFY_TOKEN_TTL_HOURS),
    },
    select: { id: true, email: true, name: true },
  });

  await sendVerificationEmail(payload.email, token);

  logAudit({
    action: 'REGISTER',
    resource: 'user',
    resourceId: user.id,
    details: { email: payload.email, planSlug: payload.planSlug },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  }).catch(() => undefined);

  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? '',
    emailVerificationRequired: true,
  };
}

// === D.1 — Email Verification ===

export interface VerifyEmailResult {
  userId: string;
  email: string;
  trialStarted: boolean;
  creditsGranted?: number;
}

export async function verifyEmail(input: VerifyEmailInput): Promise<VerifyEmailResult> {
  const tokenHash = hashTokenForStorage(input.token);

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: tokenHash,
      emailVerifyExpires: { gt: new Date() },
    },
    select: { id: true, email: true, trialStartedAt: true },
  });

  if (!user) {
    throw new Error('Doğrulama linki geçersiz veya süresi dolmuş. Yeni link talep edin.');
  }

  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + TRIAL_DAYS);

  let creditsAwarded = 0;

  await prisma.$transaction(async (tx) => {
    let alreadyCredited = false;
    if (tx.apiCreditLedger) {
      const existingLedger = await tx.apiCreditLedger.findFirst({
        where: { userId: user.id, reason: 'welcome_bonus' },
      });
      if (existingLedger) alreadyCredited = true;
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        emailVerified: now,
        emailVerifyToken: null,
        emailVerifyExpires: null,
        trialStartedAt: now,
        trialEndsAt,
        ...(alreadyCredited ? {} : { apiCreditBalance: { increment: 100 } }),
      },
    });

    if (!alreadyCredited) {
      creditsAwarded = 100;
      if (tx.apiCreditLedger) {
        const updatedUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { apiCreditBalance: true },
        });
        await tx.apiCreditLedger.create({
          data: {
            userId: user.id,
            delta: 100,
            balanceAfter: updatedUser?.apiCreditBalance ?? 100,
            reason: 'welcome_bonus',
            metadata: { note: 'E-posta onaylı kullanıcı hoş geldin kredisi' },
          },
        });
      }
    }

    // Idempotent trial kaydı — Stripe webhook'unun kullandığı AYNI sözleşmeden
    // geçer (subscriptionSync.ts). Böylece ileride Stripe aboneliği geldiğinde
    // upsertUserSubscription bu satırı devralır, kullanıcıda iki paralel
    // abonelik oluşmaz.
    const plan = await tx.plan.findUnique({
      where: { slug: 'starter' },
      select: { trialDays: true },
    });

    await subscriptionSyncService.ensureTrialUserSubscription(
      {
        userId: user.id,
        planSlug: 'starter',
        trialDays: plan?.trialDays ?? TRIAL_DAYS,
        now,
      },
      tx
    );
  });

  return {
    userId: user.id,
    email: user.email,
    trialStarted: true,
    creditsGranted: creditsAwarded,
  };
}

export async function resendVerification(
  input: ResendVerificationInput
): Promise<{ sent: boolean }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    // Always return sent:true to prevent email enumeration
    return { sent: true };
  }

  const token = generateSecureToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken: hashTokenForStorage(token),
      emailVerifyExpires: expiryFromNow(VERIFY_TOKEN_TTL_HOURS),
    },
  });

  await sendVerificationEmail(input.email, token);
  return { sent: true };
}

// === D.2 — Password Reset ===

export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<{ sent: boolean }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  // Always return sent:true to prevent email enumeration
  if (!user) return { sent: true };

  const token = generateSecureToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashTokenForStorage(token),
      passwordResetExpires: expiryFromNow(PASSWORD_RESET_TTL_HOURS),
    },
  });

  await sendPasswordResetEmail(input.email, token);
  return { sent: true };
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ ok: true }> {
  const tokenHash = hashTokenForStorage(input.token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new Error('Sıfırlama linki geçersiz veya süresi dolmuş. Yeni link talep edin.');
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      // Reset any lockout on successful password reset
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  logAudit({
    userId: user.id,
    action: 'PASSWORD_RESET',
    resource: 'user',
    resourceId: user.id,
  }).catch(() => undefined);

  return { ok: true };
}

// === D.7 — Account Lockout ===

export interface LoginAttemptInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginAttemptResult {
  success: boolean;
  requiresTwoFactor: boolean;
  userId?: string;
  reason?: string;
}

export async function attemptLogin(input: LoginAttemptInput): Promise<LoginAttemptResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      password: true,
      twoFactorEnabled: true,
      emailVerified: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  if (!user || !user.password) {
    // Timing-safe: still hash to equalize response time
    await hashPassword('dummy-password-for-timing');
    return { success: false, requiresTwoFactor: false, reason: 'Geçersiz e-posta veya şifre' };
  }

  // Lockout check
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      success: false,
      requiresTwoFactor: false,
      reason: `Hesap geçici olarak kilitli. ${minutesLeft} dakika sonra tekrar deneyin.`,
    };
  }

  if (!user.emailVerified) {
    return {
      success: false,
      requiresTwoFactor: false,
      reason: 'E-postanız henüz doğrulanmadı. Doğrulama linki gönderdik.',
    };
  }

  const passwordValid = await verifyPassword(input.password, user.password);
  if (!passwordValid) {
    const newFailedCount = (user.failedLoginCount ?? 0) + 1;
    const lockout = newFailedCount >= MAX_FAILED_LOGINS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: newFailedCount,
        lockedUntil: lockout ? expiryFromNow(LOCKOUT_MINUTES / 60) : null,
      },
    });

    logAudit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      resource: 'user',
      resourceId: user.id,
      status: 'failure',
      details: { reason: 'invalid_password', attemptCount: newFailedCount },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    }).catch(() => undefined);

    if (lockout) {
      return {
        success: false,
        requiresTwoFactor: false,
        reason: `Çok fazla hatalı deneme. Hesap ${LOCKOUT_MINUTES} dakika kilitlendi.`,
      };
    }

    return { success: false, requiresTwoFactor: false, reason: 'Geçersiz e-posta veya şifre' };
  }

  // Reset failed count on success
  if (user.failedLoginCount > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  return {
    success: true,
    requiresTwoFactor: user.twoFactorEnabled,
    userId: user.id,
  };
}

// === D.5 — 2FA Login Verification ===

export async function verifyLoginTwoFactor(
  userId: string,
  input: TwoFactorLoginInput
): Promise<{ success: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorBackupCodes: true, twoFactorEnabled: true },
  });

  if (!user || !user.twoFactorEnabled) {
    return { success: false, reason: '2FA aktif değil' };
  }

  if (input.backupCode) {
    const valid = await verifyBackupCode(input.backupCode, user.twoFactorBackupCodes);
    if (valid) {
      await consumeBackupCode(userId, input.backupCode, user.twoFactorBackupCodes);
      return { success: true };
    }
    return { success: false, reason: 'Geçersiz yedek kod' };
  }

  if (!user.twoFactorSecret) {
    return { success: false, reason: '2FA secret eksik' };
  }

  const ok = verifyTotp(input.code, user.twoFactorSecret);
  if (!ok) return { success: false, reason: 'Geçersiz 2FA kodu' };

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorVerifiedAt: new Date() },
  });

  return { success: true };
}

async function verifyBackupCode(
  code: string,
  backupCodesHashes: unknown
): Promise<boolean> {
  if (!Array.isArray(backupCodesHashes)) return false;
  const { createHash } = await import('crypto');
  const codeHash = createHash('sha256').update(code).digest('hex');
  return (backupCodesHashes as string[]).includes(codeHash);
}

async function consumeBackupCode(
  userId: string,
  code: string,
  backupCodesHashes: unknown
): Promise<void> {
  if (!Array.isArray(backupCodesHashes)) return;
  const { createHash } = await import('crypto');
  const codeHash = createHash('sha256').update(code).digest('hex');
  const updated = (backupCodesHashes as string[]).filter((h) => h !== codeHash);
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorBackupCodes: updated },
  });
}

// === Email Senders (delegated to emailService with inline templates) ===

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/email-dogrula?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'E-posta adresinizi doğrulayın — 100 Ücretsiz API Kredisi',
    html: `
      <p>Merhaba,</p>
      <p>Hesabınızı aktifleştirmek ve hesabınıza <strong>100 ücretsiz API kredisi</strong> yüklemek için aşağıdaki linke tıklayın:</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;">E-postamı Doğrula ve 100 Kredimi Al</a></p>
      <p>Bu link 24 saat geçerlidir.</p>
      <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelin.</p>
    `,
    text: `Hesabınızı doğrulamak ve 100 ücretsiz API kredinizi almak için: ${url}`,
  }).catch((err) => {
    logger.error('[Onboarding] Verification email failed', { error: err, email });
  });
}

async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/sifremi-sifirla?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Şifre sıfırlama talebi',
    html: `
      <p>Merhaba,</p>
      <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;">Şifremi sıfırla</a></p>
      <p>Bu link 1 saat geçerlidir. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin.</p>
    `,
    text: `Şifrenizi sıfırlamak için: ${url}`,
  }).catch((err) => {
    logger.error('[Onboarding] Password reset email failed', { error: err, email });
  });
}

// === Helpers exported for D.1 trial queries ===

export async function isUserInTrial(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialStartedAt: true, trialEndsAt: true },
  });
  if (!user?.trialStartedAt || !user.trialEndsAt) return false;
  return user.trialEndsAt > new Date();
}

export async function getUserTrialDaysRemaining(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true },
  });
  if (!user?.trialEndsAt) return 0;
  const ms = user.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// Re-export type for convenience
export type { OnboardingPlan };