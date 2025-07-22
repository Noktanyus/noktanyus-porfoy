// src/components/__tests__/BlogCard.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlogCard from '../BlogCard';
import { Blog } from '@/types/content';

// Next.js bileşenlerini mock'la
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={props.alt || ''} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('BlogCard', () => {
  const mockBlog: Blog = {
    id: 'test-blog-1',
    slug: 'test-blog-post',
    title: 'Test Blog Yazısı',
    description: 'Bu bir test blog yazısının açıklamasıdır.',
    thumbnail: '/images/blog-thumbnail.jpg',
    author: 'Test Yazar',
    category: 'Teknoloji',
    tags: ['React', 'Next.js', 'TypeScript'],
    content: 'Blog içeriği...',
    date: new Date('2024-01-15'),
  };

  it('should render blog card with all information', () => {
    render(<BlogCard blog={mockBlog} />);

    expect(screen.getByText('Test Blog Yazısı')).toBeInTheDocument();
    expect(screen.getByText('Bu bir test blog yazısının açıklamasıdır.')).toBeInTheDocument();
    expect(screen.getByText('Test Yazar')).toBeInTheDocument();
    expect(screen.getByText('Teknoloji')).toBeInTheDocument();
  });

  it('should render blog tags correctly', () => {
    render(<BlogCard blog={mockBlog} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('should render blog thumbnail with correct src', () => {
    render(<BlogCard blog={mockBlog} />);

    const thumbnail = screen.getByRole('img');
    expect(thumbnail).toHaveAttribute('src', '/api/static/images/blog-thumbnail.jpg');
  });

  it('should render link to blog post', () => {
    render(<BlogCard blog={mockBlog} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/test-blog-post');
  });

  it('should format date correctly', () => {
    render(<BlogCard blog={mockBlog} />);

    // Tarih formatının doğru olduğunu kontrol et
    expect(screen.getByText(/15 Ocak 2024|15 Jan 2024|2024/)).toBeInTheDocument();
  });

  it('should handle missing thumbnail gracefully', () => {
    const blogWithoutThumbnail = { ...mockBlog, thumbnail: undefined };
    render(<BlogCard blog={blogWithoutThumbnail} />);

    // Placeholder görsel olmalı
    const thumbnail = screen.getByRole('img');
    expect(thumbnail).toHaveAttribute('src', '/images/placeholder.webp');
  });
});