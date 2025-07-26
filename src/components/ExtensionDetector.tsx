'use client';

import { useEffect, useState } from 'react';

export default function ExtensionDetector() {
  const [hasProblematicExtensions, setHasProblematicExtensions] = useState(false);

  useEffect(() => {
    // Check for common problematic extensions
    const checkExtensions = () => {
      // Check for common extension indicators
      const indicators = [
        'myContent.js',
        'pagehelper.js',
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://'
      ];

      // Check scripts in the page
      const scripts = Array.from(document.scripts);
      const hasProblematic = scripts.some(script => 
        indicators.some(indicator => script.src.includes(indicator))
      );

      // Check for global variables that extensions might create
      const extensionGlobals = [
        '__EXTENSION_INSTALLED__',
        'myContent',
        'pagehelper'
      ];

      const hasGlobals = extensionGlobals.some(global => {
        const value = window[global as keyof Window];
        return typeof value !== 'undefined' && value !== null && value !== {};
      });

      if (hasProblematic || hasGlobals) {
        setHasProblematicExtensions(true);
      }
    };

    // Check immediately and after a delay
    checkExtensions();
    const timer = setTimeout(checkExtensions, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!hasProblematicExtensions) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">Browser Extension Uyarısı</h3>
          <p className="mt-1 text-xs">
            Bazı browser extension'ları sayfa performansını etkileyebilir. 
            Sorun yaşıyorsanız extension'ları geçici olarak devre dışı bırakın.
          </p>
          <button 
            onClick={() => setHasProblematicExtensions(false)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}