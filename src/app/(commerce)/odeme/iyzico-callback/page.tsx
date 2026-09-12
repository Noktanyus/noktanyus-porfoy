/**
 * iyzico Checkout Callback
 *
 * iyzico ödeme sonrası kullanıcıyı bu sayfaya yönlendirir. Tüm karar mantığı
 * `resolveIyzicoCallback` içinde (test edilebilir olması için); burada yalnızca
 * yönlendirme yapılır.
 *
 * ÖNEMLİ: `redirect()` bir hata fırlatır (NEXT_REDIRECT). Bu yüzden try/catch
 * İÇİNDE ÇAĞRILMAMALIDIR — aksi halde başarılı akış hata gibi yakalanır.
 */

import { redirect } from 'next/navigation';
import { resolveIyzicoCallback } from '@/modules/commerce/iyzicoCallback';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { token?: string; status?: string };
}

export default async function IyzicoCallbackPage({ searchParams }: PageProps) {
  const { redirectTo } = await resolveIyzicoCallback(searchParams.token);
  redirect(redirectTo);
}
