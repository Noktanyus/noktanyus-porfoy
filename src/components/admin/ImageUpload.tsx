"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaUpload, FaTrash } from 'react-icons/fa';
import Image from 'next/image';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  uploadPath: string;
}

export default function ImageUpload({ value, onChange, onRemove, uploadPath }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const loadingToast = toast.loading("Görsel yükleniyor...");

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Yükleme başarısız oldu.');
      }

      onChange(data.url);
      toast.success('Görsel yüklendi!', { id: loadingToast });
    } catch (error) {
      console.error("Görsel yükleme hatası:", error);
      toast.error(`Hata: ${(error as Error).message}`, { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    toast.success("Görsel kaldırıldı.");
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Görsel</label>
      <div className="mt-2 flex items-center justify-center w-full">
        {value ? (
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image src={value} alt="Yüklenen Görsel" layout="fill" objectFit="cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
              aria-label="Görseli kaldır"
            >
              <FaTrash />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FaUpload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Yüklemek için tıklayın</span> veya sürükleyip bırakın</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP (MAX. 800x400px)</p>
            </div>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/png, image/jpeg, image/webp" />
          </label>
        )}
      </div>
    </div>
  );
}
