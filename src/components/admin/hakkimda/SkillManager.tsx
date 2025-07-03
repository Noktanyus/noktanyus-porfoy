// src/components/admin/hakkimda/SkillManager.tsx
"use client";

import { Skill } from "@/types/content";

interface SkillManagerProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

export default function SkillManager({ skills, onChange }: SkillManagerProps) {
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newSkillName = (e.target as HTMLInputElement).value.trim();
      if (newSkillName && !skills.find(s => s.name === newSkillName)) {
        onChange([...skills, { name: newSkillName }]);
        (e.target as HTMLInputElement).value = '';
      }
    }
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Yetenekler</h2>
      <div className="flex items-center gap-4 mb-4">
        <input type="text" placeholder="Yeni yetenek ekle ve Enter'a bas" onKeyDown={handleSkillKeyDown} className="w-full p-2 border rounded" />
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            <span>{skill.name}</span>
            <button onClick={() => removeSkill(index)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}
