/**
 * @file Onboarding Service
 * @description Kullanıcının onboarding ilerlemesini DB'de yönetir.
 *              Schema: OnboardingProgress { id, userId, currentStep,
 *              completedSteps, persona, skipped, startedAt, completedAt }
 */

import { prisma } from "@/lib/prisma";
import {
  type OnboardingState,
  type OnboardingStepId,
  type UserPersona,
  type OnboardingProgress,
  isValidPersona,
  getStepById,
  getNextStep,
} from "./schemas";

export const onboardingService = {
  /**
   * Kullanıcının onboarding durumunu getirir. Yoksa yeni oluşturur.
   */
  async getOrCreate(userId: string): Promise<OnboardingProgress> {
    const existing = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        currentStep: existing.currentStep as OnboardingStepId,
        completedSteps: existing.completedSteps as OnboardingStepId[],
        persona: isValidPersona(existing.persona) ? existing.persona : null,
        skipped: existing.skipped,
        startedAt: existing.startedAt,
        completedAt: existing.completedAt,
        updatedAt: existing.updatedAt,
      };
    }

    const created = await prisma.onboardingProgress.create({
      data: {
        userId,
        currentStep: "welcome",
        completedSteps: [],
        persona: null,
        skipped: false,
        startedAt: new Date(),
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      currentStep: "welcome",
      completedSteps: [],
      persona: null,
      skipped: false,
      startedAt: created.startedAt,
      completedAt: null,
      updatedAt: created.updatedAt,
    };
  },

  /**
   * Bir step'i tamamlandı olarak işaretle, sonrakine geç.
   * required:true olan step'leri skip edemez.
   */
  async advance(
    userId: string,
    completedStepId: OnboardingStepId
  ): Promise<OnboardingProgress> {
    const state = await this.getOrCreate(userId);
    const completed = Array.from(new Set([...state.completedSteps, completedStepId]));

    const nextStep = getNextStep(completedStepId);
    const nextStepId = nextStep?.id ?? "complete";

    const updates: Partial<OnboardingState> = {
      completedSteps: completed,
      currentStep: nextStepId,
    };

    // Eğer "complete" step'ine geldiyse, completedAt set et
    if (nextStepId === "complete" && !state.completedAt) {
      updates.completedAt = new Date();
    }

    const updated = await prisma.onboardingProgress.update({
      where: { userId },
      data: updates,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      currentStep: updated.currentStep as OnboardingStepId,
      completedSteps: updated.completedSteps as OnboardingStepId[],
      persona: isValidPersona(updated.persona) ? updated.persona : null,
      skipped: updated.skipped,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt,
      updatedAt: updated.updatedAt,
    };
  },

  /**
   * Tüm onboarding'i skip et.
   */
  async skip(userId: string): Promise<OnboardingProgress> {
    const updated = await prisma.onboardingProgress.update({
      where: { userId },
      data: {
        skipped: true,
        completedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      currentStep: "complete",
      completedSteps: [],
      persona: isValidPersona(updated.persona) ? updated.persona : null,
      skipped: true,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt,
      updatedAt: updated.updatedAt,
    };
  },

  /**
   * Kullanıcının persona'sını kaydet.
   */
  async setPersona(
    userId: string,
    persona: UserPersona
  ): Promise<OnboardingProgress> {
    const updated = await prisma.onboardingProgress.update({
      where: { userId },
      data: { persona },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      currentStep: updated.currentStep as OnboardingStepId,
      completedSteps: updated.completedSteps as OnboardingStepId[],
      persona,
      skipped: updated.skipped,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt,
      updatedAt: updated.updatedAt,
    };
  },

  /**
   * Onboarding tamamlanmış mı kontrol et.
   */
  async isCompleted(userId: string): Promise<boolean> {
    const state = await prisma.onboardingProgress.findUnique({
      where: { userId },
      select: { completedAt: true, skipped: true },
    });
    return state?.completedAt !== null || state?.skipped === true;
  },

  /**
   * Progress yüzdesini hesapla.
   */
  async getProgressPercent(userId: string): Promise<number> {
    const state = await this.getOrCreate(userId);
    const totalSteps = 4; // welcome, profile, tour, complete
    const completed = state.completedSteps.length;
    return Math.round((completed / totalSteps) * 100);
  },

  /**
   * Geçerli step'in meta bilgilerini döner.
   */
  async getCurrentStepMeta(userId: string) {
    const state = await this.getOrCreate(userId);
    const step = getStepById(state.currentStep);
    return {
      step,
      progressPercent: Math.round(
        (state.completedSteps.length / 4) * 100
      ),
      totalSteps: 4,
      completedCount: state.completedSteps.length,
    };
  },

  /**
   * Test/development için: kullanıcının onboarding state'ini sıfırla.
   */
  async reset(userId: string): Promise<OnboardingProgress> {
    await prisma.onboardingProgress.deleteMany({ where: { userId } });
    return this.getOrCreate(userId);
  },
};