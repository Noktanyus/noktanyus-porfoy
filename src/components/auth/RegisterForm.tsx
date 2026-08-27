"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const code = data?.error?.code;
        const message =
          data?.error?.message ??
          (code === "EMAIL_TAKEN"
            ? "Bu e-posta zaten kayıtlı"
            : "Kayıt başarısız");
        throw new Error(message);
      }

      // Auto-login after register (server-side redirect via NextAuth)
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard",
      });
      // signIn redirect:true ile çalıştığında aşağıdaki kod çalışmaz (redirect yapar)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Şifre güç göstergesi
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  })();

  const strengthLabel = ["", "Zayıf", "Orta", "İyi", "Güçlü"][passwordStrength];
  const strengthColor = [
    "bg-muted",
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ][passwordStrength];

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
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Ad Soyad
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          disabled={loading}
          className="admin-input"
          placeholder="Yunus Tuğhan"
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium mb-2">
          E-posta
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={200}
          disabled={loading}
          className="admin-input"
          placeholder="ornek@email.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium mb-2">
          Şifre
        </label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          disabled={loading}
          className="admin-input"
          placeholder="En az 8 karakter"
          autoComplete="new-password"
        />
        {password && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${strengthColor}`}
                style={{ width: `${(passwordStrength / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-12 text-right">
              {strengthLabel}
            </span>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="reg-confirm-password"
          className="block text-sm font-medium mb-2"
        >
          Şifre Tekrar
        </label>
        <input
          id="reg-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          disabled={loading}
          className="admin-input"
          placeholder="Şifreyi tekrar girin"
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="admin-btn admin-btn-primary w-full"
      >
        {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Hesap oluşturarak{" "}
        <Link href="/yasal/kvkk" className="underline">
          KVKK
        </Link>{" "}
        ve{" "}
        <Link href="/yasal/mesafeli-satis" className="underline">
          Mesafeli Satış
        </Link>{" "}
        şartlarını kabul edersiniz.
      </p>
    </form>
  );
}
