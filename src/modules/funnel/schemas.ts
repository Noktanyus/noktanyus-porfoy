/**
 * @file Funnel Schemas & Event Types
 * @description G2: Funnel (huni) analitiği için veri yapıları.
 *
 *              Kullanıcı yolculuğunu event'ler ile takip eder.
 *              Her event bir step'te gerçekleşir. Funnel'i visualize etmek için
 *              step'ler arası dönüşüm oranlarını hesaplarız.
 *
 *              Standart funnel: visit → signup → checkout → paid
 *              Plus: trial_start, activation, churn_signal
 */

export type FunnelEventName =
  | "visit"
  | "signup_start"
  | "signup_complete"
  | "checkout_start"
  | "checkout_complete"
  | "paid"
  | "trial_start"
  | "activation"
  | "churn_signal"
  | "custom";

export interface FunnelEvent {
  name: FunnelEventName | string;
  /** Kullanıcı veya anonim ID */
  userId: string | null;
  sessionId: string;
  timestamp: number; // ms epoch
  /** Ek metadata (kaynak, A/B varyantı, vb.) */
  metadata?: Record<string, unknown>;
}

export interface FunnelStep {
  id: string;
  name: string;
  eventName: FunnelEventName | string;
  /** Bir sonraki step'e geçiş için event bekleniyor mu? */
  expectedEventName?: FunnelEventName | string;
}

export interface FunnelStepResult {
  stepId: string;
  stepName: string;
  /** Bu step'e ulaşan unique kullanıcı/session sayısı */
  reached: number;
  /** Önceki step'ten bu step'e geçen sayı */
  converted: number;
  /** Önceki step'ten dönüşüm oranı (%) */
  conversionRate: number;
  /** İlk step'ten bu step'e kümülatif dönüşüm (%) */
  cumulativeRate: number;
  /** Bu step'te takılan kullanıcı sayısı (drop-off) */
  dropped: number;
}

export interface FunnelReport {
  steps: FunnelStepResult[];
  totalEntered: number;
  totalCompleted: number;
  overallConversion: number; // %
  /** En büyük drop-off'un olduğu step (iyileştirme fırsatı) */
  biggestDropoff: { stepId: string; dropoffPercent: number } | null;
  /** Zaman aralığı */
  rangeStart: number;
  rangeEnd: number;
}

/**
 * Default funnel — standart SaaS dönüşüm hunisi.
 */
export const DEFAULT_FUNNEL: ReadonlyArray<FunnelStep> = [
  { id: "visit", name: "Ziyaret", eventName: "visit" },
  { id: "signup", name: "Kayıt", eventName: "signup_complete" },
  { id: "checkout", name: "Ödeme Başlat", eventName: "checkout_start" },
  { id: "paid", name: "Ödeme Tamamlandı", eventName: "paid" },
] as const;

/**
 * E-commerce funnel.
 */
export const ECOMMERCE_FUNNEL: ReadonlyArray<FunnelStep> = [
  { id: "visit", name: "Ziyaret", eventName: "visit" },
  { id: "product_view", name: "Ürün Görüntüle", eventName: "product_view" },
  { id: "add_to_cart", name: "Sepete Ekle", eventName: "add_to_cart" },
  { id: "checkout", name: "Ödeme Başlat", eventName: "checkout_start" },
  { id: "paid", name: "Ödeme Tamamlandı", eventName: "paid" },
] as const;