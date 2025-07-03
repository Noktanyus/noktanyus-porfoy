// src/components/admin/hakkimda/AboutForm.tsx
"use client";

import { AboutData } from "@/types/content";
import { ChangeEvent } from "react";

interface AboutFormProps {
  aboutData: Partial<AboutData>;
  onAboutChange: (field: keyof AboutData, value: any) => void;
  onSocialChange: (field: 'github' | 'linkedin' | 'twitter', value: string) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>, field: keyof AboutData) => void;
}

export default function AboutForm({ aboutData, onAboutChange, onSocialChange, onFileChange }: AboutFormProps) {
  return (
    <div className="space-y-8">
      {/* Genel Bilgiler */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Genel Bilgiler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" placeholder="Header Başlığı" value={aboutData.headerTitle || ''} onChange={(e) => onAboutChange('headerTitle', e.target.value)} className="w-full p-2 border rounded" />
          <input type="text" placeholder="İsim Soyisim" value={aboutData.name || ''} onChange={(e) => onAboutChange('name', e.target.value)} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Unvan" value={aboutData.title || ''} onChange={(e) => onAboutChange('title', e.target.value)} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Alt Başlık" value={aboutData.subTitle || ''} onChange={(e) => onAboutChange('subTitle', e.target.value)} className="w-full p-2 border rounded" />
        </div>
      </div>
      {/* Sosyal Medya */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Sosyal Medya</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input type="text" placeholder="GitHub URL" value={aboutData.social?.github || ''} onChange={(e) => onSocialChange('github', e.target.value)} className="w-full p-2 border rounded" />
          <input type="text" placeholder="LinkedIn URL" value={aboutData.social?.linkedin || ''} onChange={(e) => onSocialChange('linkedin', e.target.value)} className="w-full p-2 border rounded" />
          <input type="text" placeholder="Twitter URL" value={aboutData.social?.twitter || ''} onChange={(e) => onSocialChange('twitter', e.target.value)} className="w-full p-2 border rounded" />
        </div>
      </div>
      {/* Görseller */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Görseller</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium mb-2">Profil Fotoğrafı</label>
            <input type="file" accept="image/*" onChange={(e) => onFileChange(e, 'profileImage')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            {aboutData.profileImage && <img src={aboutData.profileImage} alt="Profil Önizleme" className="mt-4 rounded-lg w-32 h-32 object-cover"/>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Hakkımda Sayfası Görseli</label>
            <input type="file" accept="image/*" onChange={(e) => onFileChange(e, 'aboutImage')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
            {aboutData.aboutImage && <img src={aboutData.aboutImage} alt="Hakkımda Görsel Önizleme" className="mt-4 rounded-lg w-full h-auto object-cover"/>}
          </div>
        </div>
      </div>
    </div>
  );
}
