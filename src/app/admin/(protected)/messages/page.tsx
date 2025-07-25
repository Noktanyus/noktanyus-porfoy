/**
 * @file Gelen iletişim formu mesajlarını yönetme sayfası.
 * @description Bu sayfa, kullanıcıların gönderdiği tüm mesajları listeler.
 *              Mesajları okuma, silme ve yanıtlama işlevselliği sunar.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Message } from "@/types/content";

export default function MessagesAdminPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  /**
   * API'den tüm mesajları çeker ve tarihe göre sıralar.
   */
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content?action=list&type=messages');
      if (!response.ok) throw new Error("Mesajlar sunucudan yüklenemedi.");
      const data = await response.json();
      if (Array.isArray(data)) {
        // Mesajları en yeniden en eskiye doğru sırala
        setMessages(data.sort((a: Message, b: Message) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        setMessages([]);
      }
    } catch (error) {
      toast.error((error as Error).message);
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
    if (!confirm(`Mesajı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;
    const loadingToast = toast.loading("Mesaj siliniyor...");
    try {
      // API'ye slug olarak dosya adını (.json uzantısıyla) gönder
      const response = await fetch(`/api/admin/content?type=messages&slug=${id}.json`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Silme işlemi başarısız oldu.");
      toast.success("Mesaj başarıyla silindi!", { id: loadingToast });
      fetchMessages(); // Listeyi yenile
      setSelectedMessage(null); // Seçili mesajı temizle
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Yanıt gönderilemedi.");
      }
      toast.success("Yanıt başarıyla gönderildi!", { id: loadingToast });
      setIsReplyModalOpen(false);
      setReplyContent("");
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    } finally {
      setIsReplying(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Mesajlar yükleniyor...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 h-[calc(100vh-8rem)]">
        {/* Mesaj Listesi Bölümü */}
        <div className="lg:col-span-1 bg-white dark:bg-dark-card rounded-lg shadow-md overflow-y-auto max-h-[50vh] lg:max-h-full">
          <h1 className="text-lg lg:text-xl font-bold p-3 lg:p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-dark-card z-10">
            Gelen Kutusu ({messages.length})
          </h1>
          <ul>
            {messages.length > 0 ? messages.map(msg => (
              <li 
                key={msg.id} 
                onClick={() => setSelectedMessage(msg)} 
                className={`p-3 lg:p-4 border-b dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation ${selectedMessage?.id === msg.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              >
                <p className="font-bold text-sm lg:text-base">{msg.name}</p>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">{msg.subject}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleString('tr-TR')}</p>
              </li>
            )) : <p className="p-3 lg:p-4 text-center text-gray-500 text-sm lg:text-base">Gelen kutunuzda hiç mesaj yok.</p>}
          </ul>
        </div>

        {/* Mesaj Detayı Bölümü */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-lg shadow-md flex flex-col min-h-[50vh] lg:min-h-full">
          {selectedMessage ? (
            <>
              <div className="p-3 lg:p-4 border-b dark:border-gray-700">
                <h2 className="text-lg lg:text-xl font-bold line-clamp-2">{selectedMessage.subject}</h2>
                <div className="mt-2 space-y-1">
                  <p className="text-sm lg:text-base">
                    <span className="font-semibold">{selectedMessage.name}</span>
                  </p>
                  <p className="text-xs lg:text-sm text-gray-500 break-all">
                    {selectedMessage.email}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(selectedMessage.timestamp).toLocaleString('tr-TR')}</p>
                </div>
              </div>
              <div className="p-3 lg:p-4 flex-grow overflow-y-auto whitespace-pre-wrap text-sm lg:text-base">
                {selectedMessage.message}
              </div>
              <div className="p-3 lg:p-4 border-t dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button 
                    onClick={() => setIsReplyModalOpen(true)} 
                    className="admin-button-primary order-1 sm:order-2"
                  >
                    Cevapla
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedMessage.id)} 
                    className="admin-button bg-red-600 text-white hover:bg-red-700 order-2 sm:order-1"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm lg:text-base">Okumak için {window.innerWidth < 1024 ? 'yukarıdaki' : 'soldaki'} listeden bir mesaj seçin.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yanıt Modalı */}
      {isReplyModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4 line-clamp-2">Yanıtla: {selectedMessage.subject}</h2>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={8}
              className="admin-input resize-y min-h-[160px] sm:min-h-[200px]"
              placeholder="Yanıtınızı buraya yazın..."
            />
            <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button 
                onClick={() => setIsReplyModalOpen(false)} 
                className="admin-button-secondary order-2 sm:order-1"
              >
                İptal
              </button>
              <button 
                onClick={handleReply} 
                disabled={isReplying} 
                className="admin-button-primary order-1 sm:order-2"
              >
                {isReplying ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}