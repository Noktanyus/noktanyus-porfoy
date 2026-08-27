'use client';

/**
 * OnboardingTour — Yeni kullanıcılar için 4 adımlı hızlı tur.
 *
 * localStorage'a "onboarding-completed" anahtarını yazarak bir kez gösterilir.
 * Kullanıcı turları kapatabilir veya adımları geçebilir.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowRight, FaTimes } from 'react-icons/fa';

interface Step {
  title: string;
  description: string;
  href: string;
  cta: string;
}

const STORAGE_KEY = 'onboarding-completed';

const STEPS: Step[] = [
  {
    title: 'Hoş geldin!',
    description: 'Bu hızlı tur ile platformu tanıyalım. Birkaç adımda en önemli yerleri göstereceğim.',
    href: '/dashboard',
    cta: 'Başla',
  },
  {
    title: 'İlk Monitörünü Oluştur',
    description: 'Web siteni veya API\'ni izlemeye başla. Her 60 saniyede sağlık kontrolü yapılır.',
    href: '/dashboard/monitors/new',
    cta: 'Monitör Ekle',
  },
  {
    title: 'API Anahtarı Oluştur',
    description: 'Programatik erişim için API key oluştur. Rate limit ve scope\'lar tamamen sana ait.',
    href: '/dashboard/api-keys/new',
    cta: 'API Key Oluştur',
  },
  {
    title: 'Mağazayı Keşfet',
    description: 'Dijital ürünler ve abonelik planları burada. İhtiyacına göre yükseltme yapabilirsin.',
    href: '/magaza',
    cta: 'Mağazaya Git',
  },
];

export function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const completed = window.localStorage.getItem(STORAGE_KEY);
      if (completed) return;
    } catch {
      // ignore (private mode)
    }
    // İlk dashboard girişinden ~600ms sonra göster (layout oturmuş olsun)
    const t = window.setTimeout(() => setShow(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const finish = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show || step >= STEPS.length) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      const nextHref = STEPS[step + 1].href;
      setStep(step + 1);
      router.push(current.href);
      // bir frame sonra bir sonraki step'e yönlendir (UI mount olsun)
      setTimeout(() => {
        try {
          window.history.pushState({}, '', nextHref);
        } catch {
          // ignore
        }
      }, 50);
    }
  };

  const handleSkip = () => {
    finish();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleSkip}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="glass-card-premium p-8 max-w-md w-full mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">
            Adım {step + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Onboarding'i atla"
          >
            <FaTimes />
          </button>
        </div>

        <h2 id="onboarding-title" className="text-2xl font-bold mb-2">
          {current.title}
        </h2>
        <p className="text-muted-foreground mb-6">{current.description}</p>

        <div className="flex gap-2 mb-6">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded transition-colors ${
                idx <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="admin-btn admin-btn-primary w-full"
        >
          {current.cta} <FaArrowRight className="ml-2 inline" />
        </button>
      </div>
    </div>
  );
}

export default OnboardingTour;
