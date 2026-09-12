"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Blog } from '@prisma/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogCard from '@/components/BlogCard';
import { AnimatedGrid } from '@/components/ui/AnimatedCard';
import { FaSearch, FaFire, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

type BlogSort = 'newest' | 'oldest' | 'popular';

interface BlogListProps {
  allPosts: Blog[];
  sort?: BlogSort;
}

export default function BlogList({ allPosts, sort = 'newest' }: BlogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const setSort = (next: BlogSort) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (next === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', next);
    }
    const qs = params.toString();
    router.push(qs ? `/blog?${qs}` : '/blog', { scroll: false });
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(allPosts.map(post => post.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [allPosts]);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setShowLeftArrow(hasOverflow && el.scrollLeft > 10);
    setShowRightArrow(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, categories]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 220;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  const filteredPosts = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();

    return allPosts.filter(post => {
      if (activeCategory !== 'all' && post.category !== activeCategory) {
        return false;
      }

      if (!lowercasedSearchTerm) return true;

      const titleMatch = post.title.toLowerCase().includes(lowercasedSearchTerm);
      const descriptionMatch = post.description.toLowerCase().includes(lowercasedSearchTerm);
      const tagMatch = Array.isArray(post.tags) ? post.tags.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(lowercasedSearchTerm)) : false;
      const categoryMatch = post.category.toLowerCase().includes(lowercasedSearchTerm);

      return titleMatch || descriptionMatch || tagMatch || categoryMatch;
    });
  }, [allPosts, searchTerm, activeCategory]);

  return (
    <div className="space-y-8">
      {/* Search & Filters */}
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        {/* Glass Search Bar */}
        <div className="w-full max-w-2xl glass-search">
          <label htmlFor="blog-search" className="sr-only">
            Blog yazılarında ara
          </label>
          <div className="relative flex items-center">
            <FaSearch className="absolute left-5 text-slate-400 dark:text-slate-500 w-4 h-4" aria-hidden="true" />
            <input
              id="blog-search"
              type="search"
              inputMode="search"
              placeholder="Blog yazılarında ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[44px] pl-12 pr-5 py-3.5 bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg text-base"
              aria-label="Blog yazılarında ara"
            />
          </div>
        </div>

        {/* Category Pills - Horizontally Scrollable */}
        {categories.length > 2 && (
          <div className="relative w-full max-w-2xl">
            {/* Left Scroll Button */}
            {showLeftArrow && (
              <button
                type="button"
                onClick={() => scroll('left')}
                aria-label="Önceki kategoriler"
                className="hidden sm:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md hover:scale-110 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <FaChevronLeft className="w-3 h-3" aria-hidden="true" />
              </button>
            )}

            {/* Left Gradient Fade */}
            {showLeftArrow && (
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent z-10 rounded-l-full" />
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="w-full overflow-x-auto no-scrollbar scroll-smooth py-1.5 px-2"
            >
              <div
                role="tablist"
                aria-label="Blog kategorileri"
                className="flex items-center gap-2 w-max min-w-full justify-center px-1"
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`glass-pill flex-shrink-0 whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${activeCategory === cat ? 'active' : ''}`}
                  >
                    {cat === 'all' ? 'Tümü' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Gradient Fade */}
            {showRightArrow && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent z-10 rounded-r-full" />
            )}

            {/* Right Scroll Button */}
            {showRightArrow && (
              <button
                type="button"
                onClick={() => scroll('right')}
                aria-label="Sonraki kategoriler"
                className="hidden sm:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md hover:scale-110 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <FaChevronRight className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Sort Buttons */}
        <div role="group" aria-label="Sıralama" className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSort('newest')}
            className={`glass-pill min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${sort === 'newest' ? 'active' : ''}`}
            aria-pressed={sort === 'newest'}
          >
            En Yeni
          </button>
          <button
            onClick={() => setSort('popular')}
            className={`glass-pill inline-flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${sort === 'popular' ? 'active' : ''}`}
            aria-pressed={sort === 'popular'}
          >
            <FaFire className="w-3 h-3" aria-hidden="true" />
            Popüler
          </button>
          <button
            onClick={() => setSort('oldest')}
            className={`glass-pill min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${sort === 'oldest' ? 'active' : ''}`}
            aria-pressed={sort === 'oldest'}
          >
            En Eski
          </button>
        </div>

        {/* Results count */}
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-slate-500 dark:text-slate-400"
        >
          {(searchTerm || activeCategory !== 'all' || sort !== 'newest') ? (
            <>
              {filteredPosts.length} yazı
              {sort === 'popular' && (
                <span> &mdash; <span className="font-semibold text-indigo-600 dark:text-indigo-400">popüler sıralama</span></span>
              )}
              {searchTerm && (
                <span> &mdash; &ldquo;<span className="font-semibold text-indigo-600 dark:text-indigo-400">{searchTerm}</span>&rdquo;</span>
              )}
            </>
          ) : (
            <span>{filteredPosts.length} yazı listeleniyor</span>
          )}
        </p>
      </div>

      {/* Blog Grid */}
      {filteredPosts.length > 0 ? (
        <AnimatedGrid
          staggerMs={80}
          delayMs={50}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {filteredPosts.map((post, idx) => (
            <BlogCard key={post.id} blog={post} index={idx} />
          ))}
        </AnimatedGrid>
      ) : (
        <div className="glass-card-premium text-center py-16 px-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
            <FaSearch className="w-6 h-6 text-slate-400" aria-hidden="true" />
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Sonuç bulunamadı
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Farklı anahtar kelimeler veya kategoriler deneyin.
          </p>
          {(searchTerm || activeCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('all');
              }}
              className="mt-2 px-6 py-2.5 min-h-[44px] glass-pill active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
