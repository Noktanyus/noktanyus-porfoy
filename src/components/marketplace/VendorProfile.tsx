/**
 * VendorProfile — public mağaza sayfası görsel bileşeni.
 *
 * - Banner + avatar + displayName + bio
 * - Sosyal linkler (website, twitter, github)
 * - Ortalama puan + review sayısı
 * - Vendor ürünleri grid'i
 *
 * Veri dürüstlüğü: ürün sayısı, ortalama puan ve satış sayısı doğrudan DB'den
 * gelir. Puan yoksa "—" gösterilir, 0.0 gibi yanıltıcı bir değer üretilmez.
 *
 * Faz D:
 *  - Ürün kartı linki `/urun/[slug]`e gidiyordu; bu route PROJEDE YOK ve her
 *    ürün kartı 404 veriyordu. Var olan `/magaza/[slug]` route'una çevrildi.
 *  - İstatistik kartları ortak `StatCard`, boş durum `EmptyState`,
 *    doğrulanmış rozeti `StatusBadge` primitive'lerine taşındı.
 *  - Ürün grid'i `<ul>/<li>` liste semantiğine alındı.
 */

import Link from 'next/link';
import { FaStar, FaCheckCircle, FaGlobe, FaTwitter, FaGithub, FaBox, FaUser } from 'react-icons/fa';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
                <StatusBadge
                  size="sm"
                  tone="info"
                  label="Doğrulanmış Satıcı"
                  icon={<FaCheckCircle className="w-3 h-3" />}
                />
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

      {/* İstatistik Kartları — canlı DB değerleri */}
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          definition
          align="center"
          label="Ürün"
          value={vendor.totalProducts || products.length}
          icon={<FaBox className="text-sky-500" />}
        />
        <StatCard
          definition
          align="center"
          label={`${reviewCount} yorum`}
          value={average > 0 ? average.toFixed(1) : '—'}
          icon={<FaStar className="text-amber-500" />}
        />
        <StatCard
          definition
          align="center"
          label="Satış"
          value={vendor.totalSales}
          icon={<FaCheckCircle className="text-emerald-500" />}
        />
      </dl>

      {/* Ürünler */}
      <section aria-labelledby="vendor-products-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="vendor-products-heading" className="text-xl font-semibold">
            Ürünler
          </h2>
          <span className="text-sm text-muted-foreground">{products.length} ürün</span>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon="box"
            title="Yayında ürün yok"
            description="Bu satıcının şu anda yayında bir ürünü bulunmuyor. Diğer satıcıların ürünlerine göz atabilirsiniz."
            action={{ label: 'Mağazaya Git', href: '/magaza' }}
          />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <li key={p.id} className="min-w-0">
                <Link
                  href={`/magaza/${p.slug}`}
                  className="group block h-full overflow-hidden glass-card-premium transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="w-full h-full flex items-center justify-center text-muted-foreground"
                      >
                        <FaBox className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-1 transition-colors group-hover:text-brand-primary">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {p.shortDescription}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <span className="text-sm font-bold text-brand-primary">
                        {formatCurrency(p.priceCents, p.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.category}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}