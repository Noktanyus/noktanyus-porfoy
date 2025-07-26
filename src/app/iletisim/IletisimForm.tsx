"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { FaEnvelope, FaGithub, FaLinkedin, FaPaperPlane, FaInstagram } from "react-icons/fa";
import CloudflareTurnstile from "@/components/CloudflareTurnstile";

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
  socialInstagram?: string | null;
}

export default function IletisimForm({ contactEmail, socialGithub, socialLinkedin, socialInstagram }: IletisimFormProps) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    reset 
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const [turnstileToken, setTurnstileToken] = useState<string>("");

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
    const loadingToast = toast.loading("Mesajınız gönderiliyor...");
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          turnstileToken
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Mesaj gönderilirken bir hata oluştu.");
      }
      const successToast = toast.success("Mesajınız başarıyla gönderildi! En kısa sürede dönüş yapılacaktır.", { id: loadingToast });
      setTimeout(() => toast.dismiss(successToast), 8000);
      reset();
      setTurnstileToken(""); // Turnstile token'ını sıfırla
    } catch (error) {
      const errorToast = toast.error((error as Error).message, { id: loadingToast });
      setTimeout(() => toast.dismiss(errorToast), 5000);
      setTurnstileToken(""); // Hata durumunda token'ı sıfırla
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12 bg-white dark:bg-dark-card shadow-2xl rounded-2xl p-4 sm:p-6 md:p-8">
      {/* Contact Information Section */}
      <div className="lg:col-span-1 order-2 lg:order-1 space-y-4 md:space-y-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-light-text dark:text-dark-text">İletişim Bilgileri</h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Formu doldurmak yerine doğrudan ulaşmayı tercih ederseniz, aşağıdaki kanalları kullanabilirsiniz.
        </p>
        <div className="space-y-3 md:space-y-4">
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="flex items-center group min-h-[48px] p-3 -m-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-manipulation">
              <FaEnvelope className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-brand-primary transition-colors flex-shrink-0" />
              <span className="ml-3 text-sm md:text-base text-gray-700 dark:text-gray-300 group-hover:text-brand-primary transition-colors break-all">{contactEmail}</span>
            </a>
          )}
        </div>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-semibold mb-4">Sosyal Medya</h3>
          <div className="flex flex-wrap gap-3">
            {socialGithub && (
              <a 
                href={socialGithub} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-500 hover:text-brand-primary transition-colors p-3 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 touch-manipulation"
                aria-label="GitHub"
              >
                <FaGithub size={24} />
              </a>
            )}
            {socialLinkedin && (
              <a 
                href={socialLinkedin} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-500 hover:text-brand-primary transition-colors p-3 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 touch-manipulation"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={24} />
              </a>
            )}
            {socialInstagram && (
              <a 
                href={socialInstagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-500 hover:text-brand-primary transition-colors p-3 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 touch-manipulation"
                aria-label="Instagram"
              >
                <FaInstagram size={24} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="lg:col-span-2 order-1 lg:order-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Name and Email Row - Stack on mobile, side by side on larger screens */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Adınız Soyadınız <span className="text-red-500">*</span>
              </label>
              <input 
                {...register("name")} 
                id="name" 
                className="w-full px-4 py-3 sm:py-4 text-base rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 min-h-[48px] sm:min-h-[52px] touch-manipulation placeholder:text-gray-500 dark:placeholder:text-gray-400" 
                placeholder="Adınızı ve soyadınızı girin"
              />
              {errors.name && (
                <div className="mt-1 sm:mt-2 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium flex items-start">
                    <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">!</span>
                    <span className="break-words">{errors.name.message}</span>
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                E-posta Adresiniz <span className="text-red-500">*</span>
              </label>
              <input 
                {...register("email")} 
                id="email" 
                type="email" 
                className="w-full px-4 py-3 sm:py-4 text-base rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 min-h-[48px] sm:min-h-[52px] touch-manipulation placeholder:text-gray-500 dark:placeholder:text-gray-400" 
                placeholder="ornek@email.com"
              />
              {errors.email && (
                <div className="mt-1 sm:mt-2 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium flex items-start">
                    <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">!</span>
                    <span className="break-words">{errors.email.message}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Konu <span className="text-red-500">*</span>
            </label>
            <input 
              {...register("subject")} 
              id="subject" 
              className="w-full px-4 py-3 sm:py-4 text-base rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 min-h-[48px] sm:min-h-[52px] touch-manipulation placeholder:text-gray-500 dark:placeholder:text-gray-400" 
              placeholder="Mesajınızın konusunu belirtin"
            />
            {errors.subject && (
              <div className="mt-1 sm:mt-2 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium flex items-start">
                  <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">!</span>
                  <span className="break-words">{errors.subject.message}</span>
                </p>
              </div>
            )}
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mesajınız <span className="text-red-500">*</span>
            </label>
            <textarea 
              {...register("message")} 
              id="message" 
              rows={5} 
              className="w-full px-4 py-3 sm:py-4 text-base rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 min-h-[120px] sm:min-h-[140px] resize-y touch-manipulation placeholder:text-gray-500 dark:placeholder:text-gray-400" 
              placeholder="Mesajınızı buraya yazın..."
            />
            {errors.message && (
              <div className="mt-1 sm:mt-2 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium flex items-start">
                  <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">!</span>
                  <span className="break-words">{errors.message.message}</span>
                </p>
              </div>
            )}
          </div>

          {/* Cloudflare Turnstile */}
          <div className="flex justify-center py-4">
            <CloudflareTurnstile
              onVerify={handleTurnstileVerify}
              onError={handleTurnstileError}
              onExpire={() => setTurnstileToken("")}
              theme="light"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting || !turnstileToken} 
            className="w-full flex items-center justify-center bg-brand-primary text-white font-bold py-3 sm:py-4 px-6 rounded-lg hover:bg-brand-primary/90 focus:ring-4 focus:ring-brand-primary/20 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[52px] text-sm sm:text-base md:text-lg touch-manipulation shadow-lg hover:shadow-xl disabled:shadow-none"
          >
            <FaPaperPlane className="mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
            <span>{isSubmitting ? "Gönderiliyor..." : "Mesajı Gönder"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
