'use client';

/**
 * GlobalSearch — Header'dan tetiklenen global arama modalı.
 *
 * Özellikler:
 *  - Ctrl+K / Cmd+K ile her yerden açılır
 *  - 300ms debounce ile API'ye istek atar
 *  - Blog, proje, ürün ve planları kategorize gösterir
 *  - Klavye: Esc kapatır, sonuçlar arası ok tuşları ile gezinilebilir
 *  - Erişilebilirlik: ARIA, focus trap, body scroll lock
 *
 * Dışarıdan açmak için: `window.dispatchEvent(new Event(OPEN_EVENT))`
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { FaSearch, FaTimes, FaArrowRight } from 'react-icons/fa';
import { formatCurrency, cn } from '@/lib/utils';

/** Dışarıdan modalı açmak için dispatch edilecek custom event. */
export const OPEN_EVENT = 'noktanyus:open-global-search';

type SearchType = 'blog' | 'project' | 'product' | 'plan';

interface SearchResult {
  type: SearchType;
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  category?: string;
  technologies?: unknown;
  priceCents?: number;
  currency?: string;
}

interface SearchResponse {
  blog: SearchResult[];
  project: SearchResult[];
  product: SearchResult[];
  plan: SearchResult[];
  total: number;
}

export function GlobalSearch() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ctrl+K / Cmd+K + Esc kısayolları + custom event listener
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    const eventHandler = () => setOpen(true);

    window.addEventListener('keydown', keyHandler);
    window.addEventListener(OPEN_EVENT, eventHandler);
    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener(OPEN_EVENT, eventHandler);
    };
  }, [open]);

  // Modal açılınca focus, kapanınca reset + body scroll lock
  useEffect(() => {
    if (open) {
      document.body.classList.add('body-scroll-lock');
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        clearTimeout(t);
        document.body.classList.remove('body-scroll-lock');
      };
    }
    setQuery('');
    setResults(null);
    setActiveIndex(0);
    setSearchError(null);
    document.body.classList.remove('body-scroll-lock');
  }, [open]);

  // Debounce'lı arama
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setResults(null);
          setSearchError('Arama şu an yapılamıyor. Lütfen daha sonra tekrar deneyin.');
          return;
        }
        const data = await res.json();
        if (data?.success) {
          setResults(data.data);
          setActiveIndex(0);
        } else {
          setResults(null);
        }
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.error('Search error', err);
          setResults(null);
          setSearchError('Arama şu an yapılamıyor. Lütfen daha sonra tekrar deneyin.');
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router]
  );

  const modal = open ? (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Global arama"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-2xl glass-card-premium overflow-hidden shadow-2xl z-[10000] bg-background border border-border rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <SearchInput
          inputRef={inputRef}
          query={query}
          loading={loading}
          onChange={setQuery}
          onClose={closeSearch}
        />
        <ResultsList
          query={query}
          results={results}
          loading={loading}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onSelect={handleSelect}
          searchError={searchError}
        />
        <Footer results={results} hasError={!!searchError} />
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openSearch();
        }}
        className="touch-target rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 p-2 flex items-center justify-center min-h-[44px] min-w-[44px]"
        aria-label="Aramayı aç (Ctrl+K)"
        title="Ara (Ctrl+K)"
      >
        <FaSearch className="w-4 h-4 text-slate-700 dark:text-slate-300" aria-hidden="true" />
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}

/* -------------------------- Sub Components -------------------------- */

interface SearchInputProps {
  inputRef: React.RefObject<HTMLInputElement>;
  query: string;
  loading: boolean;
  onChange: (v: string) => void;
  onClose: () => void;
}

function SearchInput({ inputRef, query, loading, onChange, onClose }: SearchInputProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-border">
      <FaSearch className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Blog, proje, ürün veya plan ara..."
        className="flex-1 min-w-0 min-h-[44px] bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground"
        autoComplete="off"
        spellCheck={false}
        aria-label="Arama terimi"
      />
      {loading && (
        <span className="text-xs text-muted-foreground whitespace-nowrap" aria-live="polite">
          Aranıyor...
        </span>
      )}
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 hover:bg-muted rounded transition-colors"
        aria-label="Aramayı kapat"
      >
        <FaTimes aria-hidden="true" />
      </button>
    </div>
  );
}

interface ResultsListProps {
  query: string;
  results: SearchResponse | null;
  loading: boolean;
  activeIndex: number;
  setActiveIndex: (n: number) => void;
  onSelect: (url: string) => void;
  searchError?: string | null;
}

function ResultsList({
  query,
  results,
  loading,
  activeIndex,
  setActiveIndex,
  onSelect,
  searchError,
}: ResultsListProps) {
  const flat = useMemo(() => {
    if (!results) return [];
    return [...results.blog, ...results.project, ...results.product, ...results.plan];
  }, [results]);

  // Klavye navigasyonu
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!flat.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((activeIndex + 1) % flat.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((activeIndex - 1 + flat.length) % flat.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = flat[activeIndex];
        if (r) onSelect(getResultUrl(r));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flat, activeIndex, setActiveIndex, onSelect]);

  return (
    <div className="max-h-[60vh] overflow-y-auto" role="listbox" aria-label="Arama sonuçları">
      {query.length < 2 && !searchError && <EmptyState />}

      {searchError && <ErrorState message={searchError} />}

      {query.length >= 2 && loading && !results && !searchError && <LoadingState />}

      {query.length >= 2 && !loading && results && results.total === 0 && !searchError && (
        <NoResults query={query} />
      )}

      {results && results.total > 0 && !searchError && (
        <div className="divide-y divide-border">
          {results.blog.length > 0 && (
            <SearchSection
              title="Blog"
              emoji="📝"
              results={results.blog}
              flatStart={0}
              activeIndex={activeIndex}
              flatLength={flat.length}
              onSelect={onSelect}
            />
          )}
          {results.project.length > 0 && (
            <SearchSection
              title="Projeler"
              emoji="🚀"
              results={results.project}
              flatStart={results.blog.length}
              activeIndex={activeIndex}
              flatLength={flat.length}
              onSelect={onSelect}
            />
          )}
          {results.product.length > 0 && (
            <SearchSection
              title="Mağaza"
              emoji="🛒"
              results={results.product}
              flatStart={results.blog.length + results.project.length}
              activeIndex={activeIndex}
              flatLength={flat.length}
              onSelect={onSelect}
            />
          )}
          {results.plan.length > 0 && (
            <SearchSection
              title="Planlar"
              emoji="💎"
              results={results.plan}
              flatStart={
                results.blog.length + results.project.length + results.product.length
              }
              activeIndex={activeIndex}
              flatLength={flat.length}
              onSelect={onSelect}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  emoji,
  results,
  flatStart,
  activeIndex,
  onSelect,
}: {
  title: string;
  emoji: string;
  results: SearchResult[];
  flatStart: number;
  activeIndex: number;
  flatLength: number;
  onSelect: (url: string) => void;
}) {
  return (
    <div>
      <h3 className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span aria-hidden="true">{emoji}</span> {title}
      </h3>
      {results.map((r, idx) => {
        const globalIdx = flatStart + idx;
        const isActive = globalIdx === activeIndex;
        return (
          <button
            key={`${r.type}-${r.id}`}
            type="button"
            onClick={() => onSelect(getResultUrl(r))}
            className={cn(
              'w-full flex items-center gap-3 p-3 min-h-[44px] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset',
              isActive ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'hover:bg-muted'
            )}
            role="option"
            aria-selected={isActive}
          >
            <ResultThumbnail result={r} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground truncate">{r.description}</p>
            </div>
            {r.priceCents !== undefined && r.priceCents > 0 && (
              <span className="text-xs font-semibold text-primary whitespace-nowrap">
                {formatCurrency(r.priceCents, r.currency ?? 'try')}
              </span>
            )}
            <FaArrowRight className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

function ResultThumbnail({ result }: { result: SearchResult }) {
  if (result.thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={result.thumbnail}
        alt=""
        className="w-10 h-10 rounded object-cover flex-shrink-0"
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
      aria-hidden="true"
    >
      {result.title.charAt(0).toUpperCase()}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      <FaSearch className="w-8 h-8 mx-auto mb-3 opacity-50" aria-hidden="true" />
      <p>Aramaya başlamak için en az 2 karakter girin.</p>
      <p className="mt-3 text-xs">
        İpucu:{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">
          Ctrl
        </kbd>{' '}
        +{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">
          K
        </kbd>{' '}
        ile her yerden açabilirsiniz.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground" aria-live="polite">
      <p>Aranıyor...</p>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      <p>
        <span className="font-semibold text-foreground">&ldquo;{query}&rdquo;</span> için sonuç
        bulunamadı.
      </p>
      <p className="mt-2 text-xs">Farklı anahtar kelimeler deneyin.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="p-8 text-center text-sm text-red-600 dark:text-red-400"
      role="alert"
      aria-live="assertive"
    >
      <p className="font-medium">{message}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Birkaç saniye sonra tekrar deneyebilirsiniz.
      </p>
    </div>
  );
}

function Footer({ results, hasError }: { results: SearchResponse | null; hasError: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground bg-muted/30">
      <span aria-live="polite" aria-atomic="true">
        {hasError ? 'Hata' : `${results?.total ?? 0} sonuç`}
      </span>
      <div className="flex items-center gap-3">
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-background border border-border">↑↓</kbd>{' '}
          gezin
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-background border border-border">↵</kbd> aç
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-background border border-border">Esc</kbd> kapat
        </span>
      </div>
    </div>
  );
}

function getResultUrl(r: SearchResult): string {
  switch (r.type) {
    case 'blog':
      return `/blog/${r.slug}`;
    case 'project':
      return `/projelerim/${r.slug}`;
    case 'product':
      return `/magaza/${r.slug}`;
    case 'plan':
      return `/magaza/abonelikler`;
    default:
      return '/';
  }
}

export default GlobalSearch;