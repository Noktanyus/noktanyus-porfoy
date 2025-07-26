'use client';

import { useEffect } from 'react';

export default function ConsoleFilter() {
  useEffect(() => {
    // Console filter'ı doğrudan burada uygula
    if (typeof window === 'undefined') return;

    // Orijinal console fonksiyonlarını sakla
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    // Global error handler ekle
    window.addEventListener('error', (e) => {
      const message = e.message || '';
      if (
        message.includes('sandboxed') ||
        message.includes('about:blank') ||
        message.includes('Blocked script execution')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
      const message = e.reason?.toString() || '';
      if (
        message.includes('sandboxed') ||
        message.includes('about:blank') ||
        message.includes('Blocked script execution')
      ) {
        e.preventDefault();
        return false;
      }
    });

    // Console.error'u override et
    console.error = (...args: any[]) => {
      const message = args.join(' ');

      // Filtrelenecek hata mesajları
      const filteredMessages = [
        'sandboxed',
        'allow-scripts',
        'about:blank',
        'Blocked script execution',
        'document\'s frame is sandboxed',
        'Permissions-Policy header',
        'Unrecognized feature',
        'browsing-topics',
        'interest-cohort',
        'challenges.cloudflare.com',
        'Refused to connect',
        'Content Security Policy',
        'CSP',
        'violates the following',
        'mc.yandex.com',
        'mc.yandex.ru',
        'yandex',
        'youtube.com',
        'www.youtube.com',
        'Refused to frame',
        'frame-src',
        'YOUTUBEJS',
        'Failed to extract signature decipher',
        'googleads.g.doubleclick.net',
        'CORS policy',
        'Access-Control-Allow-Origin',
        'aria-hidden',
        'assistive technology',
        'ytimg.com',
        'doubleclick.net',
        'Refused to apply style',
        'MIME type',
        'text/html',
        'not a supported stylesheet',
        'strict MIME checking',
        'utilities.css',
        'animations.css'
      ];

      // Eğer mesaj filtrelenecek bir hata içeriyorsa gösterme
      if (filteredMessages.some(filter => message.includes(filter))) {
        return;
      }

      // Diğer hataları normal şekilde göster
      originalError.apply(console, args);
    };

    // Console.log'u da filtrele
    console.log = (...args: any[]) => {
      const message = args.join(' ');

      // Filtrelenecek log mesajları
      const filteredLogs = [
        'LCP:',
        'Performance optimizations initialized',
        'Image load time:',
        'Memory usage:',
        'Console filter aktif edildi'
      ];

      // Eğer mesaj filtrelenecek bir log içeriyorsa gösterme
      if (filteredLogs.some(filter => message.includes(filter))) {
        return;
      }

      // Diğer logları normal şekilde göster
      originalLog.apply(console, args);
    };

    // Console.warn'ı da filtrele
    console.warn = (...args: any[]) => {
      const message = args.join(' ');

      // Filtrelenecek uyarı mesajları
      const filteredWarnings = [
        'preloaded using link preload but not used',
        'preload but not used',
        'Permissions-Policy',
        'browsing-topics',
        'interest-cohort',
        'inter-var.woff2',
        'fonts/inter-var.woff2',
        'placeholder.webp',
        'profile.webp',
        'Poor CLS',
        'CLS:',
        'target: <0.1',
        'Error with Permissions-Policy header',
        'Unrecognized feature',
        'Console was cleared',
        'Blocked aria-hidden',
        'focus must not be hidden',
        'ytp-play-button',
        'ytp-chrome-bottom',
        'Image load time:',
        'Memory usage:',
        'LCP:',
        'Event {isTrusted: true',
        'css-optimization.ts'
      ];

      // Eğer mesaj filtrelenecek bir uyarı içeriyorsa gösterme
      if (filteredWarnings.some(filter => message.includes(filter))) {
        return;
      }

      // Diğer uyarıları normal şekilde göster
      originalWarn.apply(console, args);
    };

    // console.log('Console filter aktif edildi'); // Sessiz çalışsın
  }, []);

  return null; // Bu component görsel bir şey render etmez
}