'use client';

/**
 * ProductReviews — ürün detay sayfasında gösterilen yorum bölümü.
 *
 * - Mevcut yorumlar (ortalama puan + yorumcu bilgisi)
 * - Login olan kullanıcılar yeni yorum bırakabilir
 * - 5 yıldız seçilebilir, opsiyonel yorum metni
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaStar, FaCheckCircle } from 'react-icons/fa';
import { formatDate } from '@/lib/utils';

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  flagged: boolean;
  createdAt: Date | string;
  reviewer: { id: string; name: string | null; image: string | null };
}

interface ProductReviewsProps {
  productSlug: string;
  initialReviews: ReviewRow[];
  initialAverage: number;
  initialCount: number;
}

export function ProductReviews({
  productSlug,
  initialReviews,
  initialAverage,
  initialCount,
}: ProductReviewsProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [reviews, setReviews] = useState<ReviewRow[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error('Yorum yapmak için giriş yapın');
      router.push('/giris');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });

      const data = await res.json();
      if (!data.success) {
        if (data.error?.code === 'CONFLICT') {
          toast.error('Bu ürüne zaten yorum bıraktınız');
        } else {
          toast.error(data.error?.message || 'Yorum gönderilemedi');
        }
        return;
      }

      toast.success('Yorumunuz eklendi!');
      // Yeni review'ı listeye prepend et
      if (data.data?.review) {
        const reviewerName = session?.user?.name ?? null;
        setReviews((prev) => [
          {
            ...data.data.review,
            reviewer: data.data.review.reviewer ?? { id: '', name: reviewerName, image: null },
          },
          ...prev,
        ]);
      }
      setShowForm(false);
      setComment('');
      setRating(5);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12" aria-label="Ürün yorumları">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaStar className="text-yellow-500" />
            Yorumlar
            <span className="text-sm font-normal text-muted-foreground">({initialCount})</span>
          </h2>
          {initialCount > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(initialAverage)
                        ? 'text-yellow-500'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{initialAverage.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                {initialCount} değerlendirme üzerinden
              </span>
            </div>
          )}
        </div>
        {session?.user && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="admin-btn admin-btn-primary text-sm self-start"
          >
            Yorum Yap
          </button>
        )}
      </div>

      {/* Yorum Formu */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card-premium p-5 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Puanınız</label>
            <div
              className="flex gap-1"
              onMouseLeave={() => setHoverRating(0)}
              role="radiogroup"
              aria-label="Puan seçimi"
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={rating === s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  className={`text-3xl transition-colors ${
                    s <= (hoverRating || rating) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  <FaStar />
                </button>
              ))}
              <span className="text-sm text-muted-foreground ml-2 self-center">
                {hoverRating || rating} / 5
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium mb-2">
              Yorumunuz <span className="text-xs text-muted-foreground">(opsiyonel)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deneyiminizi paylaşın..."
              rows={4}
              maxLength={1000}
              className="admin-input"
            />
            <p className="text-xs text-muted-foreground mt-1">{comment.length} / 1000</p>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="admin-btn admin-btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setComment('');
                setRating(5);
              }}
              className="admin-btn admin-btn-secondary text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Yorum Listesi */}
      {reviews.length === 0 ? (
        <div className="glass-card-premium p-8 text-center">
          <p className="text-muted-foreground">Henüz yorum yok. İlk yorumu sen yap!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="glass-card-premium p-5"
              aria-label={`${r.reviewer.name ?? 'Anonim'} tarafından yapılan yorum`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {r.reviewer.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.reviewer.image}
                      alt={r.reviewer.name ?? 'Yorumcu'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                      {(r.reviewer.name ?? '?')[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{r.reviewer.name ?? 'Anonim'}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FaStar
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= r.rating
                              ? 'text-yellow-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    {r.approved && (
                      <FaCheckCircle
                        className="text-green-500 w-3 h-3"
                        title="Onaylı yorum"
                        aria-label="Onaylı yorum"
                      />
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="text-sm mt-2 text-foreground/90 leading-relaxed">{r.comment}</p>
                  ) : (
                    <p className="text-sm mt-2 text-muted-foreground italic">
                      Yorumcu puan vermiş, yorum yazmamış.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}