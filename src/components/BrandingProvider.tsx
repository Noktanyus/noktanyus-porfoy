'use client';

/**
 * @file BrandingProvider — workspace brand-primary CSS değişkenini uygular.
 * @description
 *   Branding bilgisi prop olarak alınır, generateBrandCSS ile üretilen CSS
 *   document root'a <style> etiketi olarak enjekte edilir.
 */

import { useEffect, useMemo } from 'react';
import { brandingService } from '@/modules/workspaces/brandingService';
import type { WorkspaceBranding } from '@/modules/workspaces/brandingService';

interface BrandingProviderProps {
  branding?: WorkspaceBranding | null;
  children: React.ReactNode;
}

export function BrandingProvider({ branding, children }: BrandingProviderProps) {
  const css = useMemo(() => {
    if (!branding) return null;
    return brandingService.generateBrandCSS(branding);
  }, [branding]);

  useEffect(() => {
    if (!css) return;
    const styleEl = document.createElement('style');
    styleEl.dataset.brandingRoot = 'true';
    styleEl.textContent = css;
    document.documentElement.appendChild(styleEl);
    return () => {
      document.documentElement.removeChild(styleEl);
    };
  }, [css]);

  return <>{children}</>;
}

export default BrandingProvider;
