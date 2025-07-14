/**
 * @file Yönetim panelinin ana gösterge sayfası (dashboard).
 * @description Bu sayfa, projenin genel durumu hakkında özet bilgiler sunar.
 *              İstatistikler (toplam proje, blog, mesaj sayısı), son gelen mesajlar,
 *              hızlı erişim linkleri ve kaynak kodu yönetimi gibi bileşenleri içerir.
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { RecentMessages } from "@/components/admin/RecentMessages";
import { 
  FaUserEdit, FaBlog, FaProjectDiagram, FaEnvelopeOpenText,
  FaCog, FaPaperPlane, FaFileAlt, FaComments,
  FaWindowRestore, FaSyncAlt, FaGithub
} from 'react-icons/fa';
import { Message } from '@/types/content';

// Yönetim panelindeki hızlı erişim linklerinin listesi
const adminLinks = [
  { href: "/admin/hakkimda", text: "Hakkımda Sayfasını Düzenle", icon: <FaUserEdit /> },
  { href: "/admin/projects", text: "Projeleri Yönet", icon: <FaProjectDiagram /> },
  { href: "/admin/blog", text: "Blog Yazılarını Yönet", icon: <FaBlog /> },
  { href: "/admin/popups", text: "Popup'ları Yönet", icon: <FaWindowRestore /> },
  { href: "/admin/messages", text: "Gelen Mesajlar", icon: <FaEnvelopeOpenText /> },
  { href: "/admin/seo", text: "Genel SEO Ayarları", icon: <FaCog /> },
];

/** İstatistik kartları için veri tipi. */
interface Stats {
  projects: number;
  blogs: number;
  messages: number;
}

/**
 * Gösterge panelinin ana bileşeni.
 */
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ projects: 0, blogs: 0, messages: 0 });
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Sayfa için gerekli tüm verileri (istatistikler, son mesajlar) API'den çeker.
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Tüm API isteklerini paralel olarak başlat
      const responses = await Promise.all([
        fetch('/api/admin/content?action=list&type=projects'),
        fetch('/api/admin/content?action=list&type=blog'),
        fetch('/api/admin/content?action=list&type=messages'),
      ]);
      
      // Herhangi bir istek başarısız olduysa hata fırlat
      for (const response of responses) {
        if (!response.ok) throw new Error(`API isteği başarısız oldu: ${response.statusText}`);
      }

      const [projects, blogs, messages] = await Promise.all(responses.map(res => res.json()));

      // İstatistikleri güncelle
      setStats({
        projects: Array.isArray(projects) ? projects.length : 0,
        blogs: Array.isArray(blogs) ? blogs.length : 0,
        messages: Array.isArray(messages) ? messages.length : 0,
      });
      
      // Son mesajları tarihe göre sırala ve state'e ata
      if (Array.isArray(messages)) {
        const sortedMessages = messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentMessages(sortedMessages.slice(0, 4)); // En son 4 mesajı al
      } else {
        setRecentMessages([]);
      }

    } catch (error) {
      console.error("Dashboard verileri yüklenirken hata:", error);
      toast.error("Gösterge paneli verileri yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bileşen ilk yüklendiğinde verileri çek
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * E-posta sunucu bağlantısını test etmek için API'ye istek gönderir.
   */
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

  /**
   * GitHub API bağlantısını test etmek için API'ye istek gönderir.
   */
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
        <button onClick={fetchData} disabled={isLoading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50" aria-label="Verileri Yenile">
          <FaSyncAlt className={`text-2xl ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Genel Bakış ve İstatistikler */}
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
      
      {/* Son Gelen Mesajlar */}
      <RecentMessages messages={recentMessages} isLoading={isLoading} />

      {/* Kaynak Kodu Yönetimi */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Kaynak Kodu Yönetimi</h2>
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
          <SourceCodeCommitter />
        </div>
      </div>

      {/* Hızlı Erişim ve Araçlar */}
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

/** İstatistik kartı bileşeni. */
const StatCard = ({ icon, title, value }: { icon: JSX.Element, title: string, value: number }) => (
  <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className="text-4xl text-brand-primary">{icon}</div>
    <div>
      <p className="text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

/** İstatistik kartı için iskelet (skeleton) yükleme göstergesi. */
const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center space-x-4 animate-pulse">
    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
);

/**
 * Kaynak kodu değişikliklerini yöneten ve dallar arasında geçiş yapmayı sağlayan bileşen.
 */
function SourceCodeCommitter() {
  const [commitType, setCommitType] = useState('Feat');
  const [commitSubject, setCommitSubject] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  
  const [branches, setBranches] = useState<{ name: string; isCurrent: boolean }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Sadece "Feat" ve "Fix" commit tipleri
  const commitTypes = [
    { value: 'Feat', label: '✨ Yeni Özellik' },
    { value: 'Fix', label: '🐛 Hata Düzeltme' },
  ];

  // Dalları çekmek için fonksiyon
  const fetchBranches = useCallback(async () => {
    setIsLoadingBranches(true);
    try {
      const response = await fetch('/api/admin/git/branches');
      if (!response.ok) throw new Error('Dallar alınamadı.');
      const data = await response.json();
      setBranches(data.branches);
      const current = data.branches.find((b: { isCurrent: boolean; }) => b.isCurrent);
      if (current) {
        setSelectedBranch(current.name);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleCommit = async () => {
    if (!commitSubject.trim()) {
      toast.error("Lütfen geçerli bir commit içeriği girin.");
      return;
    }

    // Commit mesajını "Tip: [içerik]" formatında oluştur
    const message = `${commitType}: ${commitSubject.trim()}`;

    const confirmationMessage = `Bu işlem, projedeki tüm değişiklikleri GitHub deposuna gönderecektir.\n\nCommit Mesajı: "${message}"\n\nBu işlem geri alınamaz. Emin misiniz?`;
    if (!window.confirm(confirmationMessage)) return;

    setIsCommitting(true);
    const toastId = toast.loading("Değişiklikler commit'leniyor ve gönderiliyor...");

    try {
      const response = await fetch('/api/admin/git/commit-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Bilinmeyen bir sunucu hatası oluştu.");
      
      toast.success(result.message, { id: toastId });
      setCommitSubject('');
    } catch (error) {
      console.error("Commit All API Hatası:", error);
      toast.error(`Hata: ${(error as Error).message}`, { id: toastId });
    } finally {
      setIsCommitting(false);
    }
  };

  const handleSwitchBranch = async () => {
    if (!selectedBranch) {
      toast.error("Lütfen bir dal seçin.");
      return;
    }
    
    setIsSwitching(true);
    const toastId = toast.loading(`'${selectedBranch}' dalına geçiliyor...`);

    try {
      const response = await fetch('/api/admin/git/switch-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: selectedBranch }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Dal değiştirme başarısız.");

      toast.success(result.message, { id: toastId });
      await fetchBranches(); // Dal listesini ve mevcut dalı yenile
    } catch (error) {
      toast.error(`Hata: ${(error as Error).message}`, { id: toastId });
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dal Değiştirme Bölümü */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Dal Yönetimi</h3>
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/30">
          <div className="flex-grow">
            <label htmlFor="branch-select" className="block text-sm font-medium mb-1">Aktif Dal</label>
            {isLoadingBranches ? (
              <div className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse h-10"></div>
            ) : (
              <select 
                id="branch-select" 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value)} 
                className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                disabled={isSwitching || branches.length === 0}
              >
                {branches.map(branch => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name} {branch.isCurrent ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="self-end">
            <button 
              onClick={handleSwitchBranch} 
              disabled={isSwitching || isLoadingBranches || branches.find(b => b.isCurrent)?.name === selectedBranch}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSwitching ? "Değiştiriliyor..." : "Dal Değiştir"}
            </button>
          </div>
        </div>
      </div>

      {/* Commit Bölümü */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Değişiklikleri Gönder</h3>
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kaynak kodundaki değişiklikleri GitHub deposuna gönderin.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="commit-type" className="block text-sm font-medium mb-1">Tip</label>
              <select id="commit-type" value={commitType} onChange={(e) => setCommitType(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" disabled={isCommitting}>
                {commitTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="commit-subject" className="block text-sm font-medium mb-1">İçerik</label>
              <input id="commit-subject" type="text" value={commitSubject} onChange={(e) => setCommitSubject(e.target.value)} placeholder="Değişikliklerin kısa ve net bir özeti" className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" disabled={isCommitting} />
            </div>
          </div>
          
          <div className="text-right">
            <button onClick={handleCommit} disabled={isCommitting || !commitSubject.trim()} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isCommitting ? "Gönderiliyor..." : "Commit'le ve Gönder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}