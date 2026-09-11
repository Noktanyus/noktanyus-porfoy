"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";

function safeInternalPath(url: string | null, fallback: string): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return fallback;
  return url;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Email veya şifre hatalı");
        return;
      }

      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      const requested = safeInternalPath(callbackUrl, role === "admin" ? "/admin/dashboard" : "/dashboard");

      if (role === "admin") {
        router.push(requested.startsWith("/admin") ? requested : "/admin/dashboard");
      } else {
        router.push(requested.startsWith("/admin") ? "/dashboard" : requested);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20"
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="admin-input"
          placeholder="ornek@email.com"
          autoComplete="email"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Şifre
          </label>
          <Link
            href="/sifremi-unuttum"
            className="text-xs text-primary hover:underline"
          >
            Şifremi unuttum
          </Link>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="admin-input"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="admin-btn admin-btn-primary w-full"
      >
        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
