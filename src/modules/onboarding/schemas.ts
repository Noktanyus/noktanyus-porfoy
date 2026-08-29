/**
 * @file Onboarding Schemas & Types
 * @description F3: Onboarding akışı için veri yapıları.
 *
 *              Onboarding akışı 4 ana adımdan oluşur:
 *              1. Welcome — kullanıcıyı karşıla
 *              2. Profile — kullanıcı tipi/amacı tespit et
 *              3. Tour — ürün özelliklerini gezdir
 *              4. Done — tamamlandı, dashboard'a yönlendir
 *
 *              Her step bir Step objesi ile temsil edilir.
 *              Tüm step'ler DB'de (OnboardingProgress) saklanır.
 */

export type OnboardingStepId =
  | "welcome"
  | "profile"
  | "tour"
  | "complete";

export type UserPersona =
  | "developer"
  | "designer"
  | "marketer"
  | "founder"
  | "other";

export type TourTargetId =
  | "dashboard"
  | "orders"
  | "products"
  | "customers"
  | "analytics"
  | "settings";

export interface TourStep {
  target: TourTargetId;
  title: string;
  description: string;
  /** data-* selector — spotlight için hedef */
  selector?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  /** Bu step için gereken aksiyon. Boşsa "skip" yapılabilir. */
  required: boolean;
  /** Tour step'leri (sadece "tour" step'inde kullanılır) */
  tourSteps?: TourStep[];
}

export interface OnboardingState {
  userId: string;
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  persona: UserPersona | null;
  skipped: boolean;
  startedAt: Date;
  completedAt: Date | null;
}

export interface OnboardingProgress extends OnboardingState {
  id: string;
  updatedAt: Date;
}

/**
 * Tüm onboarding step tanımları.
 */
export const ONBOARDING_STEPS: ReadonlyArray<OnboardingStep> = [
  {
    id: "welcome",
    title: "Hoş Geldiniz!",
    description:
      "Noktanyus portföy yönetim sistemine hoş geldiniz. Birkaç kısa adımda sizi tanıyalım ve sistemi keşfetmenize yardımcı olalım.",
    required: false,
  },
  {
    id: "profile",
    title: "Sizi Tanıyalım",
    description:
      "Size daha iyi bir deneyim sunabilmek için hangi rolde olduğunuzu öğrenmek isteriz.",
    required: true,
  },
  {
    id: "tour",
    title: "Sistem Turu",
    description:
      "Ana özellikleri kısaca gezelim. İstediğiniz zaman atlayabilirsiniz.",
    required: false,
    tourSteps: [
      {
        target: "dashboard",
        title: "Dashboard",
        description: "Tüm metriklerin tek bakışta özeti.",
        placement: "bottom",
      },
      {
        target: "orders",
        title: "Siparişler",
        description: "Gelen siparişleri yönetin, durumlarını güncelleyin.",
        placement: "right",
      },
      {
        target: "products",
        title: "Ürünler",
        description: "Ürün kataloğunuzu oluşturun ve düzenleyin.",
        placement: "right",
      },
      {
        target: "analytics",
        title: "Analitik",
        description: "Detaylı istatistikler ve raporlar.",
        placement: "left",
      },
    ],
  },
  {
    id: "complete",
    title: "Hazırsınız!",
    description:
      "Tüm adımları tamamladınız. Artık sistemi keşfetmeye başlayabilirsiniz.",
    required: false,
  },
] as const;

export function getStepById(id: OnboardingStepId): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.id === id);
}

export function getNextStep(id: OnboardingStepId): OnboardingStep | null {
  const idx = ONBOARDING_STEPS.findIndex((s) => s.id === id);
  if (idx === -1 || idx === ONBOARDING_STEPS.length - 1) return null;
  return ONBOARDING_STEPS[idx + 1] ?? null;
}

export function isValidPersona(value: unknown): value is UserPersona {
  return (
    typeof value === "string" &&
    ["developer", "designer", "marketer", "founder", "other"].includes(value)
  );
}