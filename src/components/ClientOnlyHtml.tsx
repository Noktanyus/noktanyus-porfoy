"use client";

import { useState, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface ClientOnlyHtmlProps {
  html: string;
  className?: string;
}

/**
 * Sunucu-istemci uyuşmazlığını önlerken, dışarıdan gelen HTML'i
 * XSS saldırılarına karşı güvenli hale getirerek render eden bir bileşen.
 * @param {ClientOnlyHtmlProps} props - `html` içeriğini ve opsiyonel `className`'i alır.
 */
export default function ClientOnlyHtml({ html, className }: ClientOnlyHtmlProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // HTML'i DOM'a yazdırmadan önce DOMPurify ile temizle.
  // Bu, <script> etiketleri gibi zararlı içerikleri kaldırarak XSS'i önler.
  const cleanHtml = DOMPurify.sanitize(html);

  // Sadece istemci tarafında ve temizlenmiş HTML'i render et.
  return isClient ? <div className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} /> : null;
}
