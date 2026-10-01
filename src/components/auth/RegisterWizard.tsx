/**
 * @file RegisterWizard — hızlı kayıt
 * @description
 *   Step 1 — Hesap bilgileri + kullanım koşulları
 *   Step 2 — E-posta doğrulama
 *
 *   Plan/paket seçimi kayıtta zorlanmaz; kullanıcı mağazadan sonra seçer.
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { RegisterStepSchema } from "@/modules/onboarding/schemas";

type Step = 1 | 2;

interface AccountData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const STEP_LABELS: Record<Step, string> = {
  1: "Hesap",
  2: "Doğrulama",
};

function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "bg-slate-200 dark:bg-slate-700" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const s = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["", "Zayıf", "Orta", "İyi", "Güçlü"];
  const colors = [
    "bg-slate-200 dark:bg-slate-700",
    "bg-rose-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ];
  return { score: s, label: labels[s], color: colors[s] };
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = [1, 2];
  return (
    <ol className="flex items-center justify-between gap-2 mb-6" aria-label="Kayıt adımları">
      {steps.map((s, idx) => {
        const isActive = s === current;
        const isCompleted = s < current;
        return (
          <li key={s} className="flex-1 flex items-center" aria-current={isActive ? "step" : undefined}>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  isCompleted && "bg-indigo-600 text-white dark:bg-indigo-500",
                  isActive &&
                    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 ring-2 ring-indigo-600 dark:ring-indigo-400",
                  !isActive &&
                    !isCompleted &&
                    "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                )}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"
                )}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 -mt-4 transition-colors",
                  s < current ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function AccountStep({
  data,
  setData,
  disabled,
  error,
}: {
  data: AccountData;
  setData: (d: AccountData) => void;
  disabled?: boolean;
  error: string | null;
}) {
  const strength = useMemo(() => passwordStrength(data.password), [data.password]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hesap oluştur</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Plan seçmeden devam edebilirsiniz. Abonelik veya krediyi sonra mağazadan alırsınız.
        </p>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
          Ad Soyad
        </label>
        <input
          id="reg-name"
          type="text"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          required
          minLength={2}
          maxLength={100}
          disabled={disabled}
          autoComplete="name"
          className={cn(
            "w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800",
            "border-slate-300 dark:border-slate-700",
            "text-slate-900 dark:text-slate-100",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
          E-posta
        </label>
        <input
          id="reg-email"
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          required
          maxLength={200}
          disabled={disabled}
          autoComplete="email"
          placeholder="ornek@email.com"
          className={cn(
            "w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800",
            "border-slate-300 dark:border-slate-700",
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
          Şifre
        </label>
        <input
          id="reg-password"
          type="password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          required
          minLength={8}
          maxLength={100}
          disabled={disabled}
          autoComplete="new-password"
          placeholder="En az 8 karakter"
          className={cn(
            "w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800",
            "border-slate-300 dark:border-slate-700",
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        {data.password && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={cn("h-full transition-all", strength.color)} style={{ width: `${(strength.score / 4) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right">{strength.label}</span>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="reg-confirm-password"
          className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300"
        >
          Şifre Tekrar
        </label>
        <input
          id="reg-confirm-password"
          type="password"
          value={data.confirmPassword}
          onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
          required
          minLength={8}
          maxLength={100}
          disabled={disabled}
          autoComplete="new-password"
          placeholder="Şifreyi tekrar girin"
          className={cn(
            "w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800",
            "border-slate-300 dark:border-slate-700",
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      </div>

      <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-400">
        <input
          type="checkbox"
          checked={data.acceptTerms}
          onChange={(e) => setData({ ...data, acceptTerms: e.target.checked })}
          className="mt-1"
          required
          disabled={disabled}
        />
        <span>
          <Link href="/yasal/kvkk" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank">
            KVKK
          </Link>
          {" "}ve{" "}
          <Link href="/yasal/mesafeli-satis" className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank">
            mesafeli satış
          </Link>
          {" "}metinlerini okudum, kabul ediyorum.
        </span>
      </label>
    </div>
  );
}

function VerificationStep({ email }: { email: string }) {
  return (
    <div className="text-center py-2">
      <div className="mx-auto h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
        <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">E-postanı doğrula</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        <strong className="text-slate-800 dark:text-slate-200">{email}</strong> adresine bir doğrulama
        linki gönderdik. Hesabını aktifleştirmek için linke tıkla.
      </p>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Plan veya kredi paketini doğrulama sonrası{" "}
        <Link href="/magaza/abonelikler" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          mağazadan
        </Link>{" "}
        seçebilirsin.
      </p>
      <div className="mt-6">
        <Link
          href="/giris"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}

export function RegisterWizard() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);

    if (account.password !== account.confirmPassword) {
      setAccountError("Şifreler eşleşmiyor");
      return;
    }
    if (!account.acceptTerms) {
      setAccountError("Kullanım koşullarını kabul etmelisiniz");
      return;
    }

    const parsed = RegisterStepSchema.safeParse({
      name: account.name,
      email: account.email,
      password: account.password,
    });
    if (!parsed.success) {
      setAccountError(parsed.error.issues[0]?.message ?? "Form geçersiz");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: account.name,
          email: account.email,
          password: account.password,
          // Plan kayıtta zorunlu değil — starter trial varsayılan
          planSlug: "starter",
          acceptTerms: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const code = data?.error?.code;
        const message =
          data?.error?.message ??
          (code === "EMAIL_TAKEN" ? "Bu e-posta zaten kayıtlı" : "Kayıt başarısız");
        throw new Error(message);
      }

      setStep(2);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator current={step} />

      {step === 1 && (
        <form onSubmit={handleSubmit} noValidate>
          <AccountStep data={account} setData={setAccount} disabled={loading} error={accountError} />

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={loading || !account.acceptTerms}
              className={cn(
                "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                "bg-indigo-600 text-white hover:bg-indigo-700",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                "dark:focus-visible:ring-offset-slate-900",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
            </button>
          </div>
        </form>
      )}

      {step === 2 && <VerificationStep email={account.email} />}
    </div>
  );
}

export default RegisterWizard;
