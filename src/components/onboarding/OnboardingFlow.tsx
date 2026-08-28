/**
 * OnboardingFlow — mevcut OnboardingTour yerine gelen çok adımlı (step wizard)
 * onboarding akışı. Profile → Monitor → API Key → Store adımlarını entegre eder.
 *
 *   - SSR güvenli (localStorage erişimi sadece client-side useEffect'te)
 *   - İlk dashboard girişinden ~600ms sonra otomatik görünür
 *   - Skip/Complete localStorage'a yazılır, bir daha gösterilmez
 *   - Progress bar ve adım göstergesi ile kullanıcı yönlendirilir
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useOnboardingState, ONBOARDING_STEPS } from '@/hooks/useOnboardingState';
import ProfileSetupStep from './steps/ProfileSetupStep';
import FirstMonitorStep from './steps/FirstMonitorStep';
import ApiKeyStep from './steps/ApiKeyStep';
import StoreStep from './steps/StoreStep';

const STEP_LABELS: Record<string, { title: string; desc: string }> = {
  welcome: {
    title: 'Hoş geldin!',
    desc: 'Hızlı bir turla platformu tanıyalım. İhtiyacın olan her şeyi 5 dakikada kur.',
  },
  profile: {
    title: 'Profilini kur',
    desc: 'Adın ve avatarın dashboardda görünecek.',
  },
  monitor: {
    title: 'İlk monitörünü oluştur',
    desc: 'Web siteni veya API\'ni izlemeye başla. Her 60 saniyede sağlık kontrolü yapılır.',
  },
  apiKey: {
    title: 'İlk API anahtarını oluştur',
    desc: 'Programatik erişim için anahtar üret. Rate limit ve scope\'lar sana ait.',
  },
  store: {
    title: 'Mağazayı keşfet',
    desc: 'Dijital ürünler ve abonelik planları burada.',
  },
  done: {
    title: 'Hazırsın!',
    desc: 'Tüm temel ayarlar tamam. İyi çalışmalar.',
  },
};

export function OnboardingFlow() {
  const { isOpen, hydrated, progress, state, nextStep, prevStep, skip, complete } =
    useOnboardingState();
  const [show, setShow] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!hydrated || !isOpen) {
      setShow(false);
      return;
    }
    // İlk dashboard girişinden ~600ms sonra göster
    const t = window.setTimeout(() => setShow(true), 600);
    return () => window.clearTimeout(t);
  }, [hydrated, isOpen]);

  const handleClose = () => {
    skip();
    setShow(false);
    toast('Onboarding atlandı. İstediğin zaman ayarlardan yeniden başlatabilirsin.', {
      icon: 'ℹ️',
    });
  };

  const handleComplete = () => {
    complete();
    setShow(false);
    toast.success('Tebrikler! Onboarding tamamlandı.');
  };

  const handleStepNext = (next?: () => void) => {
    if (next) next();
    nextStep();
  };

  if (!hydrated || !show || !isOpen) return null;

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
            aria-label="Onboarding'i atla"
          >
            <FaTimes />
          </button>
        </div>

        <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold mb-2">
          {labels.title}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">{labels.desc}</p>

        {/* Progress bar */}
        <div className="h-1 w-full bg-muted rounded mb-5 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            aria-label={`İlerleme ${progress}%`}
          />
        </div>

        {/* Step content */}
        {currentStep === 'welcome' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 admin-btn admin-btn-outline"
            >
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

        {currentStep === 'monitor' && (
          <FirstMonitorStep onNext={() => nextStep()} onSkip={handleClose} />
        )}

        {currentStep === 'apiKey' && (
          <ApiKeyStep onNext={() => nextStep()} onSkip={handleClose} />
        )}

        {currentStep === 'store' && (
          <StoreStep
            onNext={handleComplete}
            onSkip={handleClose}
          />
        )}

        {currentStep === 'done' && (
          <div className="text-center py-6 space-y-4">
            <FaCheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <p className="text-sm text-muted-foreground">
              Dashboard'a yönlendiriliyorsun...
            </p>
            <button
              type="button"
              onClick={() => {
                handleComplete();
                router.push('/dashboard');
              }}
              className="admin-btn admin-btn-primary"
            >
              Dashboard'a Git
            </button>
          </div>
        )}

        {/* Back button — welcome ve done hariç */}
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
