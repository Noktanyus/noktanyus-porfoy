import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

// NextAuth yapılandırmasını tanımla
const authOptions: NextAuthOptions = {
  // Sağlayıcılar (Providers)
  // Sadece "Credentials" (Giriş Bilgileri) sağlayıcısını kullanacağız.
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Bu fonksiyon, kullanıcı giriş yapmaya çalıştığında çalışır.
      async authorize(credentials) {
        // .env.local dosyasından yönetici bilgilerini al
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Gerekli bilgiler .env'de tanımlı mı diye kontrol et
        if (!adminEmail || !adminPassword) {
          console.error("Admin email/password not set in .env.local");
          return null;
        }

        // Kullanıcının girdiği bilgilerle .env'deki bilgileri karşılaştır
        const isValid =
          credentials?.email === adminEmail &&
          credentials?.password === adminPassword;

        // Eğer bilgiler doğruysa, kullanıcı nesnesini döndür.
        // Bu nesne, session token (JWT) içinde saklanacak.
        if (isValid) {
          return { id: "1", name: "Admin", email: adminEmail };
        }

        // Bilgiler yanlışsa, null döndürerek girişi engelle.
        return null;
      },
    }),
  ],

  // Session Stratejisi
  // "jwt" (JSON Web Token) kullanacağız, çünkü veritabanımız yok.
  session: {
    strategy: "jwt",
  },

  // Sayfalar (Pages)
  // NextAuth'a özel giriş sayfamızın yolunu belirtiyoruz.
  pages: {
    signIn: "/admin/login",
  },

  // Geri Çağrılar (Callbacks)
  // Session ve token'ın nasıl yönetileceğini belirler.
  callbacks: {
    // `jwt` callback'i, token oluşturulduğunda veya güncellendiğinde çalışır.
    async jwt({ token, user }) {
      // Giriş anında (user nesnesi mevcutsa)
      if (user) {
        token.id = user.id;
        // Kullanıcı admin mi diye kontrol et ve rolü token'a ekle
        if (user.email === process.env.ADMIN_EMAIL) {
          token.role = "admin";
        }
      }
      return token;
    },
    // `session` callback'i, bir client session'ı kontrol ettiğinde çalışır.
    async session({ session, token }) {
      // Session nesnesine token'daki bilgileri ekle
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string; // Rolü session'a ekle
      }
      return session;
    },
  },

  // Secret
  // .env.local dosyasından gelen secret'ı kullan.
  secret: process.env.NEXTAUTH_SECRET,
};

// NextAuth'ı başlat ve dışa aktar
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
