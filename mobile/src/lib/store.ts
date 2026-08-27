import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ---- Types ----
export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
  coverImage?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  setSession: (user: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalCount: () => number;
  totalPrice: () => number;
}

// ---- Storage adapter: önce SecureStore, yoksa AsyncStorage ----
const secureStorage = {
  getItem: async (name: string) => {
    try {
      const value = await SecureStore.getItemAsync(name);
      return value ?? null;
    } catch {
      return AsyncStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      await AsyncStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string) => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      await AsyncStorage.removeItem(name);
    }
  },
};

// ---- Auth store ----
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      setSession: async (user, token) => {
        await SecureStore.setItemAsync('session-token', token).catch(() => undefined);
        set({ user, sessionToken: token });
      },
      signOut: async () => {
        await SecureStore.deleteItemAsync('session-token').catch(() => undefined);
        set({ user: null, sessionToken: null });
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

// ---- Cart store ----
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      updateQuantity: (productId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }),
      clear: () => set({ items: [] }),
      totalCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ---- UI store (theme, vb.) ----
interface UIState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);