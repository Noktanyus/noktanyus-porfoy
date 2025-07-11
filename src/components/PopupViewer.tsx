/**
 * @file Popup (açılır pencere) gösterme ve yönetme ile ilgili bileşenler.
 * @description Bu dosya, URL'deki sorgu parametresine göre popup verisini çeken,
 *              içeriğini (HTML, scriptler dahil) güvenli bir şekilde işleyen ve
 *              kullanıcıya gösteren bir dizi bileşen içerir.
 */

"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Popup } from '@/types/content';
import Image from "next/image";

/**
 * Dinamik olarak gelen HTML içeriğini ve içindeki script'leri güvenli bir şekilde çalıştıran bileşen.
 * @param {{ htmlContent: string }} props - İşlenecek HTML içeriği.
 */
const DynamicHTMLRenderer = ({ htmlContent }: { htmlContent: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // HTML'i geçici bir elemente yükleyerek script'leri ayıkla
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const scripts = Array.from(tempDiv.querySelectorAll('script'));
    
    // Script'leri çıkardıktan sonra kalan HTML'i ana konteynere bas
    scripts.forEach(s => s.remove());
    container.innerHTML = tempDiv.innerHTML;

    // Ayıklanan script'leri yeniden oluşturup DOM'a ekleyerek çalıştır
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      // Orijinal script'in tüm attribute'larını kopyala (src, async, defer vb.)
      for (const attr of script.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }
      // Inline script içeriğini kopyala
      if (script.textContent) {
        try {
          newScript.appendChild(document.createTextNode(script.textContent));
        } catch (error) {
          console.error("DynamicHTMLRenderer -> Hata: Script içeriği oluşturulurken bir sorun oluştu.", error);
        }
      }
      container.appendChild(newScript);
    });
  }, [htmlContent]);

  return <div ref={containerRef} className="prose dark:prose-invert max-w-none mb-6" />;
};

/**
 * Popup'ın görsel arayüzünü oluşturan bileşen.
 * @param {{ popup: Popup; onClose: () => void }} props - Popup verisi ve kapatma fonksiyonu.
 */
export const PopupDisplay = ({ popup, onClose }: { popup: Popup; onClose: () => void }) => {
  const [revealedText, setRevealedText] = useState<string | null>(null);

  const handleButtonClick = (actionType: string, actionValue: string) => {
    switch (actionType) {
      case 'redirect':
        window.open(actionValue, '_blank', 'noopener,noreferrer');
        break;
      case 'show-text':
        setRevealedText(actionValue);
        break;
      case 'run-code':
        try {
          // Güvenlik notu: Bu fonksiyon, keyfi kod çalıştırabilir.
          // Sadece güvenilir kaynaklardan gelen kodlar için kullanılmalıdır.
          new Function(actionValue)();
        } catch (error) {
          console.error("PopupDisplay -> Hata: Popup üzerinden kod çalıştırılırken bir hata oluştu.", error);
          alert("Üzgünüz, bu işlem sırasında bir hata oluştu. Lütfen konsolu kontrol edin.");
        }
        break;
      default:
        console.warn(`PopupDisplay -> Uyarı: Tanımsız bir eylem türü denendi: ${actionType}`);
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold z-10"
          aria-label="Popup'ı Kapat"
        >
          &times;
        </button>
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">{popup.title}</h2>
          
          {popup.youtubeEmbedUrl && (
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <iframe
                src={popup.youtubeEmbedUrl}
                title="YouTube Video Oynatıcı"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-md"
              ></iframe>
            </div>
          )}
          {popup.imageUrl && !popup.youtubeEmbedUrl && (
            <Image src={popup.imageUrl} alt={popup.title} className="w-full h-auto object-cover rounded-md mb-4" width={800} height={450} />
          )}

          <DynamicHTMLRenderer htmlContent={popup.content} />

          {revealedText && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md my-4">
              <p className="font-mono text-brand-primary whitespace-pre-wrap">{revealedText}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            {popup.buttons && (popup.buttons as any[]).map((button, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(button.actionType, button.actionValue)}
                className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {button.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Popup verisini URL'den getirme ve gösterme mantığını yöneten ana bileşen.
 * URL'deki 'rp' (rich-popup) parametresini dinler.
 */
export default function PopupViewer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const popupSlug = searchParams.get('rp');
  
  const [popup, setPopup] = useState<Popup | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (popupSlug) {
      setIsLoading(true);
      fetch(`/api/popups/${popupSlug}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`API'den ${res.status} koduyla hata alındı.`);
          }
          return res.json();
        })
        .then((data: Popup) => {
          // Sadece aktif olan popup'ları göster
          if (data.isActive) {
            setPopup(data);
          } else {
            setPopup(null);
          }
        })
        .catch(err => {
          console.error(`PopupViewer -> Hata: '${popupSlug}' popup verisi getirilemedi.`, err);
          setPopup(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setPopup(null);
    }
  }, [popupSlug]);

  /**
   * Popup'ı kapatır ve URL'den 'rp' parametresini temizler.
   */
  const handleClose = () => {
    setPopup(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('rp');
    // Tarayıcı geçmişine yeni bir kayıt eklemeden URL'i güncelle
    router.replace(newUrl.href, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-8 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="aspect-w-16 aspect-h-9 mb-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!popup) {
    return null;
  }

  return <PopupDisplay popup={popup} onClose={handleClose} />;
}
