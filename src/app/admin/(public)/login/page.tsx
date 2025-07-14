/**
 * @file Yönetim paneli giriş sayfası.
 * @description Kullanıcıların e-posta ve şifre ile yönetim paneline giriş yapmasını
 *              sağlayan formu içerir. Ayrıca Cloudflare Turnstile ile bot koruması
 *              ve Zod ile form doğrulaması yapar. Oturum açmış kullanıcıları
 *              doğrudan yönetim paneline yönlendirir.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Turnstile from "@/components/Turnstile";
import Spinner from "@/components/ui/Spinner";

// Form verilerinin şemasını Zod ile tanımla
const schema = z.object({
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifre alanı boş bırakılamaz."),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/admin/dashboard');
    }
  }, [status, router]);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setIsTurnstileVerified(true);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    toast.error("Doğrulama süresi doldu, lütfen tekrar deneyin.");
    setTurnstileToken(null);
    setIsTurnstileVerified(false);
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!isTurnstileVerified || !turnstileToken) {
      toast.error("Lütfen insan olduğunuzu doğrulayın.");
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      turnstileToken,
    });

    if (result?.error) {
      toast.error("Giriş bilgileri hatalı veya doğrulama başarısız oldu.");
      // Giriş başarısız olduğunda Turnstile'ı sıfırla
      setIsTurnstileVerified(false);
      setTurnstileToken(null);
    } else if (result?.ok) {
      toast.success("Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...");
      router.push("/admin/dashboard");
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner />
        <p className="mt-4 text-lg">Oturum durumu kontrol ediliyor, lütfen bekleyin...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-dark-card rounded-lg shadow-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-center text-light-text dark:text-dark-text">
        Yönetim Paneli Girişi
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            E-posta Adresi
          </label>
          <input {...register("email")} id="email" type="email" disabled={isSubmitting} className="w-full p-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Şifre
          </label>
          <input {...register("password")} id="password" type="password" disabled={isSubmitting} className="w-full p-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary" />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>
        <div className="flex justify-center">
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
            onError={() => toast.error("Doğrulama sırasında bir hata oluştu. Lütfen sayfayı yenileyin.")}
          />
        </div>
        <button type="submit" disabled={isSubmitting || !isTurnstileVerified} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
          {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
