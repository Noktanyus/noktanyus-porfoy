'use client';

import { useEffect } from 'react';
import { pushRecentTool } from '@/lib/recentTools';

/** Araç detay sayfalarında mount olunca son kullanılanlara yazar. */
export function TrackRecentTool({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    pushRecentTool({ slug, title });
  }, [slug, title]);

  return null;
}

export default TrackRecentTool;
