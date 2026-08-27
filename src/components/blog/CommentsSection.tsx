'use client';

/**
 * Blog Comments Section
 *
 * Blog detay sayfasında kullanıcı yorumlarını listeler,
 * yeni yorum ve yanıt yazma, yorum silme işlemlerini yönetir.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaReply, FaTrash } from 'react-icons/fa';
import { formatDate } from '@/lib/utils';

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  userId: string;
  parentId?: string | null;
  user: { id: string; name: string | null; image: string | null };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  userId: string;
  parentId?: string | null;
  user: { id: string; name: string | null; image: string | null };
  replies?: Reply[];
  _count?: { replies: number };
}

export function CommentsSection({ blogSlug }: { blogSlug: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blogs/${blogSlug}/comments`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data?.success) {
        setComments(data.data.comments ?? []);
        setTotalCount(data.data.count ?? 0);
      }
    } catch (err) {
      console.error('Comments fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [blogSlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error('Yorum yapmak için giriş yapın');
      return;
    }
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/blogs/${blogSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          parentId: replyTo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message ?? 'Yorum eklenemedi');
      }

      toast.success(replyTo ? 'Yanıt eklendi' : 'Yorum eklendi');
      setContent('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yorumu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message ?? 'Yorum silinemedi');
      }
      toast.success('Yorum silindi');
      fetchComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    }
  };

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">
        Yorumlar ({totalCount})
      </h2>

      {/* New comment form */}
      {session?.user ? (
        <form onSubmit={handleSubmit} className="mb-8 glass-card-premium p-4">
          {replyTo && (
            <div className="mb-2 text-sm text-muted-foreground flex items-center gap-2">
              <span>Bir yoruma cevap yazıyorsun</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-primary hover:underline"
              >
                İptal
              </button>
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Yorumunuzu yazın..."
            rows={3}
            maxLength={2000}
            className="admin-input w-full resize-y"
            required
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {content.length}/2000
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="admin-btn admin-btn-primary"
            >
              {submitting
                ? 'Gönderiliyor...'
                : replyTo
                ? 'Cevap Gönder'
                : 'Yorum Gönder'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 glass-card-premium p-6 text-center">
          <p className="text-muted-foreground mb-3">
            Yorum yapmak için giriş yapın
          </p>
          <Link
            href={`/giris?callbackUrl=/blog/${blogSlug}`}
            className="admin-btn admin-btn-primary inline-block"
          >
            Giriş Yap
          </Link>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-center py-8 text-muted-foreground">
          Yorumlar yükleniyor...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          Henüz yorum yok. İlk yorumu sen yap!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReply={() => setReplyTo(comment.id)}
              onDelete={() => handleDelete(comment.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  onReply,
  onDelete,
}: {
  comment: Comment;
  currentUserId?: string;
  isAdmin?: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  const isOwner = currentUserId === comment.userId;
  const canDelete = isOwner || isAdmin;

  const displayName =
    comment.user.name?.trim() ||
    (comment.user.image ? 'Kullanıcı' : 'Anonim');

  return (
    <div className="glass-card-premium p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
              {comment.editedAt ? ' (düzenlendi)' : ''}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap mb-2 break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={onReply}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FaReply className="inline mr-1" /> Yanıtla
            </button>
            {canDelete && (
              <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <FaTrash className="inline mr-1" /> Sil
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-muted space-y-3">
              {comment.replies.map((reply) => {
                const replyName =
                  reply.user.name?.trim() || 'Anonim';
                return (
                  <div key={reply.id} className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {replyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span className="font-medium">{replyName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                          {reply.editedAt ? ' (düzenlendi)' : ''}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mt-1 break-words">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
