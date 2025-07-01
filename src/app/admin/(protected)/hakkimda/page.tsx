"use client";

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { AboutData, Experience, Skill } from '@/types/content';
import dynamic from 'next/dynamic';
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';

const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false,
});

const mdParser = new MarkdownIt();

export default function AdminHakkimdaPage() {
  const [aboutData, setAboutData] = useState<Partial<AboutData>>({});
  const [content, setContent] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aboutRes, skillsRes, expRes] = await Promise.all([
        fetch('/api/admin/content?action=get&type=about&slug=about.md'),
        fetch('/api/admin/content?action=list&type=skills'),
        fetch('/api/admin/content?action=list&type=experiences'),
      ]);
      if (!aboutRes.ok) throw new Error('Hakkımda verileri yüklenemedi.');
      if (!skillsRes.ok) throw new Error('Yetenekler yüklenemedi.');
      if (!expRes.ok) throw new Error('Tecrübeler yüklenemedi.');
      
      const aboutJson = await aboutRes.json();
      const skillsData = await skillsRes.json();
      const expData = await expRes.json();

      setAboutData(aboutJson.data);
      setContent(aboutJson.content);
      setSkills(skillsData.map((name: string) => ({ name }))); // string[] -> Skill[] dönüşümü
      setExperiences(expData);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, field: keyof AboutData) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Görsel yükleniyor...');
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Yükleme başarısız.');
      
      setAboutData(prev => ({ ...prev, [field]: result.filePath }));
      toast.success('Görsel başarıyla yüklendi!', { id: toastId });
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  const handleSave = async () => {
    const toastId = toast.loading('Değişiklikler kaydediliyor...');
    try {
      // Hakkımda verilerini ve içeriği kaydet
      const aboutPromise = fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'about', 
          slug: 'about.md', 
          data: aboutData, 
          content 
        }),
      });

      // Yetenekleri kaydet
      const skillsPromise = fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'skills',
          slug: 'skills.json',
          data: skills.map(s => s.name), // Skill[] -> string[] dönüşümü
        }),
      });

      const [aboutResponse, skillsResponse] = await Promise.all([aboutPromise, skillsPromise]);

      if (!aboutResponse.ok || !skillsResponse.ok) {
        throw new Error('Değişiklikler kaydedilemedi.');
      }

      toast.success('Tüm değişiklikler başarıyla kaydedildi!', { id: toastId });
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  if (isLoading) return <div className="text-center py-10">Yükleniyor...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Hakkımda Sayfasını Düzenle</h1>
      
      <div className="space-y-12">
        {/* Genel Bilgiler */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Genel Bilgiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Header Başlığı" value={aboutData.headerTitle || ''} onChange={(e) => setAboutData({ ...aboutData, headerTitle: e.target.value })} className="w-full p-2 border rounded" />
            <input type="text" placeholder="İsim Soyisim" value={aboutData.name || ''} onChange={(e) => setAboutData({ ...aboutData, name: e.target.value })} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Unvan" value={aboutData.title || ''} onChange={(e) => setAboutData({ ...aboutData, title: e.target.value })} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Alt Başlık" value={aboutData.subTitle || ''} onChange={(e) => setAboutData({ ...aboutData, subTitle: e.target.value })} className="w-full p-2 border rounded" />
          </div>
        </div>

        {/* Sosyal Medya */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Sosyal Medya Linkleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input type="text" placeholder="GitHub URL" value={aboutData.social?.github || ''} onChange={(e) => setAboutData({ ...aboutData, social: { ...aboutData.social!, github: e.target.value } })} className="w-full p-2 border rounded" />
            <input type="text" placeholder="LinkedIn URL" value={aboutData.social?.linkedin || ''} onChange={(e) => setAboutData({ ...aboutData, social: { ...aboutData.social!, linkedin: e.target.value } })} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Twitter URL" value={aboutData.social?.twitter || ''} onChange={(e) => setAboutData({ ...aboutData, social: { ...aboutData.social!, twitter: e.target.value } })} className="w-full p-2 border rounded" />
          </div>
        </div>

        {/* Görseller */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Görseller</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium mb-2">Profil Fotoğrafı</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profileImage')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              {aboutData.profileImage && <img src={aboutData.profileImage} alt="Profil Önizleme" className="mt-4 rounded-lg w-32 h-32 object-cover"/>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hakkımda Sayfası Görseli</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'aboutImage')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
              {aboutData.aboutImage && <img src={aboutData.aboutImage} alt="Hakkımda Görsel Önizleme" className="mt-4 rounded-lg w-full h-auto object-cover"/>}
            </div>
          </div>
        </div>

        {/* Hakkımda İçeriği */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Hakkımda İçeriği (Markdown)</h2>
          <MdEditor
            value={content}
            style={{ height: '500px' }}
            renderHTML={text => mdParser.render(text)}
            onChange={({ text }) => setContent(text)}
          />
        </div>

        {/* Yetenekler */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Yetenekler</h2>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Yeni yetenek ekle"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const newSkill = (e.target as HTMLInputElement).value.trim();
                  if (newSkill && !skills.find(s => s.name === newSkill)) {
                    setSkills([...skills, { name: newSkill }]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span>{skill.name}</span>
                <button
                  onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 text-right">
        <button onClick={handleSave} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors text-lg">
          Tüm Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
}
