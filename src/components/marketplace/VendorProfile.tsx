/**
 * VendorProfile — public mağaza sayfası görsel bileşeni.
 *
 * - Banner + avatar + displayName + bio
 * - Sosyal linkler (website, twitter, github)
 * - Ortalama puan + review sayısı
 * - Vendor ürünleri grid'i
 */

import Link from 'next/link';
import { FaStar, FaCheckCircle, FaGlobe, FaTwitter, FaGithub, FaBox, FaUser } from 'react-icons/fa';
import { formatCurrency, formatDate } from '@/lib/utils';

interface VendorProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  thumbnail: string | null;
  priceCents: number;
  currency: string;
  createdAt: Date | string;
  category: string;
}

interface Vendor {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  banner: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  verified: boolean;
  totalProducts: number;
  totalSales: number;
  avgRating: number;
  createdAt: Date | string;
}

interface VendorProfileProps {
  vendor: Vendor;
  products: VendorProduct[];
  average: number;
  reviewCount: number;
}

export function VendorProfile({ vendor, products, average, reviewCount }: VendorProfileProps) {
  return (
    <div className="space-y-8">
      {/* Banner + Header */}
      <div className="glass-card-premium overflow-hidden">
        <div
          className="h-40 sm:h-56 w-full bg-gradient-to-br from-brand-primary/30 to-brand-secondary/30 bg-cover bg-center"
          style={vendor.banner ? { backgroundImage: `url(${vendor.banner})` } : undefined}
          aria-hidden
        />
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex-shrink-0 -mt-16 sm:-mt-20">
            {vendor.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendor.avatar}
                alt={vendor.displayName}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-background shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-4xl font-bold border-4 border-background shadow-lg">
                {vendor.displayName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{vendor.displayName}</h1>
              {vendor.verified && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  <FaCheckCircle className="w-3 h-3" /> Doğrulanmış Satıcı
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <FaUser className="inline w-3 h-3 mr-1" />
              {formatDate(vendor.createdAt)} tarihinden beri aramızda
            </p>
            {vendor.bio && (
              <p className="text-sm mt-3 leading-relaxed text-foreground/90 whitespace-pre-line">
                {vendor.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-4">
              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <FaGlobe className="w-4 h-4" />
                  Website
                </a>
              )}
              {vendor.twitter && (
                <a
                  href={`https://twitter.com/${vendor.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <FaTwitter className="w-4 h-4" />
                  @{vendor.twitter}
                </a>
              )}
              {vendor.github && (
                <a
                  href={`https://github.com/${vendor.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <FaGithub className="w-4 h-4" />
                  {vendor.github}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card-premium p-5 text-center">
          <FaBox className="text-blue-500 w-6 h-6 mx-auto" />
          <p className="text-3xl font-bold mt-3">{vendor.totalProducts || products.length}</p>
          <p className="text-xs text-muted-foreground">Ürün</p>
        </div>
        <div className="glass-card-premium p-5 text-center">
          <div className="flex items-center justify-center gap-1">
            <FaStar className="text-yellow-500 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold mt-3">
            {average > 0 ? average.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">{reviewCount} yorum</p>
        </div>
        <div className="glass-card-premium p-5 text-center">
          <FaCheckCircle className="text-green-500 w-6 h-6 mx-auto" />
          <p className="text-3xl font-bold mt-3">{vendor.totalSales}</p>
          <p className="text-xs text-muted-foreground">Satış</p>
        </div>
      </div>

      {/* Ürünler */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Ürünler</h2>
          <span className="text-sm text-muted-foreground">{products.length} ürün</span>
        </div>

        {products.length === 0 ? (
          <div className="glass-card-premium p-12 text-center">
            <FaBox className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Bu satıcının henüz yayında ürünü yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/urun/${p.slug}`}
                className="glass-card-premium overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <FaBox className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-1 group-hover:text-brand-primary transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {p.shortDescription}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-brand-primary">
                      {formatCurrency(p.priceCents, p.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}