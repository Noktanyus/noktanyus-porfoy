/**
 * @file Drag & drop + URL fallback destekli görsel yükleme bileşeni.
 * @description Bu bileşen, kullanıcının bir görseli dosya olarak sürükleyip
 *              bırakmasına ya da URL yapıştırmasına olanak tanır. Yüklenen
 *              dosya `/api/upload` rotasına POST edilir, dönen URL parent'a
 *              `onChange` üzerinden aktarılır.
 *
 *              - Drag & drop zone (preview gösterimi ile)
 *              - Dosya seçici (hidden input + custom button)
 *              - URL fallback (harici görsel kullanımı için)
 *              - 5MB boyut + MIME tipi client-side validasyonu
 *              - Yükleme sırasında disabled state + toast feedback
 */

'use client';

import { useState, useRef } from 'react';
import { FaUpload, FaTimes, FaImage } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export type ImageUploadType = 'avatar' | 'product' | 'blog' | 'general';

interface ImageUploadProps {
  /** Mevcut görsel URL'i (controlled component için) */
  value?: string;
  /** URL değiştiğinde çağrılır (boş string ile silme) */
  onChange: (url: string) => void;
  /** Yükleme kategorisi (dosya adı + storage path için) */
  type?: ImageUploadType;
  /** MB cinsinden max boyut (default 5) */
  maxSize?: number;
  /** Boş durumdaki drop zone aspect ratio (örn. '16/9') */
  aspectRatio?: string;
  /** Drop zone placeholder metni */
  placeholder?: string;
  /** Ek CSS class'ları */
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  type = 'general',
  maxSize = 5,
  aspectRatio = '16/9',
  placeholder = 'Görseli buraya sürükle veya tıkla',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Dosyayı `/api/upload` endpoint'ine yükler, sonucu parent'a bildirir.
   * Hata durumunda toast ile kullanıcı bilgilendirilir.
   */
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece görsel dosyaları yükleyin');
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Dosya ${maxSize}MB'dan büyük olamaz`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/upload?type=${type}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? 'Yükleme başarısız');
      }

      onChange(data.data.url);
      setPreviewUrl(data.data.url);
      toast.success('Görsel yüklendi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Drop Zone / Preview */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border'
        } ${previewUrl ? 'p-2' : 'p-8'}`}
        style={{ aspectRatio: previewUrl ? undefined : aspectRatio }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="preview"
              className="w-full h-auto rounded-lg max-h-96 object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              aria-label="Görseli kaldır"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FaImage className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">{placeholder}</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP, GIF (max {maxSize}MB)
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="admin-btn admin-btn-primary flex-1 disabled:opacity-50"
        >
          <FaUpload /> {uploading ? 'Yükleniyor...' : 'Dosya Seç'}
        </button>
      </div>

      {/* URL Fallback */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          veya URL yapıştır:
        </label>
        <input
          type="url"
          value={previewUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://..."
          className="admin-input text-sm"
          disabled={uploading}
        />
      </div>
    </div>
  );
}
