// src/components/admin/hakkimda/ExperienceManager.tsx
"use client";

import { Experience } from "@/types/content";

interface ExperienceManagerProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export default function ExperienceManager({ experiences, onChange }: ExperienceManagerProps) {
  const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: `new-${Date.now()}`, // Geçici, benzersiz bir ID
      title: '',
      company: '',
      date: '',
      description: '',
      aboutId: null, // Henüz bir 'About' ile ilişkili değil
    };
    onChange([...experiences, newExperience]);
  };

  const removeExperience = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-card">
      <h2 className="text-2xl font-semibold mb-6">İş Tecrübeleri</h2>
      <div className="space-y-6">
        {experiences.map((exp, index) => (
          <div key={index} className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">Tecrübe {index + 1}</h3>
              <button 
                type="button" 
                onClick={() => removeExperience(index)} 
                className="touch-target text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Bu Tecrübeyi Sil
              </button>
            </div>
            <div className="admin-form-grid">
              <div>
                <label className="block text-sm font-medium mb-2">Unvan</label>
                <input 
                  type="text" 
                  placeholder="Yazılım Geliştirici" 
                  value={exp.title} 
                  onChange={(e) => handleExperienceChange(index, 'title', e.target.value)} 
                  className="admin-input" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Şirket</label>
                <input 
                  type="text" 
                  placeholder="ABC Teknoloji" 
                  value={exp.company} 
                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} 
                  className="admin-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tarih</label>
              <input 
                type="text" 
                placeholder="2022 - Günümüz" 
                value={exp.date} 
                onChange={(e) => handleExperienceChange(index, 'date', e.target.value)} 
                className="admin-input" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <textarea 
                placeholder="İş tanımı ve sorumluluklar..." 
                value={exp.description} 
                onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} 
                className="admin-input resize-y min-h-[80px]" 
                rows={3} 
              />
            </div>
          </div>
        ))}
      </div>
      <button 
        type="button" 
        onClick={addExperience} 
        className="mt-6 admin-button-primary w-full sm:w-auto"
      >
        Yeni Tecrübe Ekle
      </button>
    </div>
  );
}
