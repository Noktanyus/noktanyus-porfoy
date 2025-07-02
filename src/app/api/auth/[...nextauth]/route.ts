import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { env } from "@/lib/env"; // Tip-güvenli ortam değişkenlerini import et

// NextAuth yapılandırmasını tanımla
const authOptions: NextAuthOptions = {
  // Sağlayıcılar (Providers)
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Tip-güvenli env nesnesinden yönetici bilgilerini al
        const adminEmail = env.ADMIN_EMAIL;
        const adminPassword = env.ADMIN_PASSWORD;

        const isValid =
          credentials?.email === adminEmail &&
          credentials?.password === adminPassword;

        if (isValid) {
          return { id: "1", name: "Admin", email: adminEmail, role: "admin" };
        }

        return null;
      },
    }),
  ],

  // Session Stratejisi
  session: {
    strategy: "jwt",
  },

  // Sayfalar
  pages: {
    signIn: "/admin/login",
  },

  // Geri Çağrılar (Callbacks)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // Giriş anında gelen rolü doğrudan token'a ata
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // Secret
  secret: env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
