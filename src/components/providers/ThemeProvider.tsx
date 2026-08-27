/**
 * @file Uygulamanın tema (açık/koyu mod) sağlayıcısı.
 * @description Bu bileşen, `next-themes` kütüphanesini kullanarak tüm alt bileşenlerin
 *              tema bilgisine erişmesini ve temayı değiştirebilmesini sağlar.
 *              Uygulamanın kök layout'unda kullanılmalıdır.
 */

"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes'in kendi ThemeProviderProps tipi dışa aktarılmadığı için,
// propları daha genel bir şekilde tanımlıyoruz.
type CustomThemeProviderProps = {
  children: React.ReactNode;
  [key: string]: any;
};

/**
 * `next-themes`'in ThemeProvider'ını sarmalayan ve proplarını alt bileşene geçiren bir istemci bileşeni.
 * @param {CustomThemeProviderProps} props - `children` ve `next-themes` tarafından kabul edilen diğer proplar (örn: attribute="class", defaultTheme="system").
 *
 * Not: `disableTransitionOnChange` default olarak FALSE bırakılmıştır.
 * View Transitions API theme değişimini kendi animasyonuyla yönettiği için
 * next-themes'in kendi CSS transition'larını devre dışı bırakmasına
 * gerek yoktur — hatta bu, view transition ile çakışır.
 */
export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
