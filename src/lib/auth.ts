/**
 * @file NextAuth merkezi kimlik doğrulama yapılandırması.
 * @description Hem admin (env tabanlı) hem de normal kullanıcı (User tablosu + bcrypt)
 *              girişlerini destekler. Session stratejisi: JWT.
 *
 *              - Admin: env.ADMIN_EMAIL + env.ADMIN_PASSWORD ile giriş yapar.
 *              - User: Prisma User tablosunda bcrypt ile hash'lenmiş şifre kontrolü.
 */

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

if (!env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET tanımlı değil");
}

export const authOptions: NextAuthOptions = {
  // Prisma adapter Account/Session tabloları için kullanılır.
  // JWT session stratejisinde Account/Session yazılmaz ama adapter schema uyumu için tutuyoruz.
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email ve şifre gerekli");
        }

        const email = credentials.email.toLowerCase().trim();

        // 1. ADMIN: env'deki bilgilerle eşleşiyorsa admin rolü ver
        const adminEmail = env.ADMIN_EMAIL?.toLowerCase().trim();
        const adminPassword = env.ADMIN_PASSWORD;

        if (adminEmail && email === adminEmail && credentials.password === adminPassword) {
          return {
            id: "admin",
            email: env.ADMIN_EMAIL,
            name: "Admin",
            role: "admin",
          } as any;
        }

        // 2. Normal kullanıcı: User tablosunda bcrypt ile doğrula
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            emailVerified: true,
          },
        });

        if (!user || !user.password) {
          // Timing attack'i önlemek için aynı süre bcrypt çalıştır
          await bcrypt.compare(credentials.password, "$2a$12$invalidsaltinvalidsaltinvO5gQUxjCz0VOZmC9OgN8HkaaHAXk.");
          throw new Error("Geçersiz email veya şifre");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Geçersiz email veya şifre");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: "user",
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // İlk giriş
        (token as any).id = (user as any).id;
        (token as any).email = user.email;
        (token as any).role = (user as any).role ?? "user";
        (token as any).name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/giris",
  },
  secret: env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
