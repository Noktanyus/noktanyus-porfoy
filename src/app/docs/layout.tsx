import React from 'react';
import { DocsNav } from '@/components/docs/DocsNav';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pt-16 sm:pt-20">
      <DocsNav />
      {children}
    </div>
  );
}
