/**
 * @file Gelen iletişim formu mesajlarını yönetme sayfası.
 * @description Bu sayfa, kullanıcıların gönderdiği tüm mesajları listeler.
 *              Mesajları okuma, silme ve yanıtlama işlevselliği sunar.
 *
 * Faz D:
 *  - Elle yazılmış modal (backdrop + panel, focus trap yok, ESC yok) ortak
 *    `Modal` primitive'i ile değiştirildi.
 *  - `admin-button` sınıfı projede TANIMLI DEĞİLDİ — "Sil" butonu buton
 *    stillerinden yoksundu. `admin-btn admin-btn-danger` ile düzeltildi.
 *  - Yükleniyor / hata / boş durumlar ortak primitive'lere taşındı.
 *  - Mesaj listesi `<li onClick>` yerine gerçek `<button>` kullanır; klavye
 *    ile seçilebilir ve `aria-current` ile aktif mesaj bildirilir.
 *  - Yanıt alanı `FormField` ile etiketlendi (önceden label yoktu).
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Message } from "@/types/content";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { ButtonSpinner } from "@/components/ui/LoadingSkeleton";
import { DS } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export default function MessagesAdminPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * API'den tüm mesajları çeker ve tarihe göre sıralar.
   */
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/content?action=list&type=messages');
      if (!response.ok) throw new Error("Mesajlar sunucudan yüklenemedi.");
      const data = await response.json();
      if (Array.isArray(data)) {
        // Mesajları en yeniden en eskiye doğru sırala
        setMessages(
          [...data].sort(
            (a: Message, b: Message) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
        );
      } else {
        setMessages([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /**
   * Seçilen mesajı API aracılığıyla siler.
   * @param id - Silinecek mesajın kimliği.
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Mesajı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
    const loadingToast = toast.loading("Mesaj siliniyor...");
    setIsDeleting(true);
    try {
      // API'ye slug olarak dosya adını (.json uzantısıyla) gönder
      const response = await fetch(`/api/admin/content?type=messages&slug=${encodeURIComponent(`${id}.json`)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Silme işlemi başarısız oldu.");
      toast.success("Mesaj silindi.", { id: loadingToast });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelectedMessage(null); // Seçili mesajı temizle
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Mesaj silinemedi.', { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Seçilen mesaja yanıt gönderir.
   */
  const handleReply = async () => {
    if (!selectedMessage) return;
    setIsReplying(true);
    const loadingToast = toast.loading("Yanıtınız gönderiliyor...");
    try {
      const response = await fetch('/api/admin/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedMessage.email,
          subject: `Re: ${selectedMessage.subject}`,
          html: replyContent.replace(/\n/g, '<br>'), // Satır sonlarını HTML <br> etiketine çevir
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Yanıt gönderilemedi.");
      }
      toast.success("Yanıt gönderildi.", { id: loadingToast });
      setIsReplyModalOpen(false);
      setReplyContent("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yanıt gönderilemedi.', { id: loadingToast });
    } finally {
      setIsReplying(false);
    }
  };

  const header = (
    <PageHeader
      title="Gelen Mesajlar"
      description={
        isLoading || error ? undefined : `Gelen kutusunda ${messages.length} mesaj`
      }
      breadcrumb={<span>Admin / Mesajlar</span>}
    />
  );

  if (isLoading) {
    return (
      <div className="admin-content-spacing">
        {header}
        <LoadingSkeleton variant="text-line" count={6} loadingLabel="Mesajlar yükleniyor" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Mesajlar yüklenemedi"
          message={error}
          onRetry={fetchMessages}
          showHomeLink={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-content-spacing">
      {header}

      {messages.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Gelen kutunuz boş"
          description="İletişim formundan yeni bir mesaj geldiğinde burada listelenecek."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Mesaj Listesi */}
          <DashboardSection
            title={`Gelen Kutusu (${messages.length})`}
            padding="none"
            contained
            className="lg:col-span-1"
          >
            <ul className="max-h-[60vh] overflow-y-auto border-t border-border/40 lg:max-h-[70vh]">
              {messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <li key={msg.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedMessage(msg)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={cn(
                        'w-full border-b border-border/40 px-4 py-3 text-left transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/60',
                      )}
                    >
                      <span className="block text-sm font-bold text-foreground">{msg.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {msg.subject}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleString('tr-TR')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </DashboardSection>

          {/* Mesaj Detayı */}
          <DashboardSection padding="none" contained className="lg:col-span-2">
            {selectedMessage ? (
              <article className="flex min-h-[50vh] flex-col lg:min-h-[70vh]">
                <header className="border-b border-border/40 p-4">
                  <h2 className="line-clamp-2 text-lg font-bold lg:text-xl">
                    {selectedMessage.subject}
                  </h2>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div>
                      <dt className="sr-only">Gönderen</dt>
                      <dd className="font-semibold">{selectedMessage.name}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">E-posta</dt>
                      <dd className="break-all text-xs text-muted-foreground">
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          {selectedMessage.email}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Tarih</dt>
                      <dd className="text-xs text-muted-foreground">
                        {new Date(selectedMessage.timestamp).toLocaleString('tr-TR')}
                      </dd>
                    </div>
                  </dl>
                </header>

                <div className="flex-grow overflow-y-auto whitespace-pre-wrap p-4 text-sm lg:text-base">
                  {selectedMessage.message}
                </div>

                <footer className="border-t border-border/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedMessage.id)}
                      disabled={isDeleting}
                      className="admin-btn admin-btn-danger order-2 sm:order-1"
                    >
                      {isDeleting ? 'Siliniyor…' : 'Sil'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReplyModalOpen(true)}
                      className="admin-btn admin-btn-primary order-1 sm:order-2"
                    >
                      Cevapla
                    </button>
                  </div>
                </footer>
              </article>
            ) : (
              <div className="p-5">
                <EmptyState
                  variant="inline"
                  icon="inbox"
                  title="Mesaj seçilmedi"
                  description="Okumak için listeden bir mesaj seçin."
                />
              </div>
            )}
          </DashboardSection>
        </div>
      )}

      {/* Yanıt Modalı */}
      {isReplyModalOpen && selectedMessage && (
        <Modal
          open
          onClose={() => (isReplying ? undefined : setIsReplyModalOpen(false))}
          title={`Yanıtla: ${selectedMessage.subject}`}
          description={`Alıcı: ${selectedMessage.email}`}
          size="2xl"
          closeOnBackdrop={!isReplying}
          closeOnEsc={!isReplying}
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsReplyModalOpen(false)}
                disabled={isReplying}
                className="admin-btn admin-btn-secondary"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleReply}
                disabled={isReplying || replyContent.trim().length === 0}
                className="admin-btn admin-btn-primary"
              >
                {isReplying ? (
                  <>
                    <ButtonSpinner size="small" />
                    Gönderiliyor…
                  </>
                ) : (
                  'Gönder'
                )}
              </button>
            </>
          }
        >
          <FormField
            id="reply-content"
            label="Yanıt metni"
            required
            helperText="Satır sonları e-postada korunur."
          >
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={8}
                className={cn(DS.input, 'min-h-[180px] resize-y')}
                placeholder="Yanıtınızı buraya yazın..."
              />
            )}
          </FormField>
        </Modal>
      )}
    </div>
  );
}
