"use client";

import { useState, useEffect } from 'react';

interface ClientOnlyHtmlProps {
  html: string;
  className?: string;
}

/**
 * Sunucu-istemci uyuşmazlığını (hydration error) önlemek için,
 * kendisine verilen HTML'i sadece istemci tarafında render eden bir bileşen.
 * Sunucuda ve ilk istemci render'ında `null` döner, mount edildikten sonra içeriği basar.
 * @param {ClientOnlyHtmlProps} props - `html` içeriğini ve opsiyonel `className`'i alır.
 */
export default function ClientOnlyHtml({ html, className }: ClientOnlyHtmlProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Bileşen mount edildiğinde, istemci tarafında olduğumuzu anlarız.
    setIsClient(true);
  }, []);

  // Sadece istemci tarafında render et.
  return isClient ? <div className={className} dangerouslySetInnerHTML={{ __html: html }} /> : null;
}
