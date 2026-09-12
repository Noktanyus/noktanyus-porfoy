'use client';

/**
 * @file Toast yardimcilari - Tutarli basari/hata/bilgi bildirimleri.
 *
 * Tum uygulamada tek API:
 *   toast.success('Kaydedildi');
 *   toast.error('Hata olustu');
 *   toast.promise(saveFn(), { loading: '...', success: '...', error: '...' });
 *
 * Not: Bu dosya react-hot-toast'in default `toast` objesini re-export eder
 * + uygulamaya ozel onceden tanimlanmis mesaj sablonlari sunar.
 */

import toast from 'react-hot-toast';

export const TOAST_MESSAGES = {
  // Auth
  loginSuccess: 'Başarıyla giriş yaptınız',
  loginError: 'Email veya şifre hatalı',
  logoutSuccess: 'Çıkış yapıldı',
  registerSuccess: 'Hesabınız oluşturuldu',
  // Generic CRUD
  saveSuccess: 'Değişiklikler kaydedildi',
  saveError: 'Kaydetme başarısız',
  deleteSuccess: 'Silindi',
  deleteError: 'Silme başarısız',
  updateSuccess: 'Güncellendi',
  updateError: 'Güncelleme başarısız',
  createSuccess: 'Oluşturuldu',
  createError: 'Oluşturma başarısız',
  // Network
  networkError: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
  serverError: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  unauthorized: 'Bu işlem için yetkiniz yok',
  notFound: 'İçerik bulunamadı',
} as const;

export interface ToastPromiseMessages {
  loading: string;
  success: string;
  error: string;
}

export const toastApi = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  info: (message: string) => toast(message, { icon: 'ℹ️' }),
  warning: (message: string) => toast(message, { icon: '⚠️' }),

  /**
   * Async islemleri promise ile sarmalama.
   * Ornek:
   *   await toastApi.promise(saveFn(), {
   *     loading: 'Kaydediliyor...',
   *     success: 'Kaydedildi',
   *     error: 'Kaydedilemedi',
   *   });
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: ToastPromiseMessages
  ): Promise<T> =>
    toast.promise(promise, messages) as Promise<T>,

  /** Network hata varsayilan mesaji */
  network: () => toast.error(TOAST_MESSAGES.networkError),

  /** Dismiss all */
  dismiss: () => toast.dismiss(),
};

export default toast;
