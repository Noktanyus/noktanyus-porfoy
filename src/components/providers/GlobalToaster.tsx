'use client';

/**
 * @file GlobalToaster - Tum uygulama icin tek toast saglayicisi.
 *
 * Root layout'a yerlestirilir. Admin layout'unun kendi Toaster'i oldugu icin
 * orada render edilmez (admin layout global'i override eder).
 *
 * Mobile responsive: position top-right mobilde top-center'a kayar.
 */

import { Toaster } from 'react-hot-toast';

export default function GlobalToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        // Default 3sn; success kisa, error uzun
        duration: 4000,
        className: '!text-sm sm:!text-base !max-w-[calc(100vw-2rem)]',
        style: {
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'var(--toast-bg, rgba(255, 255, 255, 0.95))',
          color: 'var(--toast-fg, #0f172a)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}
