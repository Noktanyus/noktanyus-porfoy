// src/components/admin/hakkimda/AboutForm.tsx
"use client";

import { About } from "@prisma/client";
import { ChangeEvent } from "react";
import Image from "next/image";

interface AboutFormProps {
  aboutData: Partial<About>;
  onAboutChange: (field: keyof About, value: any) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>, field: keyof About) => void;
}

export default function AboutForm({ aboutData, onAboutChange, onFileChange }: AboutFormProps) {
  return (
    <div className="admin-content-spacing">
      {/* Genel Bilgiler */}
      <div className="admin-card">
        <h2 className="text-2xl font-semibold mb-6">Genel Bilgiler</h2>
        <div className="admin-form-grid">
          <div>
            <label className="block text-sm font-medium mb-2">Header Başlığı</label>
            <input type="text" placeholder="Header Başlığı" value={aboutData.headerTitle || ''} onChange={(e) => onAboutChange('headerTitle', e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">İsim Soyisim</label>
            <input type="text" placeholder="İsim Soyisim" value={aboutData.name || ''} onChange={(e) => onAboutChange('name', e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unvan</label>
            <input type="text" placeholder="Unvan" value={aboutData.title || ''} onChange={(e) => onAboutChange('title', e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Alt Başlık</label>
            <input type="text" placeholder="Alt Başlık" value={aboutData.subTitle || ''} onChange={(e) => onAboutChange('subTitle', e.target.value)} className="admin-input" />
          </div>
        </div>
      </div>
      {/* Sosyal Medya ve İletişim */}
      <div className="admin-card">
        <h2 className="text-2xl font-semibold mb-6">Sosyal Medya ve İletişim</h2>
        <div className="admin-form-grid">
          <div>
            <label className="block text-sm font-medium mb-2">İletişim E-posta Adresi</label>
            <input type="email" placeholder="ornek@email.com" value={aboutData.contactEmail || ''} onChange={(e) => onAboutChange('contactEmail', e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">GitHub URL</label>
            <input type="text" placeholder="https://github.com/kullanici" value={aboutData.socialGithub || ''} onChange={(e) => onAboutChange('socialGithub', e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
            <input type="text" placeholder="https://linkedin.com/in/kullanici" value={aboutData.socialLinkedin || ''} onChange={(e) => onAboutChange('socialLinkedin', e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instagram URL</label>
            <input type="text" placeholder="https://instagram.com/kullanici" value={aboutData.socialInstagram || ''} onChange={(e) => onAboutChange('socialInstagram', e.target.value)} className="admin-input" />
          </div>
        </div>
      </div>
      {/* Görseller */}
      <div className="admin-card">
        <h2 className="text-2xl font-semibold mb-6">Görseller</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-medium">Profil Fotoğrafı</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => onFileChange(e, 'profileImage')} 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300 dark:hover:file:bg-blue-900/30 file:transition-colors file:cursor-pointer cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg p-2"
            />
            {aboutData.profileImage && (
              <div className="mt-4">
                <Image 
                  src={aboutData.profileImage} 
                  alt="Profil Önizleme" 
                  className="rounded-lg w-32 h-32 object-cover border border-gray-200 dark:border-gray-600" 
                  width={128} 
                  height={128}
                />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium">Hakkımda Görseli</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => onFileChange(e, 'aboutImage')} 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300 dark:hover:file:bg-blue-900/30 file:transition-colors file:cursor-pointer cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg p-2"
            />
            {aboutData.aboutImage && (
              <div className="mt-4">
                <Image 
                  src={aboutData.aboutImage} 
                  alt="Hakkımda Görsel Önizleme" 
                  className="rounded-lg w-full h-auto object-cover max-h-48 border border-gray-200 dark:border-gray-600" 
                  width={500} 
                  height={300}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}