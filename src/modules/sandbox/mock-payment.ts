/**
 * @file Sandbox Mock Payment Gateway
 * @description D2: Gerçek iyzico/Stripe yerine sandbox'ta kullanılan mock gateway.
 *              Başarılı, başarısız, timeout gibi senaryolar simüle edilir.
 *              Production'da bu modül hiç import edilmemeli.
 */

import { logger } from "@/lib/logger";

export interface MockPaymentRequest {
  amount: number;
  currency: string;
  /** Test kartı son 4 hanesi — test senaryosu belirler */
  cardNumber?: string;
  customerEmail: string;
  orderId: string;
}

export interface MockPaymentResponse {
  success: boolean;
  transactionId: string;
  status: "approved" | "declined" | "timeout" | "error";
  message: string;
  amount: number;
  currency: string;
  timestamp: number;
  /** Test senaryosu bilgisi */
  scenario: string;
}

/**
 * Mock ödeme işlemi — senaryo test kartına göre belirlenir.
 *
 * Test kartları:
 * - 4242... → onaylandı
 * - 4000... → reddedildi
 * - 5000... → timeout
 * - 6000... → error
 */
export async function processMockPayment(
  req: MockPaymentRequest
): Promise<MockPaymentResponse> {
  const cardPrefix = req.cardNumber?.slice(0, 4) ?? "4242";

  // Simüle edilmiş işlem süresi
  await new Promise((r) => setTimeout(r, 100));

  const timestamp = Date.now();

  switch (cardPrefix) {
    case "4000":
      return {
        success: false,
        transactionId: `mock-declined-${timestamp}`,
        status: "declined",
        message: "Kart limiti yetersiz (mock)",
        amount: req.amount,
        currency: req.currency,
        timestamp,
        scenario: "card_declined",
      };

    case "5000":
      return {
        success: false,
        transactionId: `mock-timeout-${timestamp}`,
        status: "timeout",
        message: "Gateway timeout (mock)",
        amount: req.amount,
        currency: req.currency,
        timestamp,
        scenario: "gateway_timeout",
      };

    case "6000":
      return {
        success: false,
        transactionId: `mock-error-${timestamp}`,
        status: "error",
        message: "Sistem hatası (mock)",
        amount: req.amount,
        currency: req.currency,
        timestamp,
        scenario: "system_error",
      };

    case "4242":
    default:
      return {
        success: true,
        transactionId: `mock-success-${timestamp}`,
        status: "approved",
        message: "Ödeme başarılı (mock)",
        amount: req.amount,
        currency: req.currency,
        timestamp,
        scenario: "happy_path",
      };
  }
}

/**
 * Mock refund işlemi.
 */
export async function processMockRefund(
  transactionId: string,
  amount: number
): Promise<{ success: boolean; refundId: string; message: string }> {
  await new Promise((r) => setTimeout(r, 50));
  return {
    success: true,
    refundId: `mock-refund-${Date.now()}`,
    message: `İade başarılı (mock) — ${transactionId} için ${amount}`,
  };
}

/**
 * Test senaryolarını listele (admin UI için).
 */
export const MOCK_SCENARIOS = [
  { cardPrefix: "4242", name: "Happy Path", outcome: "approved" },
  { cardPrefix: "4000", name: "Card Declined", outcome: "declined" },
  { cardPrefix: "5000", name: "Gateway Timeout", outcome: "timeout" },
  { cardPrefix: "6000", name: "System Error", outcome: "error" },
] as const;

/**
 * Mock kullanım logla — debug için.
 */
export function logMockUsage(operation: string, payload: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    logger.debug(`[sandbox:mock-payment] ${operation}`, payload);
  }
}