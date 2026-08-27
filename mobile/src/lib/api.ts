import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'https://noktanyus.com';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Token interceptor (NextAuth session cookie veya custom JWT)
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const token = await SecureStore.getItemAsync('session-token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // SecureStore kullanılamıyorsa sessizce geç
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session temizle
      SecureStore.deleteItemAsync('session-token').catch(() => undefined);
    }
    return Promise.reject(error);
  }
);

// ---- API helpers ----

export const authApi = {
  /** NextAuth credentials login (CSRF token zorunlu - önce /api/auth/csrf çağrılır) */
  login: async (email: string, password: string) => {
    const { data: csrf } = await api.get<{ csrfToken: string }>('/api/auth/csrf');
    return api.post('/api/auth/callback/credentials', {
      email,
      password,
      csrfToken: csrf.csrfToken,
      json: true,
    });
  },
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  signOut: () => api.post('/api/auth/signout'),
  session: () => api.get('/api/auth/session'),
};

export const blogApi = {
  list: (page = 1) => api.get(`/api/blogs?page=${page}`),
  get: (slug: string) => api.get(`/api/blogs/${slug}`),
  comments: (slug: string) => api.get(`/api/blogs/${slug}/comments`),
  postComment: (slug: string, data: { content: string }) =>
    api.post(`/api/blogs/${slug}/comments`, data),
};

export const productApi = {
  list: (params?: { category?: string; take?: number; skip?: number }) =>
    api.get('/api/products', { params }),
  get: (slug: string) => api.get(`/api/products/${slug}`),
  checkout: (data: { productId: string; quantity?: number }) =>
    api.post('/api/checkout/product', data),
};

export const monitorApi = {
  list: () => api.get('/api/monitors'),
  create: (data: { name: string; url: string; interval?: number }) =>
    api.post('/api/monitors', data),
  update: (id: string, data: Partial<{ name: string; url: string; interval: number; active: boolean }>) =>
    api.put(`/api/monitors/${id}`, data),
  delete: (id: string) => api.delete(`/api/monitors/${id}`),
  check: (id: string) => api.post(`/api/monitors/${id}/check`),
  checkAll: () => api.post('/api/monitors/check-all'),
};

export const apiKeyApi = {
  list: () => api.get('/api/user/api-keys'),
  create: (data: { name: string }) => api.post('/api/user/api-keys', data),
  revoke: (id: string) => api.delete(`/api/user/api-keys/${id}`),
};

export const alertChannelApi = {
  list: () => api.get('/api/alert-channels'),
  create: (data: { name: string; type: string; config: Record<string, unknown> }) =>
    api.post('/api/alert-channels', data),
  update: (id: string, data: Partial<{ name: string; active: boolean }>) =>
    api.put(`/api/alert-channels/${id}`, data),
  delete: (id: string) => api.delete(`/api/alert-channels/${id}`),
};

export const userApi = {
  profile: () => api.get('/api/user/profile'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/api/user/profile', data),
  products: () => api.get('/api/user/products'),
  changePassword: (data: { current: string; next: string }) =>
    api.put('/api/user/password', data),
  deleteAccount: () => api.delete('/api/user/delete'),
};

export const newsletterApi = {
  subscribe: (email: string) => api.post('/api/newsletter/subscribe', { email }),
  unsubscribe: (token: string) => api.post('/api/newsletter/unsubscribe', { token }),
  verify: (token: string) => api.get(`/api/newsletter/verify?token=${token}`),
};

export const contactApi = {
  send: (data: { name: string; email: string; message: string; turnstileToken?: string }) =>
    api.post('/api/contact', data),
};

export const searchApi = {
  query: (q: string) => api.get(`/api/search?q=${encodeURIComponent(q)}`),
};

export const plansApi = {
  list: () => api.get('/api/plans'),
};

export const checkoutApi = {
  subscription: (data: { planId: string; couponCode?: string }) =>
    api.post('/api/checkout/subscription', data),
  subscriptionPortal: () => api.post('/api/checkout/subscription-portal'),
};