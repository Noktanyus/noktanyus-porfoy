"use client";

/**
 * @file Yönetim paneli giriş sayfası (Client-Side Only).
 * @description Tamamen client-side çalışan giriş sayfası.
 *              Kullanıcıların e-posta ve şifre ile yönetim paneline giriş yapmasını
 *              sağlayan formu içerir.
 */

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Head from "next/head";
import Spinner from "@/components/ui/Spinner";
import CloudflareTurnstile from "@/components/CloudflareTurnstile";

// Form verilerinin şemasını Zod ile tanımla
const schema = z.object({
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifre alanı boş bırakılamaz."),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/admin/dashboard');
    }
  }, [status, router]);

  // Cleanup effect - component unmount olduğunda tüm toast'ları temizle
  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
  };

  const handleTurnstileError = () => {
    toast.error("Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.");
    setTurnstileToken("");
  };

  const onSubmit = async (data: FormData) => {
    if (!turnstileToken) {
      toast.error("Lütfen güvenlik doğrulamasını tamamlayın.");
      return;
    }

    // Turnstile token'ını doğrula
    try {
      const verifyResponse = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        toast.error("Güvenlik doğrulaması başarısız.");
        setTurnstileToken(""); // Doğrulama başarısızsa token'ı sıfırla
        return;
      }
    } catch (error) {
      toast.error("Güvenlik doğrulaması sırasında hata oluştu.");
      setTurnstileToken(""); // Hata durumunda token'ı sıfırla
      return;
    }
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      const errorToast = toast.error("Giriş bilgileri hatalı.");
      setTimeout(() => toast.dismiss(errorToast), 5000);
      setTurnstileToken(""); // Hata durumunda token'ı sıfırla
    } else if (result?.ok) {
      const successToast = toast.success("Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...");
      setTimeout(() => toast.dismiss(successToast), 3000);
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
    <>
      <Head>
        <title>Yönetim Paneli Girişi | Admin</title>
        <meta name="description" content="Yönetim paneline giriş yapın" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
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
            <CloudflareTurnstile
              onVerify={handleTurnstileVerify}
              onError={handleTurnstileError}
              onExpire={() => setTurnstileToken("")}
              theme="light"
            />
          </div>
          
          <button type="submit" disabled={isSubmitting || !turnstileToken} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </>
  );
}
