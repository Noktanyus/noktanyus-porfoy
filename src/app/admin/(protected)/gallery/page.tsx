
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaDownload, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface ImageFile {
  name: string;
  url: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/images');
      if (!response.ok) {
        throw new Error('Görselleri alırken bir hata oluştu.');
      }
      const data = await response.json();
      setImages(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDelete = async (imageName: string) => {
    if (!confirm(`'${imageName}' görselini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    const toastId = toast.loading('Görsel siliniyor...');
    try {
      const response = await fetch(`/api/admin/images?fileName=${encodeURIComponent(imageName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Görsel silinirken bir hata oluştu.');
      }

      toast.success('Görsel başarıyla silindi.', { id: toastId });
      fetchImages(); // Listeyi yenile
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Galeri</h1>
        <button onClick={fetchImages} disabled={isLoading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50" aria-label="Görselleri Yenile">
          Yenile
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="animate-pulse bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square"></div>
          ))}
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <div key={image.name} className="group relative border rounded-lg overflow-hidden shadow-lg">
              <Image
                src={image.url}
                alt={image.name}
                width={300}
                height={300}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <p className="text-white text-xs break-all">{image.name}</p>
                <div className="flex justify-end space-x-2">
                  <a href={image.url} download={image.name} className="text-white hover:text-gray-300 p-2 bg-gray-800 rounded-full">
                    <FaDownload />
                  </a>
                  <button onClick={() => handleDelete(image.name)} className="text-white hover:text-red-500 p-2 bg-gray-800 rounded-full">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Yüklü görsel bulunamadı.</p>
      )}
    </div>
  );
}
