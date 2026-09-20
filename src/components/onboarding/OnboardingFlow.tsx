/**
 * OnboardingFlow — profil → API anahtarı → mağaza.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useOnboardingState, ONBOARDING_STEPS } from '@/hooks/useOnboardingState';
import ProfileSetupStep from './steps/ProfileSetupStep';
import ApiKeyStep from './steps/ApiKeyStep';
import StoreStep from './steps/StoreStep';

const STEP_LABELS: Record<string, { title: string; desc: string }> = {
  welcome: {
    title: 'Hoş geldin!',
    desc: 'Hesabını kur, API anahtarını al ve mağazadan ürün veya plan seç.',
  },
  profile: {
    title: 'Profilini kur',
    desc: 'Adın dashboardda görünecek.',
  },
  apiKey: {
    title: 'API anahtarı oluştur',
    desc: 'Hizmetlere programatik erişim için anahtar üret.',
  },
  store: {
    title: 'Mağazayı keşfet',
    desc: 'Hazır paketler veya aylık API / hizmet planları.',
  },
  done: {
    title: 'Hazırsın!',
    desc: 'Siparişlerin ve API anahtarların Hesabım panelinde.',
  },
};

export function OnboardingFlow() {
  const { isOpen, hydrated, progress, state, nextStep, prevStep, skip, complete } =
    useOnboardingState();
  const [show, setShow] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    if (!hydrated || !isOpen || isAdmin) {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(true), 600);
    return () => window.clearTimeout(t);
  }, [hydrated, isOpen, isAdmin]);

  const handleClose = () => {
    skip();
    setShow(false);
    toast('Kurulum atlandı. İstediğin zaman Ayarlar’dan devam edebilirsin.', {
      icon: 'ℹ️',
    });
  };

  const handleComplete = () => {
    complete();
    setShow(false);
    toast.success('Kurulum tamamlandı.');
  };

  if (!hydrated || !show || !isOpen || isAdmin) return null;

  const currentStep = state.step;
  const labels = STEP_LABELS[currentStep];
  const stepIdx = ONBOARDING_STEPS.indexOf(currentStep);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="glass-card-premium p-6 sm:p-8 max-w-md w-full mx-4 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            Adım {stepIdx + 1} / {ONBOARDING_STEPS.length}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Kurulumu atla"
          >
            <FaTimes />
          </button>
        </div>

        <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold mb-2">
          {labels.title}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">{labels.desc}</p>

        <div className="h-1 w-full bg-muted rounded mb-5 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            aria-label={`İlerleme ${progress}%`}
          />
        </div>

        {currentStep === 'welcome' && (
          <div className="flex gap-2">
            <button type="button" onClick={handleClose} className="flex-1 admin-btn admin-btn-outline">
              Atla
            </button>
            <button
              type="button"
              onClick={() => nextStep()}
              className="flex-1 admin-btn admin-btn-primary"
            >
              Başla
            </button>
          </div>
        )}

        {currentStep === 'profile' && (
          <ProfileSetupStep
            initialName={session?.user?.name ?? ''}
            initialImage={session?.user?.image ?? null}
            onNext={() => nextStep()}
            onSkip={handleClose}
          />
        )}

        {currentStep === 'apiKey' && (
          <ApiKeyStep onNext={() => nextStep()} onSkip={handleClose} />
        )}

        {currentStep === 'store' && (
          <StoreStep onNext={handleComplete} onSkip={handleClose} />
        )}

        {currentStep === 'done' && (
          <div className="text-center py-6 space-y-4">
            <FaCheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <p className="text-sm text-muted-foreground">Hesabına yönlendiriliyorsun...</p>
            <button
              type="button"
              onClick={() => {
                handleComplete();
                router.push('/dashboard');
              }}
              className="admin-btn admin-btn-primary"
            >
              Panele Git
            </button>
          </div>
        )}

        {currentStep !== 'welcome' && currentStep !== 'done' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={prevStep}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Geri
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingFlow;
