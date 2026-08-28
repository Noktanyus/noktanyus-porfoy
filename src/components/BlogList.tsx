"use client";

import { useState, useMemo } from 'react';
import { Blog } from '@prisma/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogCard from '@/components/BlogCard';
import { AnimatedGrid } from '@/components/ui/AnimatedCard';
import { FaSearch, FaFire } from 'react-icons/fa';

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
          <div className="relative flex items-center">
            <FaSearch className="absolute left-5 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Blog yazılarında ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none text-base"
            />
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`glass-pill ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat === 'all' ? 'Tümü' : cat}
              </button>
            ))}
          </div>
        )}

        {/* Sort Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSort('newest')}
            className={`glass-pill ${sort === 'newest' ? 'active' : ''}`}
            aria-pressed={sort === 'newest'}
          >
            En Yeni
          </button>
          <button
            onClick={() => setSort('popular')}
            className={`glass-pill inline-flex items-center gap-1.5 ${sort === 'popular' ? 'active' : ''}`}
            aria-pressed={sort === 'popular'}
          >
            <FaFire className="w-3 h-3" />
            Popüler
          </button>
          <button
            onClick={() => setSort('oldest')}
            className={`glass-pill ${sort === 'oldest' ? 'active' : ''}`}
            aria-pressed={sort === 'oldest'}
          >
            En Eski
          </button>
        </div>

        {/* Results count */}
        {(searchTerm || activeCategory !== 'all' || sort !== 'newest') && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredPosts.length} yazı
            {sort === 'popular' && (
              <span> &mdash; <span className="font-semibold text-brand-primary">popüler sıralama</span></span>
            )}
            {searchTerm && (
              <span> &mdash; &ldquo;<span className="font-semibold text-brand-primary">{searchTerm}</span>&rdquo;</span>
            )}
          </p>
        )}
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm flex items-center justify-center">
            <FaSearch className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            Sonuç bulunamadı
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Farklı anahtar kelimeler veya kategoriler deneyin.
          </p>
          {(searchTerm || activeCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('all');
              }}
              className="mt-6 px-6 py-2.5 glass-pill active"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
