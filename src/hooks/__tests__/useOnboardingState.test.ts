/**
 * useOnboardingState — localStorage-tabanlı çok adımlı onboarding state hook'u için unit testler.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboardingState, ONBOARDING_STEPS } from '../useOnboardingState';

const STORAGE_KEY = 'onboarding-flow-v1';

describe('useOnboardingState', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default state initially (not hydrated yet)', () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.state.step).toBe('welcome');
    expect(result.current.state.completed).toBe(false);
    expect(result.current.state.skipped).toBe(false);
    // hydration effect henüz çalışmamış olabilir
    expect(typeof result.current.hydrated).toBe('boolean');
  });

  it('hydrates state from localStorage and exposes progress', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ step: 'profile', completed: false, skipped: false })
    );
    const { result } = renderHook(() => useOnboardingState());

    // hydrate edildikten sonra
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(result.current.state.step).toBe('profile');
        expect(result.current.progress).toBeGreaterThan(0);
        expect(result.current.progress).toBeLessThanOrEqual(100);
        resolve();
      }, 10);
    });
  });

  it('nextStep advances to the next step', () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => result.current.nextStep());
    expect(result.current.state.step).toBe(ONBOARDING_STEPS[1]);
  });

  it('nextStep marks completed when reaching final step', () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => {
      // welcome → done (5 ileri)
      for (let i = 0; i < 5; i++) result.current.nextStep();
    });
    expect(result.current.state.step).toBe('done');
    expect(result.current.state.completed).toBe(true);
    expect(result.current.isOpen).toBe(false);
  });

  it('prevStep moves to the previous step', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ step: 'monitor', completed: false, skipped: false })
    );
    const { result } = renderHook(() => useOnboardingState());
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        act(() => result.current.prevStep());
        expect(result.current.state.step).toBe('profile');
        resolve();
      }, 10);
    });
  });

  it('skip sets skipped flag and closes the flow', () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => result.current.skip());
    expect(result.current.state.skipped).toBe(true);
    expect(result.current.isOpen).toBe(false);
  });

  it('complete sets completed flag and closes the flow', () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => result.current.complete());
    expect(result.current.state.completed).toBe(true);
    expect(result.current.isOpen).toBe(false);
  });

  it('reset restores default state', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ step: 'done', completed: true, skipped: true })
    );
    const { result } = renderHook(() => useOnboardingState());
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        act(() => result.current.reset());
        expect(result.current.state.step).toBe('welcome');
        expect(result.current.state.completed).toBe(false);
        expect(result.current.state.skipped).toBe(false);
        resolve();
      }, 10);
    });
  });

  it('handles corrupt localStorage gracefully (no throw)', () => {
    window.localStorage.setItem(STORAGE_KEY, '{invalid-json');
    expect(() => renderHook(() => useOnboardingState())).not.toThrow();
  });
});
