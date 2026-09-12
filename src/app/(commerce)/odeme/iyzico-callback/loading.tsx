/**
 * @file /odeme/iyzico-callback — yükleniyor durumu.
 *
 * Bu route yalnızca `resolveIyzicoCallback` sonucuna göre `redirect()` yapar;
 * kendi UI'ı yoktur. Doğrulama isteği sürerken kullanıcı önceden BOŞ bir ekran
 * görüyordu ve ödemenin akıbetini bilemiyordu.
 *
 * Bu loading sınırı, doğrulama sürerken açık bir "ödeme doğrulanıyor" mesajı
 * gösterir. Callback mantığına ve yönlendirme davranışına DOKUNULMAZ.
 */

import { SpinnerLoading } from '@/components/ui/LoadingSkeleton';

export default function IyzicoCallbackLoading() {
  return (
    <div className="container-responsive">
      <div className="space-responsive">
        <SpinnerLoading text="Ödemeniz doğrulanıyor, lütfen bu sayfayı kapatmayın..." />
      </div>
    </div>
  );
}
