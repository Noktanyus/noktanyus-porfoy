"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Turnstile from "@/components/Turnstile";
import { FaEnvelope, FaGithub, FaLinkedin, FaPaperPlane, FaTwitter } from "react-icons/fa";

const schema = z.object({
  name: z.string().min(2, "İsim alanı en az 2 karakter olmalıdır."),
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin."),
  subject: z.string().min(5, "Konu alanı en az 5 karakter olmalıdır."),
  message: z.string().min(10, "Mesaj alanı en az 10 karakter olmalıdır."),
});

type FormData = z.infer<typeof schema>;

interface IletisimFormProps {
  contactEmail?: string | null;
  socialGithub?: string | null;
  socialLinkedin?: string | null;
  socialTwitter?: string | null;
  sitekey: string;
}

export default function IletisimForm({ contactEmail, socialGithub, socialLinkedin, socialTwitter, sitekey }: IletisimFormProps) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    reset 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);

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
      reset();
      setTurnstileToken(null);
      setIsTurnstileVerified(false);
      // Turnstile widget'ı `onExpire` callback'i sayesinde kendini resetleyecektir,
      // bu yüzden burada ek bir işlem yapmaya gerek yok.
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 bg-white dark:bg-dark-card shadow-2xl rounded-2xl p-8">
      <div className="lg:col-span-1 space-y-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">İletişim Bilgileri</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Formu doldurmak yerine doğrudan ulaşmayı tercih ederseniz, aşağıdaki kanalları kullanabilirsiniz.
        </p>
        <div className="space-y-4">
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="flex items-center group">
              <FaEnvelope className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-brand-primary transition-colors" />
              <span className="ml-3 text-gray-700 dark:text-gray-300 group-hover:text-brand-primary transition-colors">{contactEmail}</span>
            </a>
          )}
        </div>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Sosyal Medya</h3>
          <div className="flex space-x-4 mt-3">
            {socialGithub && <a href={socialGithub} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-primary transition-colors"><FaGithub size={24} /></a>}
            {socialLinkedin && <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-primary transition-colors"><FaLinkedin size={24} /></a>}
            {socialTwitter && <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-primary transition-colors"><FaTwitter size={24} /></a>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Adınız Soyadınız</label>
              <input {...register("name")} id="name" className="w-full p-3 rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">E-posta Adresiniz</label>
              <input {...register("email")} id="email" type="email" className="w-full p-3 rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">Konu</label>
            <input {...register("subject")} id="subject" className="w-full p-3 rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition" />
            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">Mesajınız</label>
            <textarea {...register("message")} id="message" rows={5} className="w-full p-3 rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition" />
            {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
          </div>
          <div className="flex justify-center pt-2">
            <Turnstile
              sitekey={sitekey}
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
              onError={() => toast.error("Doğrulama sırasında bir hata oluştu. Lütfen sayfayı yenileyin.")}
            />
          </div>
          <button type="submit" disabled={isSubmitting || !isTurnstileVerified} className="w-full flex items-center justify-center bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-primary/90 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105">
              <FaPaperPlane className="mr-2" />
              {isSubmitting ? "Gönderiliyor..." : "Mesajı Gönder"}
            </button>
        </form>
      </div>
    </div>
  );
}
