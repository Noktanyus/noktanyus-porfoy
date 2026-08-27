'use client';

/**
 * Chat Widget
 *
 * In-app canli destek pop-up bileseni. Kullanici mevcut conversation'i
 * goruntuleyebilir ya da yeni conversation baslatabilir.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaComment, FaTimes, FaPaperPlane, FaPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Conversation {
  id: string;
  subject: string;
  status: string;
  lastMessageAt: string | null;
  unreadByUser: number;
}

interface Message {
  id: string;
  senderRole: 'user' | 'admin';
  senderName: string;
  content: string;
  createdAt: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      if (data.success) {
        setConversations(data.data.conversations ?? []);
      }
    } catch {
      // Sessizce yoksay
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages ?? []);
        // Okundu olarak isaretle
        fetch(`/api/chat/conversations/${conversationId}/read`, { method: 'POST' }).catch(() => {});
      }
    } catch {
      // Sessizce yoksay
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open, fetchConversations]);

  useEffect(() => {
    if (active) {
      fetchMessages(active.id);
    }
  }, [active, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!active || !input.trim()) return;
    const content = input.trim();
    setInput('');

    try {
      const res = await fetch(`/api/chat/conversations/${active.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data.message]);
      } else {
        toast.error(data.error?.message ?? 'Mesaj gönderilemedi');
      }
    } catch {
      toast.error('Bağlantı hatası');
    }
  };

  const handleCreate = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error('Konu ve mesaj gerekli');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject, message: newMessage }),
      });
      const data = await res.json();
      if (data.success) {
        const conv = data.data.conversation;
        setConversations((prev) => [conv, ...prev]);
        setActive(conv);
        setShowNewForm(false);
        setNewSubject('');
        setNewMessage('');
        toast.success('Konuşma başlatıldı');
      } else {
        toast.error(data.error?.message ?? 'Konuşma başlatılamadı');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger butonu */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Canlı destek"
        type="button"
      >
        {open ? <FaTimes /> : <FaComment />}
        {conversations.some((c) => c.unreadByUser > 0) && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {conversations.reduce((sum, c) => sum + c.unreadByUser, 0)}
          </span>
        )}
      </button>

      {/* Chat paneli */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)] glass-card-premium flex flex-col shadow-2xl">
          {!active ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <h3 className="font-bold">Destek</h3>
                <button
                  onClick={() => setShowNewForm((s) => !s)}
                  className="text-primary"
                  aria-label="Yeni konuşma"
                  type="button"
                >
                  <FaPlus />
                </button>
              </div>

              {showNewForm ? (
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Konu"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full p-2 rounded border border-border bg-background text-sm"
                    maxLength={200}
                  />
                  <textarea
                    placeholder="Mesajınız"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full p-2 rounded border border-border bg-background text-sm resize-none"
                    rows={5}
                    maxLength={5000}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full py-2 rounded bg-primary text-primary-foreground text-sm disabled:opacity-50"
                    type="button"
                  >
                    {loading ? 'Gönderiliyor...' : 'Başlat'}
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-2">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Henüz konuşma yok. Yeni konuşma başlatmak için + simgesine tıklayın.
                    </p>
                  ) : (
                    conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setActive(c)}
                        className="w-full text-left p-3 rounded hover:bg-muted/50 transition-colors"
                        type="button"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">{c.subject}</p>
                          {c.unreadByUser > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {c.unreadByUser}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.status} · {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString('tr-TR') : ''}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActive(null)}
                    className="text-muted-foreground hover:text-foreground"
                    type="button"
                  >
                    ←
                  </button>
                  <div>
                    <h3 className="font-bold text-sm">{active.subject}</h3>
                    <p className="text-xs text-muted-foreground">{active.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-2 text-sm ${
                        m.senderRole === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {m.senderName} · {new Date(m.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-border/30 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Mesaj yazın..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 p-2 rounded border border-border bg-background text-sm"
                  maxLength={5000}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
                  type="button"
                  aria-label="Gönder"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default ChatWidget;
