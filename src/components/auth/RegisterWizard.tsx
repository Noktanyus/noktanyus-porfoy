/**
 * @file RegisterWizard - 3 adımlı kayıt sihirbazı
 * @description
 *   Step 1 — Hesap bilgileri (ad / e-posta / şifre)
 *   Step 2 — Plan seçimi (Starter / Pro / Enterprise) + Kullanım koşulları
 *   Step 3 — E-posta doğrulama bekleme ekranı
 *
 *   shadcn-style, indigo primary, dark mode destekli.
 *   Zod şemaları `@/modules/onboarding/schemas` üzerinden kullanılır.
 *
 * @ai-note Client component: form state'leri useState ile tutulur.
 *       Server action çağrısı ileride `useTransition` ile sarılabilir.
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  RegisterStepSchema,
  PlanSelectStepSchema,
  OnboardingPlanSchema,
} from "@/modules/onboarding/schemas";
import { PlanSelectorStep } from "./PlanSelectorStep";

/** İlerleme çubuğu adımları */
type Step = 1 | 2 | 3;

interface AccountData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PlanData {
  planSlug: "starter" | "pro" | "enterprise";
  acceptTerms: boolean;
}

const STEP_LABELS: Record<Step, string> = {
  1: "Hesap",
  2: "Plan",
  3: "Doğrulama",
};

/**
 * Password strength hesaplayıcısı (0-4 arası skor).
 * RegisterForm'daki ile aynı mantık; merkezileştirme ileride yapılabilir.
 */
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

/**
 * Wizard'daki 3 adımı dikey olarak gösteren ilerleme göstergesi.
 */
function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = [1, 2, 3];
  return (
    <ol
      className="flex items-center justify-between gap-2 mb-6"
      aria-label="Kayıt adımları"
    >
      {steps.map((s, idx) => {
        const isActive = s === current;
        const isCompleted = s < current;
        return (
          <li
            key={s}
            className="flex-1 flex items-center"
            aria-current={isActive ? "step" : undefined}
          >
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  isCompleted &&
                    "bg-indigo-600 text-white dark:bg-indigo-500",
                  isActive &&
                    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 ring-2 ring-indigo-600 dark:ring-indigo-400",
                  !isActive &&
                    !isCompleted &&
                    "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                )}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 -mt-4 transition-colors",
                  s < current
                    ? "bg-indigo-600 dark:bg-indigo-500"
                    : "bg-slate-200 dark:bg-slate-700"
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

/**
 * Step 1 — Hesap bilgileri (name / email / password / confirm).
 */
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Hesap bilgilerini gir
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Hızlıca başlayalım — sadece birkaç bilgi yeterli.
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
          placeholder="Yunus Tuğhan"
          className={cn(
            "w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800",
            "border-slate-300 dark:border-slate-700",
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
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
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
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
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        {data.password && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all", strength.color)}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right">
              {strength.label}
            </span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="reg-confirm-password" className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
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
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      </div>
    </div>
  );
}

/**
 * Step 3 — E-posta doğrulama bekleme ekranı.
 * Kayıt sonrası kullanıcıya gösterilir. Email'e gelen linke tıklaması beklenir.
 */
function VerificationStep({ email }: { email: string }) {
  return (
    <div className="text-center py-2">
      <div className="mx-auto h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
        <svg
          className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
        E-postanı kontrol et
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{email}</span>{" "}
        adresine bir doğrulama bağlantısı gönderdik.
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Bağlantıya tıklayarak hesabını aktifleştirebilirsin.
      </p>

      <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
          E-posta gelmedi mi?
        </p>
        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <li>• Spam / gereksiz e-posta klasörünü kontrol et</li>
          <li>• Adresin doğru yazıldığından emin ol</li>
          <li>• Birkaç dakika bekle, bazen gecikir</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href={`/api/auth/resend-verification?email=${encodeURIComponent(email)}`}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Doğrulama e-postasını tekrar gönder
        </Link>
        <Link
          href="/giris"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ← Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}

/**
 * 3-step kayıt sihirbazının ana component'i.
 *
 * Akış:
 *   1) AccountStep → kullanıcı ad/e-posta/şifre girer
 *   2) PlanSelectorStep → plan seçer + koşulları kabul eder
 *   3) POST /api/auth/register → başarılıysa VerificationStep gösterilir
 *
 * Hata durumunda ilgili step'e geri düşülür ve kullanıcı bilgilendirilir.
 */
export function RegisterWizard() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1 state
  const [account, setAccount] = useState<AccountData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [accountError, setAccountError] = useState<string | null>(null);

  // Step 2 state
  const [plan, setPlan] = useState<PlanData>({
    planSlug: "pro", // default: Pro plan (en popüler)
    acceptTerms: false,
  });

  /** Step 1 → 2 geçişi: Zod ile validate */
  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);

    if (account.password !== account.confirmPassword) {
      setAccountError("Şifreler eşleşmiyor");
      return;
    }

    const parsed = RegisterStepSchema.safeParse({
      name: account.name,
      email: account.email,
      password: account.password,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setAccountError(first?.message ?? "Form geçersiz");
      return;
    }

    setStep(2);
  };

  /** Step 2 → 3 geçişi: plan + acceptTerms doğrula, API'ye gönder */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Plan doğrulama
    const parsedPlan = PlanSelectStepSchema.safeParse({
      planSlug: plan.planSlug,
      acceptTerms: plan.acceptTerms,
    });
    if (!parsedPlan.success) {
      const first = parsedPlan.error.issues[0];
      setSubmitError(first?.message ?? "Plan seçimi geçersiz");
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
          planSlug: plan.planSlug,
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

      // Başarılı kayıt → step 3 (email doğrulama bekleme)
      setStep(3);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Bir hata oluştu");
      // Hata durumunda step 2'de kal
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator current={step} />

      {/* Step 1: Hesap bilgileri */}
      {step === 1 && (
        <form onSubmit={goToStep2} noValidate>
          <AccountStep
            data={account}
            setData={setAccount}
            disabled={loading}
            error={accountError}
          />

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                "bg-indigo-600 text-white hover:bg-indigo-700",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                "dark:focus-visible:ring-offset-slate-900",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Devam
              <svg
                className="ml-1.5 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Plan seçimi */}
      {step === 2 && (
        <form onSubmit={handleSubmit} noValidate>
          {submitError && (
            <div
              className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <PlanSelectorStep
            value={plan.planSlug}
            onChange={(slug) => setPlan({ ...plan, planSlug: slug })}
            acceptTerms={plan.acceptTerms}
            onAcceptTermsChange={(accepted) =>
              setPlan({ ...plan, acceptTerms: accepted })
            }
            disabled={loading}
          />

          <div className="mt-6 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSubmitError(null);
              }}
              disabled={loading}
              className={cn(
                "inline-flex items-center justify-center px-3 py-2 rounded-lg font-medium",
                "text-slate-700 dark:text-slate-300",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <svg
                className="mr-1.5 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Geri
            </button>
            <button
              type="submit"
              disabled={loading || !plan.acceptTerms}
              className={cn(
                "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                "bg-indigo-600 text-white hover:bg-indigo-700",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                "dark:focus-visible:ring-offset-slate-900",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4zm2 5.3A8 8 0 014 12H0c0 3 1.1 5.8 3 7.9l3-2.6z"
                    />
                  </svg>
                  Hesap oluşturuluyor...
                </>
              ) : (
                "Hesap Oluştur"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: E-posta doğrulama bekleme */}
      {step === 3 && <VerificationStep email={account.email} />}
    </div>
  );
}

// OnboardingPlanSchema zod enum'unu runtime'da kullanmak için export ediyoruz
// (ileride başka component'lerde de type-safe plan kontrolü için).
export { OnboardingPlanSchema };
