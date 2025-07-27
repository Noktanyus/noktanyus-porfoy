/**
 * @file Blog yazılarını listeleyen ve arama özelliği sunan bileşen.
 * @description Bu istemci bileşeni, tüm blog yazılarını alır ve kullanıcıya
 *              metin tabanlı arama yapma imkanı tanır.
 */

"use client";

import { useState, useMemo } from 'react';
import { Blog } from '@prisma/client';
import BlogCard from '@/components/BlogCard';

interface BlogListProps {
  /** Listelenecek tüm blog yazılarının dizisi. */
  allPosts: Blog[];
}

export default function BlogList({ allPosts }: BlogListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Blog yazılarını arama terimine göre hafızada (memoized) filtreler.
   */
  const filteredPosts = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowercasedSearchTerm) {
      return allPosts;
    }

    return allPosts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(lowercasedSearchTerm);
      const descriptionMatch = post.description.toLowerCase().includes(lowercasedSearchTerm);
      const tagMatch = Array.isArray(post.tags) ? post.tags.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(lowercasedSearchTerm)) : false;
      const categoryMatch = post.category.toLowerCase().includes(lowercasedSearchTerm);

      return titleMatch || descriptionMatch || tagMatch || categoryMatch;
    });
  }, [allPosts, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Arama Çubuğu */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Blog yazılarında ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-2/3 lg:w-1/2 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary text-light-text dark:text-dark-text"
        />
      </div>

      {/* Filtrelenmiş Blog Listesi */}
      {filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <BlogCard key={post.id} blog={post} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-16">
          Aradığınız kriterlere uygun bir blog yazısı bulunamadı.
        </p>
      )}
    </div>
  );
}
