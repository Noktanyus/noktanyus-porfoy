/**
 * @file Hakkımda sayfasının içerik yönetim arayüzü (Veritabanı Uyumlu)
 * @description Bu sayfa, "Hakkımda" ile ilgili tüm verileri veritabanından
 *              çeker, alt bileşenleri (AboutForm, SkillManager, ExperienceManager)
 *              yönetir ve tüm değişiklikleri tek bir işlemle kaydeder.
 */

"use client";

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { About, Experience, Skill } from '@prisma/client';
import { AboutWithRelations } from '@/types/content';
import CustomEditor from '@/components/admin/Editor';
import AboutForm from '@/components/admin/hakkimda/AboutForm';
import SkillManager from '@/components/admin/hakkimda/SkillManager';
import ExperienceManager from '@/components/admin/hakkimda/ExperienceManager';

/** Formun state'ini tutan veri tipi. */
type HakkimdaFormData = {
  about: Partial<About>;
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
      const response = await fetch('/api/admin/content?type=about');
      if (!response.ok) {
        throw new Error('Hakkımda verileri yüklenirken bir hata oluştu.');
      }
      
      const aboutData: AboutWithRelations[] = await response.json();

      if (aboutData && aboutData.length > 0) {
        setFormData({
          about: aboutData[0],
          content: aboutData[0].content,
          skills: aboutData[0].skills || [],
          experiences: aboutData[0].experiences || [],
        });
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- State Güncelleme Handler'ları ---

  const handleAboutChange = (field: keyof About, value: any) => {
    setFormData(prev => ({ ...prev, about: { ...prev.about, [field]: value } }));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, field: keyof About) => {
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

      const payload = {
        about: { ...about, content },
        skills,
        experiences,
      };

      const response = await fetch('/api/admin/hakkimda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
