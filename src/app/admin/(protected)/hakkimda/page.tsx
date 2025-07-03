/**
 * @file Hakkımda sayfasının içerik yönetim arayüzü (Yeniden Düzenlenmiş)
 * @description Bu sayfa, "Hakkımda" ile ilgili tüm alt bileşenleri
 *              (AboutForm, SkillManager, ExperienceManager) bir araya getirir,
 *              veri akışını yönetir ve tüm değişiklikleri tek bir işlemle kaydeder.
 */

"use client";

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { AboutData, Experience, Skill } from '@/types/content';
import CustomEditor from '@/components/admin/Editor';
import AboutForm from '@/components/admin/hakkimda/AboutForm';
import SkillManager from '@/components/admin/hakkimda/SkillManager';
import ExperienceManager from '@/components/admin/hakkimda/ExperienceManager';

/** Formun state'ini tutan veri tipi. */
type HakkimdaFormData = {
  about: Partial<AboutData>;
  content: string;
  skills: Skill[];
  experiences: Experience[];
};

export default function AdminHakkimdaPage() {
  const [formData, setFormData] = useState<HakkimdaFormData>({
    about: {},
    content: '',
    skills: [],
    experiences: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Sayfa için gerekli tüm verileri API'den çeker.
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // API rotası artık GET isteklerini daha basit yönetiyor.
      const [aboutRes, skillsRes, expRes] = await Promise.all([
        fetch('/api/admin/content?type=about&slug=about.md'),
        fetch('/api/admin/content?type=skills'),
        fetch('/api/admin/content?type=experiences'),
      ]);
      if (!aboutRes.ok || !skillsRes.ok || !expRes.ok) {
        throw new Error('Sayfa verileri yüklenirken bir hata oluştu.');
      }
      
      const aboutJson = await aboutRes.json();
      const skillsData = await skillsRes.json();
      const expData = await expRes.json();

      setFormData({
        about: aboutJson.data,
        content: aboutJson.content,
        skills: skillsData.map((name: string) => ({ name })),
        experiences: expData,
      });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- State Güncelleme Handler'ları ---

  const handleAboutChange = (field: keyof AboutData, value: any) => {
    setFormData(prev => ({ ...prev, about: { ...prev.about, [field]: value } }));
  };
  
  const handleSocialChange = (field: 'github' | 'linkedin' | 'twitter', value: string) => {
    setFormData(prev => ({ ...prev, about: { ...prev.about, social: { ...prev.about.social!, [field]: value } } }));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, field: keyof AboutData) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    const toastId = toast.loading('Görsel yükleniyor...');
    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: apiFormData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Yükleme başarısız.');
      handleAboutChange(field, result.url);
      toast.success('Görsel başarıyla yüklendi!', { id: toastId });
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  const handleContentChange = (text: string) => {
    setFormData(prev => ({ ...prev, content: text }));
  };

  const handleSkillsChange = (skills: Skill[]) => {
    setFormData(prev => ({ ...prev, skills }));
  };

  const handleExperiencesChange = (experiences: Experience[]) => {
    setFormData(prev => ({ ...prev, experiences }));
  };

  /**
   * Tüm form verilerini API'ye göndererek kaydeder.
   */
  const handleSave = async () => {
    const toastId = toast.loading('Değişiklikler kaydediliyor...');
    try {
      const { about, content, skills, experiences } = formData;

      const batchPayload = [
        { type: 'about', slug: 'about.md', data: about, content },
        { type: 'skills', slug: 'skills.json', data: skills.map(s => s.name) },
        { type: 'experiences', slug: 'experiences.json', data: experiences }
      ];

      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Değişiklikler kaydedilirken bir hata oluştu.');
      }

      toast.success('Tüm değişiklikler başarıyla kaydedildi!', { id: toastId });
      fetchData();
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  if (isLoading) return <div className="text-center py-10">Hakkımda sayfası verileri yükleniyor...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Hakkımda Sayfasını Düzenle</h1>
      <div className="space-y-12">
        
        <AboutForm 
          aboutData={formData.about}
          onAboutChange={handleAboutChange}
          onSocialChange={handleSocialChange}
          onFileChange={handleFileChange}
        />

        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Hakkımda İçeriği (Markdown)</h2>
          <CustomEditor
            value={formData.content}
            onChange={handleContentChange}
          />
        </div>

        <SkillManager 
          skills={formData.skills}
          onChange={handleSkillsChange}
        />

        <ExperienceManager
          experiences={formData.experiences}
          onChange={handleExperiencesChange}
        />

      </div>
      <div className="mt-12 text-right">
        <button onClick={handleSave} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors text-lg">Tüm Değişiklikleri Kaydet</button>
      </div>
    </div>
  );
}