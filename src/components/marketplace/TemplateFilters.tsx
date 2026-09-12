'use client';

/**
 * TemplateFilters — Vitrin filtreleme/sıralama UI.
 *
 * URL state ile çalışır (searchParams). "use client" — input değişimleri
 * router.replace ile URL'i günceller; sayfa server-side yeniden fetch yapar.
 *
 * Özellikler:
 *  - Kategori chip'leri (templateService schema ile uyumlu)
 *  - Arama input (debounced — 400ms)
 *  - Sıralama select (newest, popular, price-asc, price-desc)
 *  - Aktif filtre badge + temizle butonu
 *  - Accessible (aria-label, role="search")
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { TEMPLATE_CATEGORIES, TEMPLATE_SORTS } from '@/modules/marketplace/templateSchemas';

const CATEGORY_LABELS: Record<string, string> = {
  ecommerce: 'E-Ticaret',
  saas: 'SaaS',
  portfolio: 'Portfolyo',
  blog: 'Blog',
};

const SORT_LABELS: Record<string, string> = {
  newest: 'En Yeni',
  popular: 'En Popüler',
  'price-asc': 'Fiyat (Düşük → Yüksek)',
  'price-desc': 'Fiyat (Yüksek → Düşük)',
};

interface TemplateFiltersProps {
  /** initialSearch — server'dan gelen initial search input değeri */
  initialSearch?: string;
}

export function TemplateFilters({ initialSearch = '' }: TemplateFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const urlSearch = searchParams.get('search') ?? initialSearch;

  // Debounced search input
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL'i güncelle — search params ile yeni URL oluştur
  const updateUrl = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      // Sayfa 1'e dön her filtre değişiminde (sayfa sayfa sonuçlar anlamsızlaşır)
      if (Object.keys(changes).some((k) => k !== 'page')) {
        params.delete('page');
      }

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== urlSearch) {
        updateUrl({ search: searchInput || null });
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, urlSearch, updateUrl]);

  // URL'den search değişirse input'u senkronize et (back/forward navigation)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const hasActiveFilters = Boolean(category || urlSearch || (sort && sort !== 'newest'));

  const clearAll = () => {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  };

  return (
    <section
      className="glass-card-premium p-5 mb-8 space-y-5"
      role="search"
      aria-label="Template filtreleri"
    >
      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <label htmlFor="template-search" className="sr-only">
            Template ara
          </label>
          <FaSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="template-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Template ara (isim, tagline, açıklama)..."
            className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            autoComplete="off"
            maxLength={120}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateUrl({ search: null });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500"
              aria-label="Aramayı temizle"
            >
              <FaTimes className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex flex-col sm:w-56">
          <label htmlFor="template-sort" className="sr-only">
            Sıralama
          </label>
          <select
            id="template-sort"
            value={sort}
            onChange={(e) => updateUrl({ sort: e.target.value === 'newest' ? null : e.target.value })}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {TEMPLATE_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Kategori filtresi">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-1">
          Kategori:
        </span>
        <button
          type="button"
          onClick={() => updateUrl({ category: null })}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category
              ? 'bg-brand-primary text-white shadow'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-pressed={!category}
        >
          Tümü
        </button>
        {TEMPLATE_CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => updateUrl({ category: active ? null : c })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-primary text-white shadow'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-pressed={active}
            >
              {CATEGORY_LABELS[c] ?? c}
            </button>
          );
        })}

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <FaTimes className="w-3 h-3" aria-hidden="true" />
            Filtreleri temizle
          </button>
        )}
      </div>
    </section>
  );
}

export default TemplateFilters;