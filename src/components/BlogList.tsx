"use client";

import { useState, useMemo } from 'react';
import { Blog } from '@prisma/client';
import BlogCard from '@/components/BlogCard';
import { FaSearch } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogListProps {
  allPosts: Blog[];
}

export default function BlogList({ allPosts }: BlogListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(allPosts.map(post => post.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();

    return allPosts.filter(post => {
      // Category filter
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-5"
      >
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

        {/* Results count */}
        {(searchTerm || activeCategory !== 'all') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {filteredPosts.length} yazı bulundu
            {searchTerm && (
              <span> &mdash; &ldquo;<span className="font-semibold text-brand-primary">{searchTerm}</span>&rdquo;</span>
            )}
          </motion.p>
        )}
      </motion.div>

      {/* Blog Grid */}
      <AnimatePresence mode="wait">
        {filteredPosts.length > 0 ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {filteredPosts.map((post, idx) => (
              <BlogCard key={post.id} blog={post} index={idx} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card-premium text-center py-16 px-8"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
