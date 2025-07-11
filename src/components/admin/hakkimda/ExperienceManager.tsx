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
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">İş Tecrübeleri</h2>
      <div className="space-y-4">
        {experiences.map((exp, index) => (
          <div key={index} className="p-4 border rounded-md space-y-2">
            <input type="text" placeholder="Unvan" value={exp.title} onChange={(e) => handleExperienceChange(index, 'title', e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Şirket" value={exp.company} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Tarih (Örn: 2022 - Günümüz)" value={exp.date} onChange={(e) => handleExperienceChange(index, 'date', e.target.value)} className="w-full p-2 border rounded" />
            <textarea placeholder="Açıklama" value={exp.description} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} className="w-full p-2 border rounded" rows={3} />
            <button type="button" onClick={() => removeExperience(index)} className="text-red-500 hover:text-red-700">Bu Tecrübeyi Sil</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addExperience} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Yeni Tecrübe Ekle</button>
    </div>
  );
}
