/**
 * ProfileSetupStep — kullanıcının isim/avatar bilgilerini güncellemesini sağlar.
 * PATCH /api/user/profile ile entegre, başarı sonrası bir sonraki adıma ilerler.
 */

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaUserCircle, FaArrowRight } from 'react-icons/fa';

interface ProfileSetupStepProps {
  initialName?: string;
  initialImage?: string | null;
  onNext: () => void;
  onSkip: () => void;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/initials/svg?seed=Ziyaretci&backgroundColor=0078d4',
  'https://api.dicebear.com/7.x/initials/svg?seed=Yildiz&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/initials/svg?seed=Yildirim&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/initials/svg?seed=Phant&backgroundColor=8b5cf6',
];

export function ProfileSetupStep({
  initialName = '',
  initialImage = null,
  onNext,
  onSkip,
}: ProfileSetupStepProps) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<string | null>(initialImage ?? PRESET_AVATARS[0]);
  const [pending, setPending] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error('İsim en az 2 karakter olmalı');
      return;
    }
    setPending(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, image: avatar }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || 'Profil güncellenemedi');
      }
      toast.success('Profil güncellendi!');
      onNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-4 border-white/20 shadow-lg bg-white/10"
            />
          ) : (
            <FaUserCircle className="w-20 h-20 text-gray-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">Avatar seç</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {PRESET_AVATARS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAvatar(preset)}
              className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                avatar === preset
                  ? 'border-primary scale-110'
                  : 'border-white/20 hover:scale-105'
              }`}
              aria-label="Avatar seçimi"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preset} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="onb-name" className="block text-sm font-medium mb-1">
          Adın
        </label>
        <input
          id="onb-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. Noktanyus"
          maxLength={100}
          className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          disabled={pending}
          className="flex-1 admin-btn admin-btn-outline"
        >
          Atla
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="flex-1 admin-btn admin-btn-primary"
        >
          {pending ? 'Kaydediliyor...' : 'Devam'} <FaArrowRight className="ml-2 inline" />
        </button>
      </div>
    </div>
  );
}

export default ProfileSetupStep;
