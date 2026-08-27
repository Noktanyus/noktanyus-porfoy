/**
 * Commerce Module — Type Definitions
 */

export interface CartItem {
  productId: string;
  quantity: number;
  priceCents: number;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

export interface LicenseActivationInput {
  domain: string;
  ip: string;
}