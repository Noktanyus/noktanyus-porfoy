
/**
 * @file İletişim sayfası.
 * @description Bu sayfa, kullanıcıların ad, e-posta, konu ve mesaj girerek
 *              iletişim kurmasını sağlayan bir form içerir. Form, `react-hook-form`
 *              ile yönetilir, `zod` ile doğrulanır ve `Cloudflare Turnstile`
 *              ile bot koruması altındadır.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Turnstile from "@/components/Turnstile";

// Form alanları için doğrulama şeması
const schema = z.object({
  name: z.string().min(2, "İsim alanı en az 2 karakter olmalıdır."),
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
  subject: z.string().min(5, "Konu alanı en az 5 karakter olmalıdır."),
  message: z.string().min(10, "Mesaj alanı en az 10 karakter olmalıdır."),
});

type FormData = z.infer<typeof schema>;

export default function IletisimPage() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    reset 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  /**
   * Form gönderildiğinde çalışacak fonksiyon.
   * @param data - Formdan gelen doğrulanmış veriler.
   */
  const onSubmit = async (data: FormData) => {
    if (!turnstileToken) {
      toast.error("Lütfen insan olduğunuzu doğrulayın.");
      return;
    }

    const loadingToast = toast.loading("Mesajınız gönderiliyor...");
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, turnstileToken }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Mesaj gönderilirken bir hata oluştu.");
      }
      toast.success("Mesajınız başarıyla gönderildi! En kısa sürede dönüş yapılacaktır.", { id: loadingToast });
      reset(); // Formu sıfırla
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">İletişim</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Bana bir mesaj gönderin, en kısa sürede size döneceğim.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">Adınız Soyadınız</label>
          <input {...register("name")} id="name" className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">E-posta Adresiniz</label>
          <input {...register("email")} id="email" type="email" className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">Konu</label>
          <input {...register("subject")} id="subject" className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
          {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">Mesajınız</label>
          <textarea {...register("message")} id="message" rows={5} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
          {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
        </div>
        <div className="flex justify-center">
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
            onVerify={setTurnstileToken}
          />
        </div>
        <button type="submit" disabled={isSubmitting || !turnstileToken} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400">
          {isSubmitting ? "Gönderiliyor..." : "Mesajı Gönder"}
        </button>
      </form>
    </div>
  );
}
