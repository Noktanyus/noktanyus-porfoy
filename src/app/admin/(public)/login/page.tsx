"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Turnstile from "@/components/Turnstile";

const schema = z.object({
  email: z.string().email("Geçersiz e-posta adresi."),
  password: z.string().min(1, "Şifre alanı boş olamaz."),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    if (!turnstileToken) {
      toast.error("Lütfen doğrulamayı tamamlayın.");
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      turnstileToken,
    });

    if (result?.error) {
      toast.error("Giriş bilgileri hatalı veya doğrulama başarısız.");
    } else if (result?.ok) {
      toast.success("Başarıyla giriş yapıldı!");
      window.location.href = "/admin/dashboard";
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-dark-card rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center text-light-text dark:text-dark-text">
        Yönetim Paneli Girişi
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            E-posta
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
            sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
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
