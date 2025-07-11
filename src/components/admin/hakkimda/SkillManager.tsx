/**
 * @file Yetenek Yönetim Bileşeni (Akıllı & Hibrit)
 * @description Yetenekleri yönetir. Otomatik olarak ikon bulur,
 *              önizleme gösterir ve özel resim yüklemeye olanak tanır.
 */
"use client";

import { useState, ChangeEvent, createElement, useEffect, useCallback } from 'react';
import { Skill } from '@prisma/client';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { FaPlus, FaTrash, FaUpload, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { findIcon, iconComponents } from '@/lib/icon-map'; // Merkezi modülü import et

export default function SkillManager({ skills, onChange }: { skills: Skill[], onChange: (skills: Skill[]) => void }) {
  const [newSkillName, setNewSkillName] = useState('');
  const [suggestedIcon, setSuggestedIcon] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customIconFile, setCustomIconFile] = useState<File | null>(null);
  const [customIconPreview, setCustomIconPreview] = useState<string | null>(null);

  // Kullanıcı yetenek adını yazdıkça ikon öner
  useEffect(() => {
    if (customIconFile) {
      setSuggestedIcon(null);
      return;
    }
    const iconName = findIcon(newSkillName);
    setSuggestedIcon(iconName);
  }, [newSkillName, customIconFile]);

  const handleCustomIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName) {
      toast.error('Lütfen bir yetenek adı girin.');
      return;
    }

    // Mükerrer kontrolü
    if (skills.some(skill => skill.name.toLowerCase() === newSkillName.toLowerCase())) {
      toast.error(`'${newSkillName}' adlı yetenek zaten mevcut.`);
      return;
    }

    let iconValue: string | null = suggestedIcon;

    // Özel ikon yükleniyorsa, öneriyi geçersiz kıl
    if (customIconFile) {
      setIsUploading(true);
      const apiFormData = new FormData();
      apiFormData.append('file', customIconFile);
      const toastId = toast.loading('Özel ikon yükleniyor...');

      try {
        const response = await fetch('/api/admin/upload', { method: 'POST', body: apiFormData });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Yükleme başarısız.');
        iconValue = result.url;
        toast.success('İkon başarıyla yüklendi!', { id: toastId });
      } catch (error) {
        toast.error((error as Error).message, { id: toastId });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const newSkill: Skill = {
      id: `new_${Date.now()}`,
      name: newSkillName,
      icon: iconValue,
      aboutId: null,
    };

    onChange([...skills, newSkill]);
    
    // Formu temizle
    setNewSkillName('');
    setCustomIconFile(null);
    setCustomIconPreview(null);
    const fileInput = document.getElementById('custom-icon-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveSkill = (id: string) => {
    onChange(skills.filter(skill => skill.id !== id));
  };

  const renderIcon = useCallback((skill: Skill) => {
    const isUrl = skill.icon && (skill.icon.startsWith('/') || skill.icon.startsWith('http'));
    if (isUrl) {
      return <Image src={skill.icon!} alt={skill.name} width={28} height={28} className="rounded-md object-contain" />;
    }
    const IconComponent = skill.icon ? iconComponents[skill.icon] : null;
    if (IconComponent) {
      return createElement(IconComponent, { className: "text-2xl" });
    }
    return <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded-md" />;
  }, []);

  return (
    <div className="p-6 md:p-8 bg-white dark:bg-dark-card rounded-xl shadow-subtle">
      <h2 className="text-3xl font-bold mb-6 text-light-text dark:text-dark-text">Teknik Yetkinlikler</h2>

      {/* Yeni Yetenek Ekleme Formu */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          <div className="flex-grow w-full">
            <label htmlFor="skill-name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Yetkinlik Adı</label>
            <div className="flex items-center gap-3">
              <input id="skill-name" placeholder="Örn: Docker" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary" />
              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" title="Önerilen İkon">
                {customIconPreview ? <Image src={customIconPreview} alt="Önizleme" width={32} height={32} className="rounded-md" /> : suggestedIcon && iconComponents[suggestedIcon] ? createElement(iconComponents[suggestedIcon], { className: "text-3xl text-gray-700 dark:text-gray-200" }) : <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-md" />}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-2 w-full md:w-auto">
             <label htmlFor="custom-icon-upload" className="w-full text-center cursor-pointer bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors flex items-center justify-center gap-2">
                <FaUpload /> Özel İkon Yükle
                <input id="custom-icon-upload" type="file" accept="image/*,.svg" onChange={handleCustomIconChange} className="hidden" />
             </label>
             {customIconFile && <Button variant="ghost" size="sm" onClick={() => { setCustomIconFile(null); setCustomIconPreview(null); }} className="text-xs text-gray-500"><FaTimes className="mr-1"/>İptal</Button>}
          </div>
          <div className="flex-shrink-0 w-full md:w-auto">
            <Button onClick={handleAddSkill} disabled={isUploading || !newSkillName} className="w-full flex items-center justify-center gap-2 px-6 py-2.5">
              <FaPlus /> {isUploading ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mevcut Yetenekler Listesi */}
      <div className="space-y-3">
        {skills.length > 0 ? skills.map(skill => (
          <div key={skill.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg">
              {renderIcon(skill)}
            </div>
            <span className="flex-grow font-semibold text-gray-800 dark:text-gray-200">{skill.name}</span>
            <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveSkill(skill.id)} aria-label="Yetkinliği sil">
              <FaTrash />
            </Button>
          </div>
        )) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-6">Henüz bir yetkinlik eklenmemiş.</p>
        )}
      </div>
    </div>
  );
}
