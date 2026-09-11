/**
 * Eski /admin/login — ortak /giris akışına yönlendirir.
 * Ayrı yönetici login sayfası yoktur.
 */

import { redirect } from 'next/navigation';

export default function AdminLoginRedirectPage() {
  redirect('/giris?callbackUrl=%2Fadmin%2Fdashboard');
}
