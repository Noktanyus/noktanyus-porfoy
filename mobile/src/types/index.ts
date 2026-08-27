export interface Blog {
  id: string;
  slug: string;
  title: string;
  description: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  publishedAt: string;
  author?: {
    name: string;
    avatar?: string;
  };
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  coverImage?: string;
  category?: string;
  active?: boolean;
  stock?: number;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  interval: number;
  active: boolean;
  status?: 'up' | 'down' | 'unknown';
  lastCheckedAt?: string;
  responseTime?: number;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'discord' | 'webhook';
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: 'user' | 'admin';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { total: number; page: number; limit: number };
}