"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  FaUserEdit, FaBlog, FaProjectDiagram, FaEnvelopeOpenText, 
  FaCog, FaPaperPlane, FaFileAlt, FaComments, 
  FaWindowRestore, FaGithub, FaSyncAlt 
} from 'react-icons/fa';
import { Message } from '@/types/content';

const adminLinks = [
  { href: "/admin/hakkimda", text: "Hakkımda Sayfasını Düzenle", icon: <FaUserEdit /> },
  { href: "/admin/projects", text: "Projeleri Yönet", icon: <FaProjectDiagram /> },
  { href: "/admin/blog", text: "Blog Yazılarını Yönet", icon: <FaBlog /> },
  { href: "/admin/popups", text: "Popup'ları Yönet", icon: <FaWindowRestore /> },
  { href: "/admin/messages", text: "Gelen Mesajlar", icon: <FaEnvelopeOpenText /> },
  { href: "/admin/seo", text: "Genel SEO Ayarları", icon: <FaCog /> },
];

interface Stats {
  projects: number;
  blogs: number;
  messages: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ projects: 0, blogs: 0, messages: 0 });
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrls = [
        '/api/admin/content?action=list&type=projects',
        '/api/admin/content?action=list&type=blog',
        '/api/admin/content?action=list&type=messages',
      ];
      const responses = await Promise.all(apiUrls.map(url => fetch(url)));
      
      for (const response of responses) {
        if (!response.ok) throw new Error(`API isteği başarısız: ${response.status}`);
      }

      const [projects, blogs, messages] = await Promise.all(responses.map(res => res.json()));

      setStats({
        projects: Array.isArray(projects) ? projects.length : 0,
        blogs: Array.isArray(blogs) ? blogs.length : 0,
        messages: Array.isArray(messages) ? messages.length : 0,
      });
      
      if (Array.isArray(messages)) {
        const sortedMessages = messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentMessages(sortedMessages.slice(0, 4));
      } else {
        setRecentMessages([]);
      }

    } catch (error) {
      console.error("Dashboard verileri yüklenirken hata:", error);
      toast.error("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTestEmail = async () => {
    const toastId = toast.loading('E-posta sunucusuyla bağlantı test ediliyor...');
    try {
      const response = await fetch('/api/test-email', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.details || 'Sunucudan beklenmeyen bir yanıt alındı.');
      }
      toast.success('E-posta sunucu bağlantısı başarılı!', { id: toastId });
    } catch (error) {
      console.error("E-posta test hatası:", error);
      toast.error(`Test başarısız: ${(error as Error).message}`, { id: toastId });
    }
  };

  const handleTestGitHub = async () => {
    const toastId = toast.loading('GitHub API ile bağlantı test ediliyor...');
    try {
      const response = await fetch('/api/admin/git/test-connection', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Sunucudan beklenmeyen bir yanıt alındı.');
      }
      toast.success(result.message, { id: toastId });
    } catch (error) {
      console.error("GitHub test hatası:", error);
      toast.error(`Test başarısız: ${(error as Error).message}`, { id: toastId });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Yönetim Paneli</h1>
        <button onClick={fetchData} disabled={isLoading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
          <FaSyncAlt className={`text-2xl ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Genel Bakış</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard icon={<FaProjectDiagram />} title="Toplam Proje" value={stats.projects} />
              <StatCard icon={<FaFileAlt />} title="Toplam Blog Yazısı" value={stats.blogs} />
              <StatCard icon={<FaComments />} title="Toplam Mesaj" value={stats.messages} />
            </>
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Son Gelen Mesajlar</h2>
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md min-h-[200px]">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            </div>
          ) : (
            recentMessages.length > 0 ? (
              <ul className="space-y-4">
                {recentMessages.map(msg => (
                  <li key={msg.id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{msg.name} - <span className="text-gray-500 dark:text-gray-400">{msg.subject}</span></p>
                      <span className="text-sm text-gray-400 dark:text-gray-500">{new Date(msg.timestamp).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">{msg.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-4">Gösterilecek yeni mesaj bulunmuyor.</p>
            )
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Kaynak Kodu Yönetimi</h2>
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
          <SourceCodeCommitter />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Hızlı Erişim ve Araçlar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminLinks.map((link) => (
            <Link href={link.href} key={link.href} className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transform transition-all duration-300 flex items-center space-x-4">
              <div className="text-brand-primary text-3xl">{link.icon}</div>
              <h3 className="text-xl font-semibold">{link.text}</h3>
            </Link>
          ))}
          <div onClick={handleTestEmail} className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transform transition-all duration-300 flex items-center space-x-4 cursor-pointer">
            <div className="text-green-500 text-3xl"><FaPaperPlane /></div>
            <h3 className="text-xl font-semibold">E-posta Bağlantısını Test Et</h3>
          </div>
          <div onClick={handleTestGitHub} className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transform transition-all duration-300 flex items-center space-x-4 cursor-pointer">
            <div className="text-gray-800 dark:text-white text-3xl"><FaGithub /></div>
            <h3 className="text-xl font-semibold">GitHub Bağlantısını Test Et</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, title, value }: { icon: JSX.Element, title: string, value: number }) => (
  <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className="text-4xl text-brand-primary">{icon}</div>
    <div>
      <p className="text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center space-x-4 animate-pulse">
    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
);

function SourceCodeCommitter() {
  const [message, setMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  const handleCommit = async () => {
    if (!message.trim()) {
      toast.error("Lütfen geçerli bir commit mesajı girin.");
      return;
    }
    if (!confirm("Bu işlem, projedeki tüm değişiklikleri (içerik dosyaları hariç) commit'leyip GitHub'a gönderecektir.\n\nBu işlem geri alınamaz. Emin misiniz?")) {
      return;
    }

    setIsCommitting(true);
    const toastId = toast.loading("Değişiklikler commit'leniyor ve GitHub'a gönderiliyor...");

    try {
      const response = await fetch('/api/admin/git/commit-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Bilinmeyen bir sunucu hatası oluştu.");
      }
      
      toast.success(result.message, { id: toastId });
      setMessage('');
    } catch (error) {
      console.error("Commit All API hatası:", error);
      toast.error(`Hata: ${(error as Error).message}`, { id: toastId });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        Bu bölüm, kaynak kodunda (örneğin, arayüz veya altyapı) yaptığınız değişiklikleri GitHub'a göndermenizi sağlar.
      </p>
      <div className="flex items-center space-x-2">
        <input 
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Örn: Admin paneli arayüzü güncellendi."
          className="flex-grow p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary"
          disabled={isCommitting}
        />
        <button 
          onClick={handleCommit}
          disabled={isCommitting || !message.trim()}
          className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCommitting ? "Gönderiliyor..." : "Commit'le ve Gönder"}
        </button>
      </div>
    </div>
  );
}