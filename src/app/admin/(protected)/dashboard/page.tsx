"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FaUserEdit, FaBlog, FaProjectDiagram, FaEnvelopeOpenText, FaCog, FaPaperPlane, FaChartBar, FaFileAlt, FaComments, FaWindowRestore } from 'react-icons/fa';
import { Message, Project, Blog as BlogType } from '@/types/content';

const adminLinks = [
  { href: "/admin/hakkimda", text: "Hakkımda Sayfası", icon: <FaUserEdit /> },
  { href: "/admin/projects", text: "Projeleri Yönet", icon: <FaProjectDiagram /> },
  { href: "/admin/blog", text: "Blog Yazıları", icon: <FaBlog /> },
  { href: "/admin/popups", text: "Popup Yönetimi", icon: <FaWindowRestore /> },
  { href: "/admin/messages", text: "Gelen Mesajlar", icon: <FaEnvelopeOpenText /> },
  { href: "/admin/seo", text: "SEO Ayarları", icon: <FaCog /> },
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
      const [projectsRes, blogsRes, messagesRes] = await Promise.all([
        fetch('/api/admin/content?action=list&type=projects'),
        fetch('/api/admin/content?action=list&type=blog'),
        fetch('/api/admin/content?action=list&type=messages'),
      ]);

      const projects = await projectsRes.json();
      const blogs = await blogsRes.json();
      const messages = await messagesRes.json();

      setStats({
        projects: Array.isArray(projects) ? projects.length : 0,
        blogs: Array.isArray(blogs) ? blogs.length : 0,
        messages: Array.isArray(messages) ? messages.length : 0,
      });
      
      // Sort messages by timestamp and get the most recent 4
      if (Array.isArray(messages)) {
        const sortedMessages = messages.sort((a: Message, b: Message) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentMessages(sortedMessages.slice(0, 4));
      } else {
        setRecentMessages([]);
      }

    } catch (error) {
      toast.error("İstatistikler yüklenirken bir hata oluştu.");
      console.error(error);
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
      if (response.ok && result.success) {
        toast.success('Bağlantı başarılı!', { id: toastId });
      } else {
        throw new Error(result.details || 'Bağlantı başarısız.');
      }
    } catch (error) {
      toast.error(`Test başarısız: ${(error as Error).message}`, { id: toastId });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Paneli</h1>

      {/* Genel Bakış */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Genel Bakış</h2>
        {isLoading ? (
          <div className="text-center">İstatistikler yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard icon={<FaProjectDiagram />} title="Toplam Proje" value={stats.projects} />
            <StatCard icon={<FaFileAlt />} title="Toplam Blog Yazısı" value={stats.blogs} />
            <StatCard icon={<FaComments />} title="Toplam Mesaj" value={stats.messages} />
          </div>
        )}
      </div>
      
      {/* Son Mesajlar */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Son Gelen Mesajlar</h2>
        {isLoading ? (
          <div className="text-center">Mesajlar yükleniyor...</div>
        ) : (
          <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            {recentMessages.length > 0 ? (
              <ul className="space-y-4">
                {recentMessages.map(msg => (
                  <li key={msg.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{msg.name} - <span className="text-gray-500">{msg.subject}</span></p>
                      <span className="text-sm text-gray-400">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">{msg.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Henüz hiç mesaj yok.</p>
            )}
          </div>
        )}
      </div>


      {/* Hızlı Erişim */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transform transition-all duration-300 flex items-center space-x-4">
                <div className="text-brand-primary text-3xl">{link.icon}</div>
                <h2 className="text-xl font-semibold">{link.text}</h2>
              </div>
            </Link>
          ))}
          <div 
            onClick={handleTestEmail}
            className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transform transition-all duration-300 flex items-center space-x-4 cursor-pointer"
          >
            <div className="text-green-500 text-3xl"><FaPaperPlane /></div>
            <h2 className="text-xl font-semibold">E-posta Bağlantısını Test Et</h2>
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
      <p className="text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);