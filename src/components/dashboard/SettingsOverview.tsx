'use client';

/**
 * Dashboard — Hesap Ayarları (Profil, Şifre, Tehlikeli Bölge)
 *
 * Server component (page.tsx) auth + DB işlemlerini yapar,
 * bu client component form state ve API çağrılarını yönetir.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast, Toaster } from 'react-hot-toast';
import { FaUser, FaLock, FaTrash, FaCamera, FaCheckCircle } from 'react-icons/fa';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date | string;
}

export function SettingsOverview({ user }: { user: User }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Güncellenemedi');
      toast.success('Profil güncellendi');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Yeni şifre en az 8 karakter olmalı');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Şifre değiştirilemedi');
      toast.success('Şifre değiştirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = window.prompt('Hesabınızı silmek için şifrenizi girin:');
    if (!password) return;
    if (!window.confirm('Hesabınız kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Hesap silinemedi');
      toast.success('Hesap silindi');
      // Cookie temizle + yönlendir
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu');
      setLoading(false);
    }
  };

  const createdAt = typeof user.createdAt === 'string'
    ? new Date(user.createdAt)
    : user.createdAt;

  return (
    <>
      {/* Toaster: toast.success / toast.error çağrıları için gerekli */}
      <Toaster position="top-right" />

      <div className="space-y-6 max-w-2xl">
        {/* Profil */}
        <section className="glass-card-premium p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaUser className="text-brand-primary" /> Profil Bilgileri
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shrink-0">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name ?? ''} className="w-full h-full object-cover" />
                ) : (
                  (user.name || user.email).charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <button
                  type="button"
                  className="text-sm text-brand-primary hover:underline inline-flex items-center gap-1"
                  onClick={() => toast('Fotoğraf yükleme yakında eklenecek', { icon: 'ℹ️' })}
                >
                  <FaCamera /> Fotoğraf Değiştir
                </button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 1MB.</p>
              </div>
            </div>

            <div>
              <label htmlFor="settings-name" className="block text-sm font-medium mb-2">
                İsim
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={100}
                className="admin-input"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-email" className="block text-sm font-medium mb-2">
                E-posta
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="settings-email"
                  type="email"
                  value={user.email}
                  disabled
                  className="admin-input opacity-60 cursor-not-allowed flex-1"
                />
                {user.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <FaCheckCircle /> Doğrulandı
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                E-posta değiştirmek için destek ekibiyle iletişime geçin.
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              Üyelik tarihi: {createdAt.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kaydediliyor...' : 'Profili Güncelle'}
            </button>
          </form>
        </section>

        {/* Şifre */}
        <section className="glass-card-premium p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaLock className="text-brand-primary" /> Şifre Değiştir
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="settings-current-password" className="block text-sm font-medium mb-2">
                Mevcut Şifre
              </label>
              <input
                id="settings-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="settings-new-password" className="block text-sm font-medium mb-2">
                Yeni Şifre
              </label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                className="admin-input"
              />
              <p className="text-xs text-muted-foreground mt-1">En az 8 karakter.</p>
            </div>
            <div>
              <label htmlFor="settings-confirm-password" className="block text-sm font-medium mb-2">
                Yeni Şifre (Tekrar)
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                className="admin-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        </section>

        {/* Tehlikeli Bölge */}
        <section className="glass-card-premium p-6 border-2 border-red-200 dark:border-red-900">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
            <FaTrash /> Tehlikeli Bölge
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Hesabınızı sildiğinizde tüm verileriniz (monitörler, API anahtarları, alert kanalları,
            abonelikler) kalıcı olarak silinir. Bu işlem <strong>geri alınamaz</strong>.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={loading}
            className="admin-btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTrash className="inline mr-2" />
            Hesabı Kalıcı Olarak Sil
          </button>
        </section>
      </div>
    </>
  );
}