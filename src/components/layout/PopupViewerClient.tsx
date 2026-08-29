"use client";

import dynamic from "next/dynamic";

/**
 * PopupViewer'ı istemci tarafında lazy-load eden Client Component wrapper'ı.
 *
 * Neden bu var?
 * - src/app/layout.tsx bir Server Component.
 * - `next/dynamic`'in `ssr: false` opsiyonu Server Component'lerde kullanılamaz.
 * - Bu yüzden dynamic import + ssr:false kombinasyonunu burada (client) tutuyoruz,
 *   layout ise sadece bu wrapper'ı kullanıyor.
 */
const PopupViewerClient = dynamic(
  () => import("@/components/PopupViewer"),
  { ssr: false }
);

export default PopupViewerClient;
