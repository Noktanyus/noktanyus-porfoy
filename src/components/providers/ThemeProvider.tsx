/**
 * @file Uygulamanın tema (açık/koyu mod) sağlayıcısı.
 * @description Bu bileşen, `next-themes` kütüphanesini kullanarak tüm alt bileşenlerin
 *              tema bilgisine erişmesini ve temayı değiştirebilmesini sağlar.
 *              Uygulamanın kök layout'unda kullanılmalıdır.
 *              Accent color (vurgu rengi) server-side render edilerek <html>'e
 *              `data-accent` attribute olarak yazilir — boylece sayfa yuklenmeden
 *              dogru CSS variable'lar set edilir (flash of wrong accent yok).
 */

"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { applyAccentToDocument, type AccentColor, isAccentColor } from "@/lib/theme";

// next-themes'in kendi ThemeProviderProps tipi dışa aktarılmadığı için,
// propları daha genel bir şekilde tanımlıyoruz.
type CustomThemeProviderProps = {
  children: React.ReactNode;
  /** Server-side render edilmis accent. layout.tsx'ten gecilir. */
  defaultAccent?: AccentColor;
  [key: string]: any;
};

/**
 * `next-themes`'in ThemeProvider'ını sarmalayan ve proplarını alt bileşene geçiren bir istemci bileşeni.
 *
 * Not: `disableTransitionOnChange` default olarak FALSE bırakılmıştır.
 * View Transitions API theme değişimini kendi animasyonuyla yönettiği için
 * next-themes'in kendi CSS transition'larını devre dışı bırakmasına
 * gerek yoktur — hatta bu, view transition ile çakışır.
 */
export function ThemeProvider({
  children,
  defaultAccent,
  ...props
}: CustomThemeProviderProps) {
  // Client-side: defaultAccent'i document'e uygula (idempotent).
  // ThemeCustomizer mount oldugunda document.dataset.accent'i okur ve
  // ayni degeri tekrar set eder (no-op).
  React.useEffect(() => {
    if (defaultAccent && isAccentColor(defaultAccent)) {
      applyAccentToDocument(defaultAccent);
    }
  }, [defaultAccent]);

  return (
    <NextThemesProvider
      {...props}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}