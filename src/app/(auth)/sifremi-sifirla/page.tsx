import type { Metadata } from 'next';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
  description: "Hesabınız için yeni bir şifre belirleyin",
  robots: { index: false, follow: false },
};

export default function SifremiSifirlaPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-blob-decoration px-4 py-8">
      <div className="max-w-md w-full">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
