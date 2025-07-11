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
  FaWindowRestore, FaSyncAlt
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
 * Conventional Commits standardına göre kaynak kodu değişikliklerini yöneten akıllı bileşen.
 * Değişiklikleri analiz eder, öneriler sunar ve kullanıcı dostu bir arayüz sağlar.
 */
function SourceCodeCommitter() {
  const [commitType, setCommitType] = useState('feat');
  const [commitScope, setCommitScope] = useState('');
  const [commitSubject, setCommitSubject] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Commit tipleri için Türkçe açıklamalar ve İngilizce değerler
  const commitTypes = [
    { value: 'feat', label: '✨ Yeni Özellik', description: 'Kullanıcıya yönelik yeni bir özellik ekler.', example: 'feat(auth): add login with Google button' },
    { value: 'fix', label: '🐛 Hata Düzeltme', description: 'Koddaki bir hatayı düzeltir.', example: 'fix(api): correct user data validation' },
    { value: 'docs', label: '📚 Dokümantasyon', description: 'Sadece dokümantasyon dosyalarını günceller.', example: 'docs(readme): update setup instructions' },
    { value: 'style', label: '💎 Stil', description: 'Kodun anlamını etkilemeyen stil değişiklikleri (boşluk, formatlama vb.).', example: 'style(components): format code with Prettier' },
    { value: 'refactor', label: '📦 Yeniden Yapılandırma', description: 'Hata düzeltmeyen veya özellik eklemeyen kod değişiklikleri.', example: 'refactor(services): simplify data fetching logic' },
    { value: 'perf', label: '🚀 Performans', description: 'Performansı artıran bir kod değişikliği.', example: 'perf(images): optimize image loading on homepage' },
    { value: 'test', label: '🚨 Test', description: 'Eksik testleri ekler veya mevcut testleri düzeltir.', example: 'test(utils): add new tests for date formatting' },
    { value: 'build', label: '🛠️ Build Sistemi', description: 'Build sistemini veya dış bağımlılıkları etkileyen değişiklikler.', example: 'build(deps): upgrade Next.js to the latest version' },
    { value: 'ci', label: '⚙️ CI/CD', description: 'CI/CD yapılandırma dosyaları ve scriptlerindeki değişiklikler.', example: 'ci(github-actions): fix deployment script' },
    { value: 'chore', label: '🧹 Diğer İşler', description: 'Kaynak veya test dosyalarını değiştirmeyen diğer tüm işler.', example: 'chore: update .gitignore file' },
  ];

  const selectedCommitType = commitTypes.find(t => t.value === commitType);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const toastId = toast.loading("Değişiklikler analiz ediliyor...");
    try {
      const response = await fetch('/api/admin/git/analyze-changes', { method: 'POST' });
      const suggestion = await response.json();
      if (!response.ok) throw new Error(suggestion.error || "Analiz başarısız oldu.");

      setCommitType(suggestion.type);
      setCommitScope(suggestion.scope);
      setCommitSubject(suggestion.subject);
      toast.success("Analiz tamamlandı ve öneriler forma dolduruldu!", { id: toastId });
    } catch (error) {
      toast.error(`Analiz hatası: ${(error as Error).message}`, { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommit = async () => {
    if (!commitSubject.trim()) {
      toast.error("Lütfen geçerli bir commit konusu girin.");
      return;
    }

    // Commit mesajını İngilizce ve standartlara uygun oluştur
    let message = `${commitType}`;
    if (commitScope.trim()) {
      message += `(${commitScope.trim()})`;
    }
    message += `: ${commitSubject.trim()}`;

    const confirmationMessage = `Bu işlem, projedeki tüm değişiklikleri GitHub'a gönderecektir.\n\nCommit Mesajı: "${message}"\n\nBu işlem geri alınamaz. Emin misiniz?`;
    if (!confirm(confirmationMessage)) return;

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
      setCommitScope('');
      setCommitSubject('');
    } catch (error) {
      console.error("Commit All API Hatası:", error);
      toast.error(`Hata: ${(error as Error).message}`, { id: toastId });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Kaynak kodundaki değişiklikleri Conventional Commits standardına uygun olarak GitHub'a gönderin.
        </p>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || isCommitting}
          className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
        >
          {isAnalyzing ? "Analiz Ediliyor..." : "Değişiklikleri Analiz Et ve Öner"}
        </button>
      </div>
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="commit-type" className="block text-sm font-medium mb-1">Tip</label>
            <select id="commit-type" value={commitType} onChange={(e) => setCommitType(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" disabled={isCommitting}>
              {commitTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="commit-scope" className="block text-sm font-medium mb-1">Kapsam <span className="text-xs text-gray-500">(isteğe bağlı)</span></label>
            <input id="commit-scope" type="text" value={commitScope} onChange={(e) => setCommitScope(e.target.value)} placeholder="örn: auth, api, bileşenler" className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" disabled={isCommitting} />
          </div>
        </div>
        
        {selectedCommitType && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-600 dark:text-gray-400">
            <p><strong>Açıklama:</strong> {selectedCommitType.description}</p>
            <p><strong>Örnek:</strong> <code className="font-mono">{selectedCommitType.example}</code></p>
          </div>
        )}

        <div>
          <label htmlFor="commit-subject" className="block text-sm font-medium mb-1">Konu (İngilizce ve küçük harfle başlayın)</label>
          <input id="commit-subject" type="text" value={commitSubject} onChange={(e) => setCommitSubject(e.target.value)} placeholder="Değişikliklerin kısa ve net bir özeti" className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" disabled={isCommitting} />
        </div>
        
        <div className="text-right">
          <button onClick={handleCommit} disabled={isCommitting || !commitSubject.trim()} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isCommitting ? "Gönderiliyor..." : "Commit'le ve Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}