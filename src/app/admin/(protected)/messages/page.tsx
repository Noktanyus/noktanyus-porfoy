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

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content?action=list&type=messages');
      if (!response.ok) throw new Error("Mesajlar yüklenemedi.");
      const data = await response.json();
      if (Array.isArray(data)) {
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

  const handleDelete = async (id: string) => {
    if (!confirm(`Mesajı kalıcı olarak silmek istediğinizden emin misiniz?`)) return;
    const loadingToast = toast.loading("Mesaj siliniyor...");
    try {
      const response = await fetch(`/api/admin/content?type=messages&slug=${id}.json`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Silme işlemi başarısız oldu.");
      toast.success("Mesaj silindi!", { id: loadingToast });
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  const handleReply = async () => {
    if (!selectedMessage) return;
    setIsReplying(true);
    const loadingToast = toast.loading("Yanıt gönderiliyor...");
    try {
      const response = await fetch('/api/admin/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedMessage.email,
          subject: `Re: ${selectedMessage.subject}`,
          html: replyContent.replace(/\n/g, '<br>'),
        }),
      });
      if (!response.ok) throw new Error("Yanıt gönderilemedi.");
      toast.success("Yanıt gönderildi!", { id: loadingToast });
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
        {/* Mesaj Listesi */}
        <div className="md:col-span-1 bg-white dark:bg-dark-card rounded-lg shadow-md overflow-y-auto">
          <h1 className="text-xl font-bold p-4 border-b dark:border-gray-700">Gelen Kutusu ({messages.length})</h1>
          <ul>
            {messages.length > 0 ? messages.map(msg => (
              <li key={msg.id} onClick={() => setSelectedMessage(msg)} className={`p-4 border-b dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedMessage?.id === msg.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>
                <p className="font-bold">{msg.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{msg.subject}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
              </li>
            )) : <p className="p-4 text-center text-gray-500">Gelen mesaj yok.</p>}
          </ul>
        </div>

        {/* Mesaj Detayı */}
        <div className="md:col-span-2 bg-white dark:bg-dark-card rounded-lg shadow-md flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                <p className="text-sm mt-1">
                  <span className="font-semibold">{selectedMessage.name}</span>
                  <span className="text-gray-500"> ({selectedMessage.email})</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{new Date(selectedMessage.timestamp).toLocaleString()}</p>
              </div>
              <div className="p-4 flex-grow overflow-y-auto whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
              <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-4">
                <button onClick={() => setIsReplyModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                  Cevapla
                </button>
                <button onClick={() => handleDelete(selectedMessage.id)} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">
                  Sil
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Okumak için bir mesaj seçin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Yanıt Modalı */}
      {isReplyModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Yanıtla: {selectedMessage.subject}</h2>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={10}
              className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-800"
              placeholder="Yanıtınızı buraya yazın..."
            />
            <div className="mt-4 flex justify-end gap-4">
              <button onClick={() => setIsReplyModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md">İptal</button>
              <button onClick={handleReply} disabled={isReplying} className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400">
                {isReplying ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}