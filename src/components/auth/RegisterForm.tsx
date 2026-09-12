"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { DS } from "@/lib/design-system";
import { FormField } from "@/components/ui/FormField";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";

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
    "bg-slate-200 dark:bg-slate-700",
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
  ][passwordStrength];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          className={DS.formErrorBanner}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <FormField id="name" label="Ad Soyad" required>
        {(inputProps) => (
          <input
            {...inputProps}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            disabled={loading}
            className={DS.input}
            placeholder="Yunus Tuğhan"
            autoComplete="name"
          />
        )}
      </FormField>

      <FormField id="reg-email" label="E-posta" required>
        {(inputProps) => (
          <input
            {...inputProps}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={200}
            disabled={loading}
            className={DS.input}
            placeholder="ornek@email.com"
            autoComplete="email"
          />
        )}
      </FormField>

      <div>
        <FormField id="reg-password" label="Şifre" required>
          {(inputProps) => (
            <input
              {...inputProps}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={100}
              disabled={loading}
              className={DS.input}
              placeholder="En az 8 karakter"
              autoComplete="new-password"
            />
          )}
        </FormField>
        {password && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={passwordStrength}
              aria-valuemin={0}
              aria-valuemax={4}
              aria-label="Şifre gücü"
            >
              <div
                className={`h-full transition-all ${strengthColor}`}
                style={{ width: `${(passwordStrength / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right">
              {strengthLabel}
            </span>
          </div>
        )}
      </div>

      <FormField id="reg-confirm-password" label="Şifre Tekrar" required>
        {(inputProps) => (
          <input
            {...inputProps}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            maxLength={100}
            disabled={loading}
            className={DS.input}
            placeholder="Şifreyi tekrar girin"
            autoComplete="new-password"
          />
        )}
      </FormField>

      <FormSubmitButton
        type="submit"
        loading={loading}
        loadingText="Hesap oluşturuluyor..."
        fullWidth
        className="mt-2"
      >
        Hesap Oluştur
      </FormSubmitButton>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
        Hesap oluşturarak{" "}
        <Link href="/yasal/kvkk" className="underline hover:text-foreground">
          KVKK
        </Link>{" "}
        ve{" "}
        <Link href="/yasal/mesafeli-satis" className="underline hover:text-foreground">
          Mesafeli Satış
        </Link>{" "}
        şartlarını kabul edersiniz.
      </p>
    </form>
  );
}
