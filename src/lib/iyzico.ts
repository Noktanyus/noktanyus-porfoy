/**
 * iyzico (iyzipay) Server SDK Configuration
 *
 * Türk ödeme sağlayıcısı için server-side wrapper.
 * Lazy initialization: SDK sadece ilk kullanımda (ve tüm env varsa) init edilir.
 * Build sırasında hiçbir istek atılmaz, eksik env'de hata fırlatmaz.
 *
 * NOT: Bu dosya SADECE server-side API route'lardan veya Server Component'lerden
 * import edilmelidir. Client componentlerden import ETME — iyzico (iyzipay) Node-only
 * paketleri (fs, http) kullanır ve client bundle'da patlar.
 *
 * İyzico çağrıları /api/checkout/* endpoint'leri üzerinden yapılmalıdır.
 */

// @ts-expect-error - iyzipay has no official types; community types are incomplete
import Iyzipay from 'iyzipay';

interface IyzicoClient {
  checkoutFormInitialize: {
    create: (params: Record<string, unknown>, cb: (err: unknown, result: unknown) => void) => void;
  };
  checkoutForm: {
    retrieve: (params: Record<string, unknown>, cb: (err: unknown, result: unknown) => void) => void;
  };
}

let _iyzicoInstance: IyzicoClient | null = null;

export function isIyzicoConfigured(): boolean {
  return Boolean(
    process.env.IYZICO_API_KEY &&
      process.env.IYZICO_SECRET_KEY &&
      process.env.IYZICO_URI
  );
}

export function getIyzico(): IyzicoClient {
  if (!isIyzicoConfigured()) {
    throw new Error(
      '[iyzico] IYZICO_API_KEY / IYZICO_SECRET_KEY / IYZICO_URI gerekli — isIyzicoConfigured() ile kontrol et'
    );
  }
  if (!_iyzicoInstance) {
    _iyzicoInstance = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_URI,
    }) as IyzicoClient;
  }
  return _iyzicoInstance;
}

/** Test amaçlı (singleton reset) — production'da kullanılmamalı */
export function __resetIyzicoForTests() {
  _iyzicoInstance = null;
}

// --- Types ---

export interface IyzicoBasketItem {
  id: string;
  name: string;
  category: string;
  itemType?: 'PHYSICAL' | 'VIRTUAL';
  price: string; // "100.00"
}

export interface IyzicoBuyer {
  id: string;
  name: string;
  surname: string;
  gsmNumber: string;
  email: string;
  identityNumber: string;
  registrationAddress: string;
  ip: string;
  city: string;
  country: string;
  zipCode: string;
}

export interface IyzicoAddress {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
}

export interface IyzicoCheckoutInput {
  items: IyzicoBasketItem[];
  totalPrice: string;
  paidPrice?: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerIp?: string;
  billingAddress?: IyzicoAddress;
  shippingAddress?: IyzicoAddress;
  callbackUrl: string;
  currency?: 'TRY' | 'USD' | 'EUR' | 'GBP';
  basketId?: string;
  conversationId?: string;
}

export interface IyzicoCheckoutSuccess {
  status: 'success';
  token: string;
  paymentPageUrl: string;
}

export interface IyzicoCheckoutFailure {
  status: 'failure';
  errorCode?: string;
  errorMessage?: string;
}

export type IyzicoCheckoutResult = IyzicoCheckoutSuccess | IyzicoCheckoutFailure;

export interface IyzicoRetrieveSuccess {
  status: 'success';
  paymentStatus: 'SUCCESS' | 'FAILURE';
  token: string;
  basketId?: string;
  paidPrice?: string;
  price?: string;
  currency?: string;
  itemTransactions?: Array<{
    itemId: string;
    paymentTransactionId: string;
    transactionStatus: number;
    price: string;
    paidPrice: string;
  }>;
  [key: string]: unknown;
}

export interface IyzicoRetrieveFailure {
  status: 'failure';
  errorCode?: string;
  errorMessage?: string;
}

export type IyzicoRetrieveResult = IyzicoRetrieveSuccess | IyzicoRetrieveFailure;