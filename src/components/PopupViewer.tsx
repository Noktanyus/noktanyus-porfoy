"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Popup } from '@/types/content';

const DynamicHTMLRenderer = ({ htmlContent }: { htmlContent: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const scripts = Array.from(tempDiv.querySelectorAll('script'));
    
    scripts.forEach(s => s.remove());
    container.innerHTML = tempDiv.innerHTML;

    scripts.forEach(script => {
      const newScript = document.createElement('script');
      for (const attr of script.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }
      if (script.textContent) {
        newScript.appendChild(document.createTextNode(script.textContent));
      }
      container.appendChild(newScript);
    });
  }, [htmlContent]);

  return <div ref={containerRef} className="prose dark:prose-invert max-w-none mb-6" />;
};

// This is the actual UI component for the popup
const PopupDisplay = ({ popup, onClose }: { popup: Popup; onClose: () => void }) => {
  const [revealedText, setRevealedText] = useState<string | null>(null);

  const handleButtonClick = (actionType: string, actionValue: string) => {
    switch (actionType) {
      case 'redirect':
        window.open(actionValue, '_blank');
        break;
      case 'show-text':
        setRevealedText(actionValue);
        break;
      case 'run-code':
        try {
          // Using Function constructor for safer execution than eval
          new Function(actionValue)();
        } catch (error) {
          console.error("Error executing code from popup:", error);
          alert("Kod çalıştırılırken bir hata oluştu.");
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold"
          aria-label="Kapat"
        >
          &times;
        </button>
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">{popup.title}</h2>
          
          {popup.youtubeEmbedUrl && (
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <iframe
                src={popup.youtubeEmbedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          )}

          {popup.imageUrl && !popup.youtubeEmbedUrl && (
            <img src={popup.imageUrl} alt={popup.title} className="w-full h-auto object-cover rounded-md mb-4" />
          )}

          <DynamicHTMLRenderer htmlContent={popup.content} />

          {revealedText && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md my-4">
              <p className="font-mono text-brand-primary">{revealedText}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-end">
            {popup.buttons.map((button, index) => (
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


// This component handles the logic of fetching the popup data
export default function PopupViewer({ popup: initialPopup, onClose: initialOnClose }: { popup?: Popup, onClose?: () => void }) {
  const searchParams = useSearchParams();
  const popupSlug = searchParams.get('rp');
  const [popup, setPopup] = useState<Popup | null>(initialPopup || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (popupSlug && !initialPopup) {
      setIsLoading(true);
      // Fetch the specific popup data from an API route
      // This avoids bundling all popups on the client
      fetch(`/api/popups/${popupSlug}`)
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then(data => {
          setPopup(data);
        })
        .catch(err => console.error("Failed to fetch popup:", err))
        .finally(() => setIsLoading(false));
    } else if (initialPopup) {
      setPopup(initialPopup);
    } else {
      setPopup(null); // Clear popup if rp param is removed
    }
  }, [popupSlug, initialPopup]);

  const handleClose = () => {
    if (initialOnClose) {
      initialOnClose();
    } else {
      setPopup(null);
      // Optionally, remove the 'rp' query param from URL without reloading the page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('rp');
      window.history.pushState({ path: newUrl.toString() }, '', newUrl.toString());
    }
  };

  if (isLoading || !popup) {
    return null;
  }

  return <PopupDisplay popup={popup} onClose={handleClose} />;
}
