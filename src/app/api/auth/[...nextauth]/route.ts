import "@/lib/env";
/**
 * @file NextAuth için kimlik doğrulama yapılandırması.
 * @description Bu dosya, Next.js projesi için kimlik doğrulama stratejilerini,
 *              sağlayıcıları (providers), session yönetimini ve geri çağrıları (callbacks)
 *              yapılandırır. Bu projede sadece "Credentials" (e-posta/şifre)
 *              sağlayıcısı kullanılmaktadır.
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

// NextAuth için yapılandırma seçenekleri
const authOptions: NextAuthOptions = {
  // --- Sağlayıcılar (Providers) ---
  // Projede kullanılacak kimlik doğrulama yöntemleri burada tanımlanır.
  providers: [
    CredentialsProvider({
      // Bu sağlayıcının adı (giriş formunda kullanılabilir)
      name: "Credentials",
      // Giriş formu için beklenen alanlar
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
        // Sadece email ve password kullanılıyor
      },
      /**
       * Kullanıcının giriş bilgilerini doğrulayan fonksiyon.
       * @param credentials - Giriş formundan gelen e-posta ve şifre.
       * @returns - Doğrulama başarılıysa kullanıcı nesnesi, değilse null.
       */
      async authorize(credentials) {
        // .env dosyasından yönetici bilgilerini güvenli bir şekilde al
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Gelen bilgilerle .env'deki bilgileri karşılaştır
        const isValid =
          credentials?.email === adminEmail &&
          credentials?.password === adminPassword;

        // Eğer bilgiler doğruysa, kullanıcı nesnesini döndür.
        // Bu nesne, session ve token'a aktarılacak bilgileri içerir.
        if (isValid) {
          return { id: "1", name: "Admin", email: adminEmail, role: "admin" };
        }

        // Bilgiler yanlışsa null döndürerek girişi reddet.
        return null;
      },
    }),
  ],

  // --- Session Stratejisi ---
  // "jwt" (JSON Web Token) stratejisi, session durumunu bir token içinde saklar.
  // Bu, veritabanı gerektirmeyen, stateless bir yöntemdir.
  session: {
    strategy: "jwt",
  },

  // --- Sayfalar ---
  // NextAuth'un kullanacağı özel sayfaların yolları.
  pages: {
    signIn: "/admin/login", // Giriş yapma sayfası
    // error: '/auth/error', // Hata sayfası (isteğe bağlı)
  },

  // --- Geri Çağrılar (Callbacks) ---
  // Token ve session oluşturulurken veya güncellenirken çalışan fonksiyonlar.
  callbacks: {
    /**
     * JWT oluşturulduğunda veya güncellendiğinde çalışır.
     * @param token - Mevcut JWT.
     * @param user - `authorize` fonksiyonundan dönen kullanıcı nesnesi (sadece ilk girişte gelir).
     * @returns - Güncellenmiş JWT.
     */
    async jwt({ token, user }) {
      // Eğer `user` nesnesi varsa (yani kullanıcı yeni giriş yaptıysa),
      // kullanıcı bilgilerini (id, rol) token'a ekle.
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    /**
     * Session'a erişildiğinde çalışır.
     * @param session - Mevcut session nesnesi.
     * @param token - `jwt` callback'inden dönen token.
     * @returns - İstemciye gönderilecek güncellenmiş session nesnesi.
     */
    async session({ session, token }) {
      // Token'daki bilgileri (id, rol) session'daki kullanıcı nesnesine aktar.
      // Bu sayede bu bilgilere istemci tarafında `useSession` ile erişilebilir.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // --- Gizli Anahtar (Secret) ---
  // JWT'leri imzalamak ve şifrelemek için kullanılan gizli anahtar.
  // .env dosyasından alınmalıdır.
  secret: process.env.NEXTAUTH_SECRET,
};

// NextAuth'u yapılandırma seçenekleriyle başlat
const handler = NextAuth(authOptions);

// GET ve POST istekleri için aynı handler'ı dışa aktar
export { handler as GET, handler as POST };
