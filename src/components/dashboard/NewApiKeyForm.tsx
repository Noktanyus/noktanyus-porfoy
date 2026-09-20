/**
 * @file Yeni API Anahtarı Formu — Granüler Endpoint Yetkilendirme Motoru.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  FaCopy,
  FaSearch,
  FaTimes,
  FaCheckDouble,
  FaShieldAlt,
  FaCheck,
  FaFilter,
} from 'react-icons/fa';
import {
  API_SCOPES_CATALOG,
  API_SCOPE_CATEGORIES,
  type ApiScopeCategoryKey,
  type ApiScopeItem,
} from '@/modules/api-keys/apiScopesCatalog';

interface CreatedKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  warning: string;
}

export function NewApiKeyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKeyResponse | null>(null);

  // Form state — varsayılan olarak temel TR doğrulamaları seçili gelir
  const [form, setForm] = useState({
    name: '',
    scopes: [
      'api:validate:identity',
      'api:validate:iban',
      'api:iban:bank',
      'api:validate:phone',
      'api:validate:plate',
    ] as string[],
    rateLimit: 60,
    monthlyQuota: '' as string | number,
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleScope = (scopeId: string) => {
    setForm((prev) => {
      const exists = prev.scopes.includes(scopeId);
      return {
        ...prev,
        scopes: exists ? prev.scopes.filter((s) => s !== scopeId) : [...prev.scopes, scopeId],
      };
    });
  };

  const handleSelectAll = () => {
    const allIds = API_SCOPES_CATALOG.map((s) => s.id);
    setForm((prev) => ({ ...prev, scopes: allIds }));
    toast.success('Tüm API izinleri seçildi');
  };

  const handleClearAll = () => {
    setForm((prev) => ({ ...prev, scopes: [] }));
  };

  const handleApplyPreset = (preset: 'tr' | 'finance' | 'admin') => {
    if (preset === 'admin') {
      setForm((prev) => ({ ...prev, scopes: ['admin'] }));
      toast.success('Tam Yetki (Admin) şemsiye izni seçildi');
      return;
    }

    if (preset === 'tr') {
      const trIds = API_SCOPES_CATALOG.filter(
        (s) => s.category === 'tr_official' || s.category === 'geo'
      ).map((s) => s.id);
      setForm((prev) => ({
        ...prev,
        scopes: Array.from(new Set([...prev.scopes, ...trIds])),
      }));
      toast.success('TR Kimlik & Adres izinleri eklendi');
      return;
    }

    if (preset === 'finance') {
      const finIds = API_SCOPES_CATALOG.filter(
        (s) => s.category === 'finance' || s.category === 'labor'
      ).map((s) => s.id);
      setForm((prev) => ({
        ...prev,
        scopes: Array.from(new Set([...prev.scopes, ...finIds])),
      }));
      toast.success('Finans & Muhasebe izinleri eklendi');
      return;
    }
  };

  const toggleCategoryGroup = (catKey: ApiScopeCategoryKey) => {
    const categoryScopes = API_SCOPES_CATALOG.filter((s) => s.category === catKey).map((s) => s.id);
    const allSelected = categoryScopes.every((id) => form.scopes.includes(id));

    if (allSelected) {
      // Remove all from this category
      setForm((prev) => ({
        ...prev,
        scopes: prev.scopes.filter((id) => !categoryScopes.includes(id)),
      }));
    } else {
      // Add all from this category
      setForm((prev) => ({
        ...prev,
        scopes: Array.from(new Set([...prev.scopes, ...categoryScopes])),
      }));
    }
  };

  // Filtered scopes
  const filteredScopes = useMemo(() => {
    return API_SCOPES_CATALOG.filter((scope) => {
      // Category filter
      if (selectedCategory !== 'all' && scope.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = scope.label.toLowerCase().includes(query);
        const matchesId = scope.id.toLowerCase().includes(query);
        const matchesDesc = scope.description.toLowerCase().includes(query);
        const matchesEndpoint = scope.endpoint ? scope.endpoint.toLowerCase().includes(query) : false;
        return matchesName || matchesId || matchesDesc || matchesEndpoint;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  // Group filtered scopes by category
  const groupedScopes = useMemo(() => {
    const map = new Map<ApiScopeCategoryKey, ApiScopeItem[]>();
    filteredScopes.forEach((scope) => {
      const existing = map.get(scope.category) || [];
      existing.push(scope);
      map.set(scope.category, existing);
    });
    return map;
  }, [filteredScopes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.scopes.length === 0) {
      toast.error('En az 1 izin seçmelisiniz');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        scopes: form.scopes,
        rateLimit: form.rateLimit,
        ...(form.monthlyQuota ? { monthlyQuota: Number(form.monthlyQuota) } : {}),
      };

      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? 'Oluşturma başarısız');
      }
      setCreatedKey(data.data);
      toast.success('API anahtarı başarıyla oluşturuldu');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (createdKey) {
    const sampleScope = form.scopes.find((s) => s.startsWith('api:validate:')) ?? form.scopes[0];
    const sampleEndpoint = sampleScope?.startsWith('api:')
      ? `/${sampleScope.replace('api:', '').replace(/:/g, '/')}`
      : '/validate/iban';

    return (
      <div className="space-y-5">
        <div className="glass-card-premium p-6 border-2 border-green-500 bg-green-50/70 dark:bg-green-950/20">
          <div className="flex items-center gap-2 mb-2">
            <FaShieldAlt className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-bold text-green-900 dark:text-green-200">
              API Anahtarı Başarıyla Oluşturuldu
            </h2>
          </div>
          <p className="text-sm text-green-800 dark:text-green-300 mb-4">
            <strong>Bu anahtarı güvenli bir yere kaydedin.</strong> Güvenlik nedeniyle bir daha görüntülenemez.
          </p>

          <div className="flex items-center gap-2 p-3 bg-background rounded-xl border border-border">
            <code className="text-xs flex-1 overflow-x-auto font-mono break-all text-foreground font-semibold">
              {createdKey.key}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(createdKey.key);
                toast.success('Kopyalandı');
              }}
              className="admin-btn admin-btn-primary flex-shrink-0 text-xs px-3 py-1.5"
            >
              <FaCopy className="w-3.5 h-3.5" />
              <span>Kopyala</span>
            </button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground bg-muted/60 p-3.5 rounded-xl border border-border/50">
            <p className="font-semibold text-foreground mb-1">Hızlı Kullanım Örneği (cURL):</p>
            <pre className="mt-1 font-mono text-[11px] overflow-x-auto p-2.5 rounded-lg bg-background text-foreground/90">
{`curl -X POST https://yourdomain.com/api/v1${sampleEndpoint} \\
  -H "Authorization: Bearer ${createdKey.key}" \\
  -H "Content-Type: application/json" \\
  -d '{"iban":"TR330006100511123456789012"}'`}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/api-keys')}
            className="admin-btn admin-btn-primary"
          >
            Anahtarlar Listesine Dön
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatedKey(null);
              setForm({
                name: '',
                scopes: ['api:validate:identity', 'api:validate:iban'],
                rateLimit: 60,
                monthlyQuota: '',
              });
            }}
            className="admin-btn admin-btn-secondary"
          >
            Yeni Bir Anahtar Daha Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Genel Ayarlar */}
      <div className="glass-card-premium p-6 space-y-4">
        <h2 className="text-base font-semibold border-b border-border/50 pb-2">
          1. Anahtar Bilgileri ve Sınırları
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Anahtar İsmi <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
            maxLength={100}
            className="admin-input"
            placeholder="Örn. Mobil Uygulama, E-Ticaret Entegrasyonu, Muhasebe Botu"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Rate Limit (istek/dakika)</label>
            <input
              type="number"
              value={form.rateLimit}
              onChange={(e) => setForm({ ...form, rateLimit: parseInt(e.target.value) || 60 })}
              min="1"
              max="10000"
              className="admin-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Varsayılan 60 istek/dk.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Aylık Kota Sınırı <span className="text-xs text-muted-foreground">(opsiyonel)</span>
            </label>
            <input
              type="number"
              value={form.monthlyQuota}
              onChange={(e) => setForm({ ...form, monthlyQuota: e.target.value })}
              min="1"
              className="admin-input"
              placeholder="Boş bırakılırsa sınırsız"
            />
            <p className="text-xs text-muted-foreground mt-1">Örn. 50000 (Aylık üst tavan)</p>
          </div>
        </div>
      </div>

      {/* İzinler & Granüler API Seçimi */}
      <div className="glass-card-premium p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div>
            <h2 className="text-base font-semibold">2. Granüler API İzinleri</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Anahtarın erişebileceği API uç noktalarını tek tek seçin veya hazır paketleri uygulayın.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary">
              {form.scopes.length} / {API_SCOPES_CATALOG.length} İzin Seçili
            </span>
          </div>
        </div>

        {/* Hızlı Eylemler & Filtreler */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <FaCheckDouble className="w-3 h-3 text-brand-primary" />
              Tümünü Seç
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted text-muted-foreground transition-colors flex items-center gap-1.5"
            >
              <FaTimes className="w-3 h-3" />
              Temizle
            </button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <button
              type="button"
              onClick={() => handleApplyPreset('tr')}
              className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
            >
              + TR Doğrulama Paketi
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('finance')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
            >
              + Finans Paketi
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('admin')}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
            >
              Tam Yetki (Admin)
            </button>
          </div>

          {/* Arama Input */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="API adı veya uç nokta ara..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-border bg-background text-xs focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Kategori Filtre Butonları */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-foreground text-background font-semibold'
                : 'bg-muted/70 hover:bg-muted text-muted-foreground'
            }`}
          >
            Tüm Kategoriler ({API_SCOPES_CATALOG.length})
          </button>
          {(Object.keys(API_SCOPE_CATEGORIES) as ApiScopeCategoryKey[]).map((catKey) => {
            const cat = API_SCOPE_CATEGORIES[catKey];
            const countInCat = API_SCOPES_CATALOG.filter((s) => s.category === catKey).length;
            const selectedInCat = API_SCOPES_CATALOG.filter(
              (s) => s.category === catKey && form.scopes.includes(s.id)
            ).length;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === catKey
                    ? 'bg-brand-primary text-white font-semibold'
                    : 'bg-muted/70 hover:bg-muted text-muted-foreground'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedInCat > 0
                      ? 'bg-brand-primary/20 text-brand-primary dark:text-white font-bold'
                      : 'opacity-60'
                  }`}
                >
                  {selectedInCat > 0 ? `${selectedInCat}/${countInCat}` : countInCat}
                </span>
              </button>
            );
          })}
        </div>

        {/* Kategorize Edilmiş API Listesi */}
        <div className="space-y-6 pt-2">
          {groupedScopes.size === 0 ? (
            <div className="p-8 text-center border rounded-xl border-dashed">
              <FaFilter className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">Arama kriterlerine uygun API bulunamadı</p>
              <p className="text-xs text-muted-foreground mt-1">
                Filtreleri temizleyerek veya farklı bir arama kelimesi girerek tekrar deneyin.
              </p>
            </div>
          ) : (
            Array.from(groupedScopes.entries()).map(([catKey, scopes]) => {
              const categoryInfo = API_SCOPE_CATEGORIES[catKey];
              const allCategoryIds = scopes.map((s) => s.id);
              const allCatSelected = allCategoryIds.every((id) => form.scopes.includes(id));
              const someCatSelected = allCategoryIds.some((id) => form.scopes.includes(id));

              return (
                <div
                  key={catKey}
                  className="border border-border/80 rounded-xl overflow-hidden bg-background/50"
                >
                  {/* Kategori Başlığı */}
                  <div className="bg-muted/40 px-4 py-3 border-b border-border/60 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span>{categoryInfo.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          ({scopes.length} API)
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {categoryInfo.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCategoryGroup(catKey)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors flex items-center gap-1 ${
                        allCatSelected
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : someCatSelected
                          ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                          : 'border-border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {allCatSelected && <FaCheck className="w-2.5 h-2.5" />}
                      <span>{allCatSelected ? 'Kategoriyi Bırak' : 'Kategoriyi Seç'}</span>
                    </button>
                  </div>

                  {/* API İzin Kartları Izgarası */}
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {scopes.map((scope) => {
                      const isChecked = form.scopes.includes(scope.id);

                      return (
                        <label
                          key={scope.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
                              : 'border-border/60 hover:border-border hover:bg-muted/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleScope(scope.id)}
                            className="mt-1 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary accent-brand-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-semibold ${
                                  scope.dangerous ? 'text-destructive font-bold' : 'text-foreground'
                                }`}
                              >
                                {scope.label}
                              </span>
                              {scope.endpoint && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {scope.endpoint}
                                </span>
                              )}
                              {scope.isLegacy && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                                  Şemsiye
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                              {scope.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Kaydet ve Oluştur Butonu */}
      <div className="sticky bottom-4 z-10 glass-card-premium p-4 border border-border flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div>
          <p className="text-sm font-semibold">
            Seçilen İzinler:{' '}
            <span className="text-brand-primary font-bold">{form.scopes.length} API</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {form.scopes.length === 0
              ? 'Anahtar oluşturmak için en az 1 izin seçmelisiniz'
              : 'Seçili izinler için erişim yetkisi tanımlanacak'}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || form.scopes.length === 0 || !form.name.trim()}
          className="admin-btn admin-btn-primary px-6 py-2.5 text-sm font-semibold shadow-md disabled:opacity-50"
        >
          {loading ? 'Oluşturuluyor...' : `API Anahtarını Oluştur (${form.scopes.length} İzin)`}
        </button>
      </div>
    </form>
  );
}
