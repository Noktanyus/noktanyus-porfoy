"use client";

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { AboutData, Experience, Skill } from '@/types/content';
import dynamic from 'next/dynamic';
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';

const MdEditor = dynamic(() => import('react-markdown-editor-lite'), { ssr: false });
const mdParser = new MarkdownIt();

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aboutRes, skillsRes, expRes] = await Promise.all([
        fetch('/api/admin/content?type=about&slug=about.md'),
        fetch('/api/admin/content?type=skills'),
        fetch('/api/admin/content?type=experiences'),
      ]);
      if (!aboutRes.ok || !skillsRes.ok || !expRes.ok) throw new Error('Veriler yüklenemedi.');
      
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

  const handleAboutChange = (field: keyof AboutData, value: any) => {
    setFormData(prev => ({ ...prev, about: { ...prev.about, [field]: value } }));
  };
  
  const handleSocialChange = (field: 'github' | 'linkedin' | 'twitter', value: string) => {
    setFormData(prev => ({ ...prev, about: { ...prev.about, social: { ...prev.about.social!, [field]: value } } }));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, field: keyof AboutData) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const toastId = toast.loading('Görsel yükleniyor...');
    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Yükleme başarısız.');
      handleAboutChange(field, result.filePath);
      toast.success('Görsel başarıyla yüklendi!', { id: toastId });
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
    const updated = [...formData.experiences];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, experiences: updated }));
  };

  const addExperience = () => setFormData(prev => ({ ...prev, experiences: [...prev.experiences, { title: '', company: '', date: '', description: '' }] }));
  const removeExperience = (index: number) => setFormData(prev => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== index) }));
  
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newSkillName = (e.target as HTMLInputElement).value.trim();
      if (newSkillName && !formData.skills.find(s => s.name === newSkillName)) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, { name: newSkillName }] }));
        (e.target as HTMLInputElement).value = '';
      }
    }
  };
  const removeSkill = (index: number) => setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    const toastId = toast.loading('Değişiklikler kaydediliyor...');
    try {
      const { about, content, skills, experiences } = formData;
      const promises = [
        fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'about', slug: 'about.md', data: about, content }) }),
        fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'skills', slug: 'skills.json', data: skills.map(s => s.name) }) }),
        fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'experiences', slug: 'experiences.json', data: experiences }) }),
      ];
      const responses = await Promise.all(promises);
      if (responses.some(res => !res.ok)) throw new Error('Değişiklikler kaydedilemedi.');
      toast.success('Tüm değişiklikler başarıyla kaydedildi!', { id: toastId });
      fetchData();
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  if (isLoading) return <div className="text-center py-10">Yükleniyor...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Hakkımda Sayfasını Düzenle</h1>
      <div className="space-y-12">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Genel Bilgiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Header Başlığı" value={formData.about.headerTitle || ''} onChange={(e) => handleAboutChange('headerTitle', e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="İsim Soyisim" value={formData.about.name || ''} onChange={(e) => handleAboutChange('name', e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Unvan" value={formData.about.title || ''} onChange={(e) => handleAboutChange('title', e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Alt Başlık" value={formData.about.subTitle || ''} onChange={(e) => handleAboutChange('subTitle', e.target.value)} className="w-full p-2 border rounded" />
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Sosyal Medya</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input type="text" placeholder="GitHub URL" value={formData.about.social?.github || ''} onChange={(e) => handleSocialChange('github', e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="LinkedIn URL" value={formData.about.social?.linkedin || ''} onChange={(e) => handleSocialChange('linkedin', e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Twitter URL" value={formData.about.social?.twitter || ''} onChange={(e) => handleSocialChange('twitter', e.target.value)} className="w-full p-2 border rounded" />
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Görseller</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium mb-2">Profil Fotoğrafı</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profileImage')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              {formData.about.profileImage && <img src={formData.about.profileImage} alt="Profil Önizleme" className="mt-4 rounded-lg w-32 h-32 object-cover"/>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hakkımda Sayfası Görseli</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'aboutImage')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
              {formData.about.aboutImage && <img src={formData.about.aboutImage} alt="Hakkımda Görsel Önizleme" className="mt-4 rounded-lg w-full h-auto object-cover"/>}
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Hakkımda İçeriği (Markdown)</h2>
          <MdEditor value={formData.content} style={{ height: '500px' }} renderHTML={text => mdParser.render(text)} onChange={({ text }) => setFormData(prev => ({ ...prev, content: text }))} />
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Yetenekler</h2>
          <div className="flex items-center gap-4 mb-4">
            <input type="text" placeholder="Yeni yetenek ekle" onKeyDown={handleSkillKeyDown} className="w-full p-2 border rounded" />
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span>{skill.name}</span>
                <button onClick={() => removeSkill(index)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">İş Tecrübeleri</h2>
          <div className="space-y-4">
            {formData.experiences.map((exp, index) => (
              <div key={index} className="p-4 border rounded-md space-y-2">
                <input type="text" placeholder="Unvan" value={exp.title} onChange={(e) => handleExperienceChange(index, 'title', e.target.value)} className="w-full p-2 border rounded" />
                <input type="text" placeholder="Şirket" value={exp.company} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} className="w-full p-2 border rounded" />
                <input type="text" placeholder="Tarih (Örn: 2022 - Günümüz)" value={exp.date} onChange={(e) => handleExperienceChange(index, 'date', e.target.value)} className="w-full p-2 border rounded" />
                <textarea placeholder="Açıklama" value={exp.description} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} className="w-full p-2 border rounded" rows={3} />
                <button onClick={() => removeExperience(index)} className="text-red-500 hover:text-red-700">Bu Tecrübeyi Sil</button>
              </div>
            ))}
          </div>
          <button onClick={addExperience} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Yeni Tecrübe Ekle</button>
        </div>
      </div>
      <div className="mt-12 text-right">
        <button onClick={handleSave} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors text-lg">Tüm Değişiklikleri Kaydet</button>
      </div>
    </div>
  );
}