/**
 * Onboarding Schemas — Sprint 1.5 / Phase D
 *
 * Zod validation schemas for self-serve onboarding, password reset,
 * email verification, and 2FA flow. All schemas are strict (no extra
 * keys) to prevent injection of unknown fields into the User model.
 */

import { z } from 'zod';

/**
 * Plan tier selection during signup.
 * Free → 14-day Pro trial (full feature access during trial).
 */
export const OnboardingPlanSchema = z.enum(['starter', 'pro', 'business', 'enterprise']);
export type OnboardingPlan = z.infer<typeof OnboardingPlanSchema>;

/**
 * Step 1 — Account registration.
 * Reused by both /kayit wizard and direct API registration.
 */
export const RegisterStepSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'İsim en az 2 karakter olmalı')
    .max(100, 'İsim en fazla 100 karakter olabilir'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .max(100, 'Şifre en fazla 100 karakter olabilir')
    .regex(/[A-Za-z]/, 'Şifre en az bir harf içermeli')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermeli'),
});
export type RegisterStepInput = z.infer<typeof RegisterStepSchema>;

/**
 * Step 2 — Plan selection (optional, defaults to starter trial).
 */
export const PlanSelectStepSchema = z.object({
  planSlug: OnboardingPlanSchema.default('starter'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Kullanım koşullarını kabul etmelisiniz' }),
  }),
});
export type PlanSelectStepInput = z.infer<typeof PlanSelectStepSchema>;

/**
 * Full registration payload (wizard final submit).
 */
export const OnboardingPayloadSchema = RegisterStepSchema.extend({
  planSlug: OnboardingPlanSchema.default('starter'),
  acceptTerms: z.literal(true),
});
export type OnboardingPayload = z.infer<typeof OnboardingPayloadSchema>;

/**
 * Email verification — token sent in magic link.
 */
export const VerifyEmailSchema = z.object({
  token: z.string().min(20, 'Geçersiz token').max(200, 'Geçersiz token'),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

/**
 * Resend verification email.
 */
export const ResendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;

/**
 * Forgot password — request reset link.
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Reset password — submit new password using token.
 */
export const ResetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .max(100)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * 2FA login verification — TOTP code after password auth.
 */
export const TwoFactorLoginSchema = z.object({
  code: z
    .string()
    .regex(/^[0-9]{6}$/, '6 haneli kod girin'),
  backupCode: z.string().optional(),
});
export type TwoFactorLoginInput = z.infer<typeof TwoFactorLoginSchema>;

// === Onboarding step definitions (referenced by service + tests) ===

export const OnboardingStepIdSchema = z.enum(['welcome', 'profile', 'tour', 'complete']);
export type OnboardingStepId = z.infer<typeof OnboardingStepIdSchema>;

export const UserPersonaSchema = z.enum(['developer', 'designer', 'marketer', 'founder', 'other']);
export type UserPersona = z.infer<typeof UserPersonaSchema>;

export interface TourStep {
  target: string;
  title: string;
  description: string;
}

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  required: boolean;
  tourSteps?: TourStep[];
}

export const ONBOARDING_STEPS: ReadonlyArray<OnboardingStep> = [
  {
    id: 'welcome',
    title: 'Hoş Geldiniz!',
    description: 'Hızlı bir tur ile platformu tanıyalım.',
    required: false,
  },
  {
    id: 'profile',
    title: 'Profilini Tamamla',
    description: 'Rolünü ve hedeflerini seç — deneyimi sana göre ayarlayalım.',
    required: true,
  },
  {
    id: 'tour',
    title: 'Ürün Turu',
    description: 'Önemli sayfaları ve özellikleri hızlıca gezelim.',
    required: false,
    tourSteps: [
      { target: '#dashboard', title: 'Dashboard', description: 'Tüm metriklerinin özeti.' },
      { target: '#projects', title: 'Projeler', description: 'Aktif projelerini buradan yönet.' },
      { target: '#billing', title: 'Faturalandırma', description: 'Plan ve ödeme geçmişin.' },
    ],
  },
  {
    id: 'complete',
    title: 'Hazırsın!',
    description: 'Artık başlamak için her şey tamam.',
    required: false,
  },
];

export function getStepById(id: OnboardingStepId | string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.id === id);
}

export function getNextStep(id: OnboardingStepId | string): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.id === id);
  if (currentIndex === -1 || currentIndex === ONBOARDING_STEPS.length - 1) return null;
  return ONBOARDING_STEPS[currentIndex + 1] ?? null;
}

export function isValidPersona(value: unknown): value is UserPersona {
  return UserPersonaSchema.safeParse(value).success;
}