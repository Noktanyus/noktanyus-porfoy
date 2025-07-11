/**
 * @file NextAuth için oturum (session) sağlayıcı bileşeni.
 * @description Bu bileşen, `next-auth/react` kütüphanesinden gelen `SessionProvider`'ı
 *              sarmalayarak tüm uygulama genelinde oturum yönetimi context'ini sağlar.
 *              Bu sayede, alt bileşenler `useSession` gibi hook'ları kullanarak mevcut
 *              kullanıcının oturum bilgilerine erişebilir.
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/** AuthProvider bileşeninin kabul ettiği proplar. */
interface AuthProviderProps {
  /** Sarmalanacak alt bileşenler. */
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}