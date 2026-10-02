import { redirect } from 'next/navigation';

/**
 * Eski /dashboard/purchases linklerini doğrudan /dashboard/products sayfasına yönlendirir.
 */
export default function PurchasesRedirectPage() {
  redirect('/dashboard/products');
}
