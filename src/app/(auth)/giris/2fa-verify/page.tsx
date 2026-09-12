import type { Metadata } from 'next';
import TwoFactorVerifyForm from '@/components/auth/TwoFactorVerifyForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "İki Faktörlü Doğrulama",
  description: "Giriş için iki faktörlü doğrulama kodunuzu girin",
  robots: { index: false, follow: false },
};

export default function TwoFactorVerifyPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-blob-decoration px-4 py-8">
      <div className="max-w-md w-full">
        <TwoFactorVerifyForm />
      </div>
    </div>
  );
}
