'use client';

/**
 * VendorDashboard — satıcı dashboard ana bileşeni.
 *
 * - 3 stat card: Ürün, Satış, Ortalama Puan
 * - Profil özeti (avatar, banner, bio, sosyal linkler)
 * - Son yorumlar listesi (yıldız + yorumcu + ürün linki)
 * - Vendor ürünleri listesi
 */

import Link from 'next/link';
import { useState } from 'react';
import {
  FaBoxOpen,
  FaDollarSign,
  FaStar,
  FaStore,
  FaUsers,
  FaEdit,
  FaCheckCircle,
  FaTwitter,
  FaGithub,
  FaGlobe,
  FaCog,
} from 'react-icons/fa';
import { formatDate, formatDateTime } from '@/lib/utils';

interface VendorProduct {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  priceCents: number;
  currency: string;
  active: boolean;
  createdAt: Date | string;
}

interface VendorReview {
  id: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  flagged: boolean;
  createdAt: Date | string;
  reviewer: { id: string; name: string | null; image: string | null };
  product: { id: string; slug: string; title: string; thumbnail: string | null };
}

interface VendorProfile {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  banner: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  totalProducts: number;
  totalSales: number;
  avgRating: number;
  verified: boolean;
  active: boolean;
  createdAt: Date | string;
}

interface VendorDashboardProps {
  profile: VendorProfile;
  reviews: VendorReview[];
  products: VendorProduct[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= Math.round(rating) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export function VendorDashboard({ profile, reviews, products }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'products'>('reviews');

  return (
    <div className="space-y-6">
      {/* Header / Profil Kartı */}
      <div className="glass-card-premium overflow-hidden">
        {profile.banner && (
          <div
            className="h-32 sm:h-48 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.banner})` }}
            aria-hidden
          />
        )}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-start">
          <div className="flex-shrink-0">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={profile.displayName}
                className="w-20 h-20 rounded-full object-cover border-4 border-background shadow"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-2xl font-bold">
                {profile.displayName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold truncate">{profile.displayName}</h1>
              {profile.verified && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  <FaCheckCircle className="w-3 h-3" /> Doğrulanmış
                </span>
              )}
              {!profile.active && (
                <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">
                  Pasif
                </span>
              )}
            </div>
            <Link
              href={`/magaza/${profile.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <FaStore className="w-3 h-3" />
              /magaza/{profile.slug}
            </Link>
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <FaGlobe className="w-3 h-3" />
                  Website
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <FaTwitter className="w-3 h-3" />
                  @{profile.twitter}
                </a>
              )}
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <FaGithub className="w-3 h-3" />
                  {profile.github}
                </a>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/vendor/edit"
            className="admin-btn admin-btn-secondary text-sm self-start inline-flex items-center gap-2"
          >
            <FaEdit className="w-3 h-3" /> Profili Düzenle
          </Link>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card-premium p-5">
          <div className="flex items-center justify-between">
            <FaBoxOpen className="text-blue-500 w-6 h-6" />
            <span className="text-xs text-muted-foreground">Yayında</span>
          </div>
          <p className="text-3xl font-bold mt-3">{profile.totalProducts}</p>
          <p className="text-xs text-muted-foreground">Ürün</p>
        </div>
        <div className="glass-card-premium p-5">
          <div className="flex items-center justify-between">
            <FaDollarSign className="text-green-500 w-6 h-6" />
            <span className="text-xs text-muted-foreground">Toplam</span>
          </div>
          <p className="text-3xl font-bold mt-3">{profile.totalSales}</p>
          <p className="text-xs text-muted-foreground">Satış</p>
        </div>
        <div className="glass-card-premium p-5">
          <div className="flex items-center justify-between">
            <FaStar className="text-yellow-500 w-6 h-6" />
            <span className="text-xs text-muted-foreground">{reviews.length} yorum</span>
          </div>
          <p className="text-3xl font-bold mt-3">
            {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Ortalama Puan</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border flex gap-1">
        {[
          { id: 'reviews' as const, label: 'Son Yorumlar', icon: FaUsers },
          { id: 'products' as const, label: 'Ürünlerim', icon: FaBoxOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'reviews' && (
        <div className="glass-card-premium p-6">
          <h2 className="text-lg font-semibold mb-4">Son Yorumlar</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz yorum yok</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {r.reviewer.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.reviewer.image}
                          alt={r.reviewer.name ?? 'Yorumcu'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                          {(r.reviewer.name ?? '?')[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{r.reviewer.name ?? 'Anonim'}</span>
                        <StarRating rating={r.rating} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </span>
                        {r.flagged && (
                          <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded">
                            İşaretlendi
                          </span>
                        )}
                      </div>
                      {r.comment && (
                        <p className="text-sm mt-1 text-muted-foreground">{r.comment}</p>
                      )}
                      <Link
                        href={`/magaza/${profile.slug}/urun/${r.product.slug}`}
                        className="text-xs text-muted-foreground hover:text-foreground mt-1 inline-block"
                      >
                        Ürün: {r.product.title}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="glass-card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ürünlerim ({products.length})</h2>
            <Link
              href="/dashboard/products/new"
              className="admin-btn admin-btn-primary text-sm inline-flex items-center gap-2"
            >
              <FaCog className="w-3 h-3" /> Yeni Ürün
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz ürün yok</p>
          ) : (
            <div className="divide-y divide-border">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-shrink-0 w-12 h-12 bg-muted rounded overflow-hidden">
                    {p.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/magaza/${profile.slug}/urun/${p.slug}`}
                      className="text-sm font-medium hover:text-brand-primary line-clamp-1"
                    >
                      {p.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {(p.priceCents / 100).toFixed(2)} {p.currency.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(p.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      p.active
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/10 text-gray-600'
                    }`}
                  >
                    {p.active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}