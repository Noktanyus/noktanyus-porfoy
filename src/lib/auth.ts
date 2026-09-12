/**
 * @file NextAuth merkezi kimlik doğrulama yapılandırması.
 * @description Hem admin (env tabanlı) hem de normal kullanıcı (User tablosu + bcrypt)
 *              girişlerini destekler. Session stratejisi: JWT.
 *
 *              Desteklenen saglayicilar:
 *              - Credentials (email + sifre)
 *              - Google OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
 *              - GitHub OAuth (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET)
 *
 *              SAML SSO: /api/auth/saml endpoint'i ile ayri sekilde calisir
 *              (Identity Provider'lar standart NextAuth akisina uymadigi icin).
 *
 *              - Admin: env.ADMIN_EMAIL + env.ADMIN_PASSWORD ile giriş yapar.
 *                Bypass riski: ADMIN_PASSWORD bos/trim-bos ise admin login
 *                kabul edilmez (env bos gelirse Next.js defaults'a düşer,
 *                bu durumda bile credentials eslesme kontrolu basarisiz olur).
 *              - User: Prisma User tablosunda bcrypt ile hash'lenmiş şifre kontrolü.
 */

import NextAuth, { type NextAuthOptions, type User as NextAuthUserType } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

if (!env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET tanımlı değil");
}

/**
 * Admin rolü ile birlikte döndürdüğümüz kullanıcı shape'i.
 * NextAuth'in default User tipini extend eder; tip güvenliği için `any`
 * yerine bu interface'i kullanıyoruz.
 */
interface AuthorizedUser extends NextAuthUserType {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: "admin" | "user";
}

// OAuth provider'lar sadece credentials tanimliysa aktive edilir.
// Boylece env degiskenleri henuz set edilmemis development ortamlarinda
// build/runtime hatasi olusmaz.
const providers: NextAuthOptions["providers"] = [
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

      // 1. ADMIN: env'deki bilgilerle eşleşiyorsa admin rolü ver.
      // KRİTİK: adminPassword.trim() bos ise admin login kabul edilmez.
      // Bu, env degiskeni set edilmemis / bos gonderilmis server'larda
      // herhangi bir sifre ile admin erisiminin acilmasini engeller.
      const adminEmail = env.ADMIN_EMAIL?.toLowerCase().trim();
      const adminPassword = env.ADMIN_PASSWORD?.trim();
      const hasAdminCredentials = Boolean(
        adminEmail && adminPassword && adminPassword.length > 0
      );

      if (
        hasAdminCredentials &&
        email === adminEmail &&
        credentials.password === adminPassword
      ) {
        const adminUser: AuthorizedUser = {
          id: "admin",
          email: env.ADMIN_EMAIL as string,
          name: "Admin",
          role: "admin",
        };
        return adminUser;
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

      const regularUser: AuthorizedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: "user",
      };
      return regularUser;
    },
  }),
];

// Google OAuth - env tanimliysa ekle
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Ayni email ile birden fazla provider'a kayit olan kullanicinin
      // tek hesapta birlestirilmesine izin verir (OAuth spec uyumu).
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// GitHub OAuth - env tanimliysa ekle
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Tip-güvenli rol tipi: callback'lerde `as any` cast'lerini kaldırır.
type AppRole = "admin" | "user";

interface AppToken {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: AppRole;
  sub?: string;
  [key: string]: unknown;
}

interface AppSession {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: AppRole;
    [key: string]: unknown;
  };
  expires: string;
  [key: string]: unknown;
}

export const authOptions: NextAuthOptions = {
  // Prisma adapter Account/Session tabloları için kullanılır.
  // JWT session stratejisinde Account/Session yazılmaz ama adapter schema uyumu için tutuyoruz.
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      // İlk giriş — user payload'ından token'a bilgi ekle.
      if (user) {
        const u = user as AuthorizedUser;
        // NextAuth'in JWT tipi `Record<string, unknown>` üzerine kurulu;
        // bilinmeyen alanları spread ile ekliyoruz.
        return {
          ...token,
          id: u.id,
          email: u.email,
          name: u.name ?? undefined,
          role: u.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as AppSession;
      const t = token as AppToken;
      if (t && s.user) {
        s.user.id = t.id;
        s.user.role = t.role;
      }
      return s;
    },
  },
  pages: {
    signIn: "/giris",
  },
  secret: env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);