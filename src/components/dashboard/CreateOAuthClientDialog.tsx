/**
 * @file OAuth Client Oluşturma Dialog Bileşeni
 * @description shadcn-style modal dialog. Form: name + redirectUris[] + scopes[].
 *              Başarılı oluşturmada clientSecret sadece 1 kez gösterilir (show-once)
 *              ve "Kopyala" butonu ile panoya alınır.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaCopy, FaKey, FaPlus, FaTimes } from 'react-icons/fa';

interface ScopeOption {
  value: string;
  label: string;
  description: string;
  dangerous?: boolean;
}

const SCOPES: ScopeOption[] = [
  { value: 'read:profile', label: 'Profil Okuma', description: 'GET /api/user/profile' },
  { value: 'write:profile', label: 'Profil Yazma', description: 'PATCH /api/user/profile' },
  { value: 'read:monitor', label: 'Monitör Okuma', description: 'GET /api/monitors' },
  { value: 'write:monitor', label: 'Monitör Yazma', description: 'POST/PATCH /api/monitors' },
  { value: 'read:orders', label: 'Sipariş Okuma', description: 'GET /api/user/orders' },
  { value: 'read:ai', label: 'AI Üretimi Okuma', description: 'GET /api/user/ai' },
  { value: 'write:ai', label: 'AI Üretimi Yazma', description: 'POST /api/user/ai' },
  { value: 'read:webhooks', label: 'Webhook Okuma', description: 'GET /api/webhooks' },
  { value: 'write:webhooks', label: 'Webhook Yazma', description: 'POST /api/webhooks' },
  {
    value: 'admin',
    label: 'Tam Erişim',
    description: 'Tüm scope\'lar (önerilmez)',
    dangerous: true,
  },
];

interface CreatedClientResponse {
  id: string;
  clientId: string;
  clientSecret: string;
  name: string;
  redirectUris: string[];
  scopes: string[];
  createdAt: string;
  warning: string;
}

export function CreateOAuthClientDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedClientResponse | null>(null);

  const [name, setName] = useState('');
  const [redirectUris, setRedirectUris] = useState<string[]>(['']);
  const [scopes, setScopes] = useState<string[]>(['read:profile']);

  // Dialog açıkken: ESC kapatma + scroll kilidi + ilk input'a fokus
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && !created) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // autofocus (sadece created ekranında değilsek)
    if (!created) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, loading, created]);

  const reset = () => {
    setName('');
    setRedirectUris(['']);
    setScopes(['read:profile']);
    setCreated(null);
    setLoading(false);
  };

  const close = () => {
    setOpen(false);
    // kapanış animasyonu için reset hemen değil, bir sonraki açılışta
    setTimeout(reset, 200);
  };

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const updateRedirectUri = (idx: number, val: string) => {
    setRedirectUris((prev) => prev.map((u, i) => (i === idx ? val : u)));
  };

  const addRedirectUri = () => {
    if (redirectUris.length >= 10) {
      toast.error('En fazla 10 redirect URI eklenebilir');
      return;
    }
    setRedirectUris((prev) => [...prev, '']);
  };

  const removeRedirectUri = (idx: number) => {
    if (redirectUris.length === 1) return;
    setRedirectUris((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation (Zod server'da da var)
    if (!name.trim() || name.length < 1 || name.length > 100) {
      toast.error('İsim 1-100 karakter arasında olmalı');
      return;
    }
    const cleanedUris = redirectUris.map((u) => u.trim()).filter(Boolean);
    if (cleanedUris.length === 0) {
      toast.error('En az 1 redirect URI gerekli');
      return;
    }
    if (scopes.length === 0) {
      toast.error('En az 1 scope seçilmeli');
      return;
    }
    for (const uri of cleanedUris) {
      try {
        const u = new URL(uri);
        if (u.protocol !== 'https:' && !(u.protocol === 'http:' && u.hostname === 'localhost')) {
          toast.error(`${uri}: yalnızca https:// veya http://localhost`);
          return;
        }
        if (uri.includes('#')) {
          toast.error('Redirect URI fragment içeremez');
          return;
        }
      } catch {
        toast.error(`Geçersiz URL: ${uri}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/oauth/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          redirectUris: cleanedUris,
          scopes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? 'Oluşturma başarısız');
      }
      setCreated(data.data);
      toast.success('OAuth client oluşturuldu');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandı`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-btn admin-btn-primary"
      >
        <FaPlus className="w-3 h-3" />
        Yeni OAuth Client
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            // backdrop click → sadece created ekranı dışındaysa
            if (e.target === e.currentTarget && !loading && !created) close();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="oauth-dialog-title"
        >
          <div
            ref={dialogRef}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card-premium p-6 animate-in fade-in zoom-in-95"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <FaKey className="w-4 h-4 text-primary" />
                <h2 id="oauth-dialog-title" className="text-lg font-bold">
                  {created ? 'Client Oluşturuldu' : 'Yeni OAuth 2.0 Client'}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                aria-label="Kapat"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Show-once: client credentials ekranı */}
            {created ? (
              <div className="space-y-4">
                <div className="p-4 border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ Client Secret sadece bir kez gösterilir
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Şimdi kopyalayın. Bu pencereyi kapattıktan sonra secret'a bir daha
                    erişilemez — yeni client oluşturmanız gerekir.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Client ID
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border">
                    <code className="text-xs flex-1 overflow-x-auto font-mono break-all">
                      {created.clientId}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(created.clientId, 'Client ID')}
                      className="admin-btn admin-btn-secondary flex-shrink-0 text-xs"
                      aria-label="Client ID kopyala"
                    >
                      <FaCopy className="w-3 h-3" />
                      Kopyala
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Client Secret (show-once)
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border border-yellow-500/50">
                    <code className="text-xs flex-1 overflow-x-auto font-mono break-all">
                      {created.clientSecret}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(created.clientSecret, 'Client Secret')}
                      className="admin-btn admin-btn-primary flex-shrink-0 text-xs"
                      aria-label="Client Secret kopyala"
                    >
                      <FaCopy className="w-3 h-3" />
                      Kopyala
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                  <p className="font-medium">Örnek token isteği (curl):</p>
                  <pre className="font-mono text-[10px] overflow-x-auto whitespace-pre">
{`curl -X POST https://yourdomain.com/api/auth/oauth/token \\
  -d grant_type=authorization_code \\
  -d client_id=${created.clientId} \\
  -d client_secret=YOUR_SECRET \\
  -d code=AUTH_CODE \\
  -d redirect_uri=https://yourapp.com/callback \\
  -d code_verifier=PKCE_VERIFIER`}
                  </pre>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="admin-btn admin-btn-secondary flex-1 justify-center"
                  >
                    Kapat
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="admin-btn admin-btn-primary flex-1 justify-center"
                  >
                    Başka Bir Client Oluştur
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    İsim <span className="text-destructive">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={1}
                    maxLength={100}
                    className="admin-input"
                    placeholder="My Mobile App, Production Server, vb."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Client'ı tanımlayan görünür isim
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium">
                      Redirect URIs <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addRedirectUri}
                      disabled={redirectUris.length >= 10}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      + URI Ekle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {redirectUris.map((uri, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={uri}
                          onChange={(e) => updateRedirectUri(idx, e.target.value)}
                          placeholder="https://app.example.com/callback"
                          className="admin-input flex-1"
                        />
                        {redirectUris.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRedirectUri(idx)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                            aria-label="URI kaldır"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    OAuth callback URL'i. Yalnızca <code className="font-mono">https://</code>{' '}
                    veya <code className="font-mono">http://localhost</code> (dev).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    İzinler (Scopes) <span className="text-destructive">*</span>
                  </label>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {SCOPES.map((scope) => (
                      <label
                        key={scope.value}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border hover:bg-muted cursor-pointer transition-colors ${
                          scopes.includes(scope.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={scopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-xs ${
                              scope.dangerous ? 'text-destructive' : ''
                            }`}
                          >
                            {scope.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {scope.value}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={close}
                    disabled={loading}
                    className="admin-btn admin-btn-secondary flex-1 justify-center"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim() || scopes.length === 0}
                    className="admin-btn admin-btn-primary flex-1 justify-center"
                  >
                    {loading ? 'Oluşturuluyor...' : 'Client Oluştur'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
