import type { Metadata } from 'next';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "Hesabınız için şifre sıfırlama linki talep edin",
  robots: { index: false, follow: false },
};

export default function SifremiUnuttumPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-blob-decoration px-4 py-8">
      <div className="max-w-md w-full">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
