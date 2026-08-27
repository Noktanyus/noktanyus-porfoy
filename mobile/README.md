# Noktanyus Mobile App

Cross-platform (iOS + Android) React Native uygulaması — Expo Router + TypeScript + NativeWind.
Web tarafındaki (Next.js) tüm API'yi mobil uygulamadan çağırır.

## Stack

| Katman | Teknoloji |
|---|---|
| Framework | Expo SDK 51 + Expo Router 3 |
| Runtime | React Native 0.74, React 18 |
| Type System | TypeScript 5.3 (strict) |
| Styling | NativeWind 4 (Tailwind CSS) |
| State | Zustand (persist) |
| Data Fetching | TanStack Query 5 |
| HTTP | Axios + Expo SecureStore (JWT) |
| Validation | Zod + react-hook-form |
| Icons | @expo/vector-icons (Ionicons) |
| Storage | AsyncStorage + SecureStore (sensitive) |

## Kurulum

```bash
cd mobile
npm install
cp .env.example .env
# .env içindeki EXPO_PUBLIC_API_URL'i production API'nize ayarlayın
```

## Geliştirme

### Expo Go ile test (en hızlı)

```bash
npm start
```

Çıkan QR'ı telefondaki **Expo Go** uygulaması ile okutun.

### Native Simulator/Emulator

```bash
npm run ios       # iOS Simulator (sadece macOS)
npm run android   # Android Emulator
```

### Web preview

```bash
npm run web
```

## Environment Variables

`.env` dosyası:

| Değişken | Açıklama | Varsayılan |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Backend (Next.js) base URL | `http://localhost:3000` |

> **Not:** Production için gerçek domain'inizi kullanın (örn: `https://noktanyus.com`).

## Production Build (EAS)

Önce `eas.json` oluşturun (yoksa):

```bash
npx eas-cli@latest init
```

Sonra:

```bash
# iOS
npm run build:production -- --platform ios
npm run submit:ios

# Android
npm run build:production -- --platform android
npm run submit:android
```

## Proje Yapısı

```
mobile/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Root layout (Providers + Stack)
│   ├── (auth)/                   # Auth grup
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Ana tab navigation
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # Ana Sayfa
│   │   ├── blog.tsx              # Blog listesi
│   │   ├── projects.tsx          # Projeler
│   │   ├── store.tsx             # Mağaza
│   │   └── dashboard.tsx         # Hesap / Dashboard
│   ├── blog/[slug].tsx           # Blog detay
│   └── products/[slug].tsx       # Ürün detay
├── src/
│   ├── lib/
│   │   ├── api.ts                # Axios + tüm API endpoint'leri
│   │   ├── store.ts              # Zustand store (auth, cart, ui)
│   │   └── queryClient.ts        # React Query client config
│   └── types/                    # Paylaşılan type tanımları
├── assets/                       # icon, splash, adaptive-icon
├── app.json                      # Expo config
├── babel.config.js               # NativeWind babel preset
├── tailwind.config.js            # NativeWind theme
├── metro.config.js               # Metro bundler
├── global.css                    # Tailwind directives
├── tsconfig.json
└── package.json
```

## API Entegrasyonu

`src/lib/api.ts` içinde tüm Next.js API endpoint'leri helper fonksiyonlar olarak tanımlı:

| Helper | Endpoint'ler |
|---|---|
| `authApi` | `/api/auth/csrf`, `/api/auth/callback/credentials`, `/api/auth/register`, `/api/auth/signout`, `/api/auth/session` |
| `blogApi` | `/api/blogs`, `/api/blogs/[slug]`, `/api/blogs/[slug]/comments` |
| `productApi` | `/api/products`, `/api/products/[slug]`, `/api/checkout/product` |
| `monitorApi` | `/api/monitors`, `/api/monitors/[id]`, `/api/monitors/check-all` |
| `apiKeyApi` | `/api/user/api-keys`, `/api/user/api-keys/[id]` |
| `alertChannelApi` | `/api/alert-channels`, `/api/alert-channels/[id]` |
| `userApi` | `/api/user/profile`, `/api/user/password`, `/api/user/products`, `/api/user/delete` |
| `newsletterApi` | `/api/newsletter/subscribe`, `/api/newsletter/verify`, `/api/newsletter/unsubscribe` |
| `contactApi` | `/api/contact` |
| `searchApi` | `/api/search` |
| `plansApi` | `/api/plans` |
| `checkoutApi` | `/api/checkout/subscription`, `/api/checkout/subscription-portal` |

### Auth Flow (NextAuth uyumlu)

1. Kullanıcı e-posta/şifre girer
2. `authApi.login()` önce `/api/auth/csrf` çağırır, csrfToken alır
3. `/api/auth/callback/credentials` POST edilir (NextAuth Credentials provider)
4. Session cookie response'ta gelir → token SecureStore'a kaydedilir
5. Axios interceptor her istekte `Authorization: Bearer <token>` ekler

### Token Güvenliği

- JWT/session token **expo-secure-store**'da (Keychain / EncryptedSharedPreferences) saklanır
- 401 response alındığında otomatik temizlenir
- Zustand `auth` store persist ile cihazda saklanır

## Scripts

| Komut | Açıklama |
|---|---|
| `npm start` | Expo dev server başlat |
| `npm run android` | Android emulator |
| `npm run ios` | iOS simulator |
| `npm run web` | Web preview |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript kontrolü |
| `npm run build:preview` | EAS preview build |
| `npm run build:production` | EAS production build |

## Notlar

- Bu dizin **ana projeyi etkilemez** — Next.js app halen `src/app/` üzerinden çalışır
- API_URL geliştirme için `http://localhost:3000`, simulator için `http://10.0.2.2:3000` (Android emulator) gerekebilir
- Production build'de gerçek domain (`https://noktanyus.com`) kullanın
- `react-native-gesture-handler` ve `react-native-reanimated` gerektiğinde `npx expo install` ile ekleyin