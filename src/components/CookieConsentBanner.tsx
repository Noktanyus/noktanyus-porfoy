/**
 * @file CookieConsentBanner — KVKK/GDPR uyumlu çerez consent banner'ı.
 *
 * - İlk ziyarette gösterilir (localStorage'da kayıt yoksa)
 * - 3 hızlı aksiyon: Hepsini kabul / Sadece zorunlu / Özelleştir
 * - Özelleştir modal'ı: granular kategori tercihi (analytics, marketing, preferences)
 * - Seçim localStorage + server'a POST edilir (KVKK Madde 5/2 kanıt için)
 * - Footer'dan tekrar açılabilir (değiştir/iptal)
 */

'use client';

import { useEffect, useState } from 'react';
import { FaCookieBite, FaCog, FaCheck, FaTimes } from 'react-icons/fa';

type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

interface ConsentState {
  necessary: true; // Her zaman true, değiştirilemez
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const STORAGE_KEY = 'noktanyus_consent_v1';
const COOKIE_NAME = 'noktanyus_consent';

function readStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed &&
      'analytics' in parsed &&
      'marketing' in parsed &&
      'preferences' in parsed
    ) {
      return {
        necessary: true,
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
        preferences: !!parsed.preferences,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function persistConsent(state: ConsentState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function clearStoredConsent() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

async function postConsent(state: ConsentState) {
  try {
    await fetch('/api/user/cookie-consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...state,
        consentText: getConsentText(),
      }),
    });
  } catch {
    // Network hatası durumunda sessizce devam et — UI hala localStorage'da
  }
}

function getConsentText(): string {
  return `KVKK Madde 5/2 ve GDPR Article 6/7 kapsamında, aşağıdaki çerez kategorilerine onay veriyorum: Zorunlu (her zaman aktif). ${Date.now()}`;
}

function generateSessionToken(): string {
  return `anon_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  // Mount: storage kontrol
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Anonymous session token (cookie'de tutulur)
    if (!document.cookie.includes('nok_session')) {
      const token = generateSessionToken();
      document.cookie = `nok_session=${token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }

    const stored = readStoredConsent();
    if (!stored) {
      // İlk ziyaret — banner'ı göster (300ms gecikme ile)
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setConsent(stored);
    }
  }, []);

  // Footer'dan manuel açma için global event listener
  useEffect(() => {
    const handler = () => {
      const stored = readStoredConsent();
      setConsent(
        stored ?? {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false,
        }
      );
      setShowModal(true);
    };
    window.addEventListener('open-cookie-settings', handler);
    return () => window.removeEventListener('open-cookie-settings', handler);
  }, []);

  const acceptAll = async () => {
    const state: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    persistConsent(state);
    await postConsent(state);
    setConsent(state);
    setVisible(false);
    setShowModal(false);
  };

  const acceptOnlyNecessary = async () => {
    const state: ConsentState = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    persistConsent(state);
    await postConsent(state);
    setConsent(state);
    setVisible(false);
    setShowModal(false);
  };

  const saveCustom = async () => {
    persistConsent(consent);
    await postConsent(consent);
    setVisible(false);
    setShowModal(false);
  };

  const revokeAll = async () => {
    clearStoredConsent();
    await acceptOnlyNecessary();
  };

  if (!visible && !showModal) return null;

  return (
    <>
      {/* Bottom Banner */}
      {visible && !showModal && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white dark:bg-gray-900 border-t-4 border-blue-500 shadow-2xl"
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-desc"
        >
          <div className="container-responsive flex flex-col md:flex-row items-start md:items-center gap-4">
            <FaCookieBite
              className="w-8 h-8 text-orange-500 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p id="cookie-banner-title" className="font-semibold">
                Çerez Tercihleriniz
              </p>
              <p id="cookie-banner-desc" className="text-sm text-muted-foreground">
                Sitemizde deneyimi iyileştirmek için çerezler kullanıyoruz. KVKK
                Madde 5/2 uyarınca açık rızanız gereklidir. Detaylı bilgi için{' '}
                <a
                  href="/gizlilik-politikasi"
                  className="text-blue-600 hover:underline"
                >
                  gizlilik politikamızı
                </a>{' '}
                inceleyebilirsiniz.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="admin-btn text-xs"
              >
                <FaCog className="w-3 h-3" />
                Özelleştir
              </button>
              <button
                type="button"
                onClick={acceptOnlyNecessary}
                className="admin-btn text-xs"
              >
                Sadece Zorunlu
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="admin-btn admin-btn-primary text-xs"
              >
                <FaCheck className="w-3 h-3" />
                Hepsini Kabul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Granular Settings Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaCog className="text-blue-500" />
                Çerez Ayarları
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Kapat"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Hangi kategorilerdeki çerezlere izin veriyorsunuz?
                Zorunlu çerezler her zaman aktiftir (oturum, güvenlik).
              </p>

              <ConsentToggle
                label="Zorunlu"
                description="Oturum yönetimi, güvenlik ve temel işlevsellik için gerekli. Kapatılamaz."
                checked
                disabled
                onChange={() => {}}
              />

              <ConsentToggle
                label="Analitik"
                description="Anonim kullanım istatistikleri (sayfa görüntülenme, trafik kaynağı)."
                checked={consent.analytics}
                onChange={(v) =>
                  setConsent((c) => ({ ...c, analytics: v }))
                }
              />

              <ConsentToggle
                label="Pazarlama"
                description="Kişiselleştirilmiş reklam ve kampanya ölçümleme."
                checked={consent.marketing}
                onChange={(v) =>
                  setConsent((c) => ({ ...c, marketing: v }))
                }
              />

              <ConsentToggle
                label="Tercihler"
                description="Dil, tema ve bölgesel ayarları hatırlama."
                checked={consent.preferences}
                onChange={(v) =>
                  setConsent((c) => ({ ...c, preferences: v }))
                }
              />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={revokeAll}
                className="admin-btn text-xs text-red-600"
              >
                Tüm İzni İptal Et
              </button>
              <button
                type="button"
                onClick={acceptOnlyNecessary}
                className="admin-btn text-xs"
              >
                Sadece Zorunlu
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="admin-btn text-xs"
              >
                Tümünü Kabul
              </button>
              <button
                type="button"
                onClick={saveCustom}
                className="admin-btn admin-btn-primary text-xs"
              >
                <FaCheck className="w-3 h-3" />
                Tercihlerimi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ConsentToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

function ConsentToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: ConsentToggleProps) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span
          className={`relative w-11 h-6 rounded-full transition ${
            checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              checked ? 'translate-x-5' : ''
            }`}
          />
        </span>
      </label>
    </div>
  );
}

/**
 * Footer'dan çağrılan yardımcı — banner'ı manuel olarak açar.
 * Footer'da bir link onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
 * ile kullanılabilir.
 */
export function openCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('open-cookie-settings'));
  }
}
