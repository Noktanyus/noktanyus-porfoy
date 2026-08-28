/**
 * @file Tooltip — hover/click ile bilgi balonu.
 * @description
 *   Basit, accessibility-friendly tooltip.
 *   - `trigger="hover"`: fare ile üzerine gelince açılır
 *   - `trigger="click"`: tıklayınca açılır, dış tıklama ile kapanır
 *   - ARIA: role="tooltip", aria-describedby, klavye erişimi
 */

'use client';

import { useState, useRef, useEffect, useId, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  /** Tooltip içeriği. */
  content: React.ReactNode;
  /** Sarmalanan çocuk (trigger element). */
  children: React.ReactElement;
  /** Tetikleme tipi. */
  trigger?: 'hover' | 'click';
  /** Pozisyon. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Ek CSS sınıfları. */
  className?: string;
}

const SIDE_STYLES: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({
  content,
  children,
  trigger = 'hover',
  side = 'top',
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const id = useId();

  useEffect(() => {
    if (trigger !== 'click') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [visible, trigger]);

  // Trigger elementine event handler'ları ve a11y attribute'ları klonla
  const childProps: Record<string, unknown> = {
    'aria-describedby': visible ? id : undefined,
  };
  if (trigger === 'hover') {
    childProps.onMouseEnter = () => setVisible(true);
    childProps.onMouseLeave = () => setVisible(false);
    childProps.onFocus = () => setVisible(true);
    childProps.onBlur = () => setVisible(false);
  } else {
    childProps.onClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setVisible((v) => !v);
      // Çocuk component'e orijinal onClick'i de çalıştır
      const original = (children.props as { onClick?: unknown }).onClick;
      if (typeof original === 'function') {
        (original as (ev: React.MouseEvent) => void)(e);
      }
    };
  }

  const clonedTrigger = isValidElement(children)
    ? cloneElement(children as React.ReactElement, childProps)
    : children;

  return (
    <div
      ref={wrapperRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={trigger === 'hover' ? () => setVisible(true) : undefined}
      onMouseLeave={trigger === 'hover' ? () => setVisible(false) : undefined}
    >
      {clonedTrigger}
      {visible && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg whitespace-nowrap pointer-events-none fade-in',
            SIDE_STYLES[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
