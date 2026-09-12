/**
 * @file Admin kök route — /admin → /admin/dashboard yönlendirmesi.
 * @description Next.js'te (protected) ve (public) parantezli route group'ları
 *              URL'de gözükmez. Bu yüzden /admin URL'i için ayrı bir page.tsx
 *              gerekiyor; aksi halde Next.js "404 — bu sayfa bulunamadı" döner.
 *
 *              Akış:
 *              1. Server-side `redirect()` 307 ile /admin/dashboard'a yönlendirir.
 *              2. (protected)/layout.tsx useEffect ile session kontrol eder.
 *              3. Session yoksa /giris'e push eder.
 *
 *              Neden server-side redirect?
 *              - Daha hızlı (client JS yüklenmeden 307 döner).
 *              - Middleware auth kontrolü eklemek için ayrı bir config gerekir;
 *                bu yaklaşım tek dosyada çözüm sunar.
 */

import { redirect } from "next/navigation";

export default function AdminIndexPage(): never {
  redirect("/admin/dashboard");
}
