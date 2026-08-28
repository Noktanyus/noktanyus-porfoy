/**
 * @file useOnboardingState — çok adımlı onboarding akışı için localStorage-tabanlı state hook'u.
 * @description
 *   Adım ilerlemesi, atla/tamamla aksiyonları ve progress yüzdesi bu hook üzerinden yönetilir.
 *   SSR güvenli: window yoksa no-op döner, hydration uyumsuzluğu yaşanmaz.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'onboarding-flow-v1';

export type OnboardingStepId =
  | 'welcome'
  | 'profile'
  | 'monitor'
  | 'apiKey'
  | 'store'
  | 'done';

export interface OnboardingFlowState {
  step: OnboardingStepId;
  completed: boolean;
  skipped: boolean;
}

const STEPS: OnboardingStepId[] = [
  'welcome',
  'profile',
  'monitor',
  'apiKey',
  'store',
  'done',
];

const DEFAULT_STATE: OnboardingFlowState = {
  step: 'welcome',
  completed: false,
  skipped: false,
};

function readState(): OnboardingFlowState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingFlowState>;
    if (!STEPS.includes(parsed.step as OnboardingStepId)) {
      return DEFAULT_STATE;
    }
    return {
      step: parsed.step as OnboardingStepId,
      completed: Boolean(parsed.completed),
      skipped: Boolean(parsed.skipped),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(next: OnboardingFlowState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore (private mode)
  }
}

export interface UseOnboardingState {
  state: OnboardingFlowState;
  /** Açılır mı? (completed/skipped ise false) */
  isOpen: boolean;
  /** İlk mount'ta initialised mi? */
  hydrated: boolean;
  /** 0..100 yüzde */
  progress: number;
  setStep: (step: OnboardingStepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  skip: () => void;
  complete: () => void;
  reset: () => void;
}

export function useOnboardingState(): UseOnboardingState {
  const [state, setState] = useState<OnboardingFlowState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readState());
    setHydrated(true);
  }, []);

  const setStep = useCallback((step: OnboardingStepId) => {
    setState((prev) => {
      const next = { ...prev, step };
      writeState(next);
      return next;
    });
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const idx = STEPS.indexOf(prev.step);
      const nextIdx = Math.min(idx + 1, STEPS.length - 1);
      const next: OnboardingFlowState =
        nextIdx === STEPS.length - 1
          ? { step: STEPS[nextIdx], completed: true, skipped: prev.skipped }
          : { ...prev, step: STEPS[nextIdx] };
      writeState(next);
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      const idx = STEPS.indexOf(prev.step);
      const prevIdx = Math.max(idx - 1, 0);
      const next: OnboardingFlowState = { ...prev, step: STEPS[prevIdx] };
      writeState(next);
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, skipped: true };
      writeState(next);
      return next;
    });
  }, []);

  const complete = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, completed: true };
      writeState(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(() => {
      writeState(DEFAULT_STATE);
      return DEFAULT_STATE;
    });
  }, []);

  const stepIndex = STEPS.indexOf(state.step);
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);
  const isOpen = hydrated && !state.completed && !state.skipped;

  return {
    state,
    isOpen,
    hydrated,
    progress,
    setStep,
    nextStep,
    prevStep,
    skip,
    complete,
    reset,
  };
}

export const ONBOARDING_STEPS = STEPS;
