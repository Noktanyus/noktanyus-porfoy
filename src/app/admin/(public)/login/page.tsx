/**
 * @file Yönetim paneli giriş sayfası.
 * @description Kullanıcıların e-posta ve şifre ile yönetim paneline giriş yapmasını
 *              sağlayan formu içerir. Ayrıca Cloudflare Turnstile ile bot koruması
 *              ve Zod ile form doğrulaması yapar. Oturum açmış kullanıcıları
 *              doğrudan yönetim paneline yönlendirir.
 */

"use client";

import { useState, useEffect } from "react";
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
  const { data: session, status } = useSession(); // Oturum durumunu al: 'loading', 'authenticated', 'unauthenticated'

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Oturum durumu değiştiğinde kontrol et
  useEffect(() => {
    // Eğer kullanıcı zaten oturum açmışsa, onu yönetim paneline yönlendir.
    // Bu, giriş yapmış bir kullanıcının tekrar giriş sayfasını görmesini engeller.
    if (status === 'authenticated') {
      router.replace('/admin/dashboard');
    }
  }, [status, router]);

  /**
   * Form gönderildiğinde çalışacak fonksiyon.
   * @param data - Formdan gelen doğrulanmış veriler.
   */
  const onSubmit = async (data: FormData) => {
    if (!turnstileToken) {
      toast.error("Lütfen insan olduğunuzu doğrulayın.");
      return;
    }

    // NextAuth'un signIn fonksiyonunu kullanarak giriş yapmayı dene
    const result = await signIn("credentials", {
      redirect: false, // Sayfanın yeniden yönlendirilmesini NextAuth'a bırakma, kendimiz yöneteceğiz.
      email: data.email,
      password: data.password,
      turnstileToken, // Doğrulama token'ını da gönder
    });

    if (result?.error) {
      toast.error("Giriş bilgileri hatalı veya doğrulama başarısız oldu.");
    } else if (result?.ok) {
      toast.success("Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...");
      // Başarılı giriş sonrası yönetim paneline yönlendir.
      router.push("/admin/dashboard");
    }
  };

  // Oturum durumu kontrol edilirken veya kullanıcı zaten yönlendirilirken yükleme ekranı göster.
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner />
        <p className="mt-4 text-lg">Oturum durumu kontrol ediliyor, lütfen bekleyin...</p>
      </div>
    );
  }

  // Oturum yoksa (unauthenticated) giriş formunu göster.
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
            onVerify={setTurnstileToken}
          />
        </div>
        <button type="submit" disabled={isSubmitting || !turnstileToken} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
          {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
