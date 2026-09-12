/**
 * @file /email-dogrula - Email doğrulama sonuç sayfası
 * @description /api/auth/verify-email magic link'ten gelen kullanıcıyı
 *              buraya yönlendirir. URL'de ?token= ile gelirse otomatik olarak
 *              doğrulama API'sini çağırır ve sonuca göre mesaj gösterir.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Status = 'loading' | 'success' | 'failed';

export default function EmailDogrulaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'failed');
  const [message, setMessage] = useState<string>(
    token ? 'E-postanız doğrulanıyor...' : 'Doğrulama tokeni bulunamadı.'
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      redirect: 'manual',
    })
      .then(async (res) => {
        // /api/auth/verify-email NextResponse.redirect dönüyor (302/3xx).
        // redirect: 'manual' kullandığımız için type 'opaqueredirect' olur.
        if (res.type === 'opaqueredirect' || (res.status >= 200 && res.status < 400)) {
          if (!cancelled) {
            setStatus('success');
            setMessage('E-postanız doğrulandı! Dashboard\'a yönlendiriliyorsunuz...');
            setTimeout(() => router.push('/dashboard?verified=true'), 1500);
          }
        } else {
          if (!cancelled) {
            setStatus('failed');
            setMessage('Doğrulama başarısız oldu. Token geçersiz veya süresi dolmuş olabilir.');
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('failed');
          setMessage('Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-blob-decoration px-4 py-8">
      <div className="max-w-md w-full glass-card-premium p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
              Doğrulanıyor...
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
              E-posta Doğrulandı ✓
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{message}</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-rose-600 dark:text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
              Doğrulama Başarısız
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{message}</p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/giris"
                className="inline-flex justify-center items-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 min-h-[44px]"
              >
                Giriş sayfasına dön
              </Link>
              <Link
                href="/sifremi-unuttum"
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 min-h-[44px] inline-flex items-center justify-center"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}