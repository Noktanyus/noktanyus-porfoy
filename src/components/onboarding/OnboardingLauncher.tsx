/**
 * OnboardingLauncher — dashboard'daki "Onboarding'a başla" butonu.
 * Manuel olarak turu yeniden başlatmak için kullanılır.
 * useOnboardingState.reset() tetikler.
 */

'use client';

import { useEffect, useState } from 'react';
import { FaPlay, FaTimes } from 'react-icons/fa';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { OnboardingFlow } from './OnboardingFlow';

export function OnboardingLauncher() {
  const [openFlow, setOpenFlow] = useState(false);
  const { reset } = useOnboardingState();
  // sadece client'ta render (hydration uyumu için)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleStart = () => {
    reset();
    setOpenFlow(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleStart}
        className="admin-btn admin-btn-outline flex items-center gap-2"
        aria-label="Onboarding turunu başlat"
      >
        <FaPlay className="w-3 h-3" />
        <span>Onboarding Turu</span>
      </button>

      {openFlow && (
        <button
          type="button"
          onClick={() => setOpenFlow(false)}
          className="fixed top-4 right-4 z-50 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
          aria-label="Flow'u kapat"
        >
          <FaTimes />
        </button>
      )}

      {openFlow && <OnboardingFlow />}
    </>
  );
}

export default OnboardingLauncher;
