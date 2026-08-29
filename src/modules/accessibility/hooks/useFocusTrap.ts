"use client";

/**
 * @file useFocusTrap Hook
 * @description Modal/dialog içinde focus'u hapseder. Tab ve Shift+Tab
 *              döngüsünü container içinde tutar. ESC tuşu ile
 *              onEscape callback'ini tetikler.
 *
 *              WCAG 2.4.3 (Focus Order) ve 2.1.2 (No Keyboard Trap) uyumlu.
 *              2.1.2 "No Keyboard Trap" kuralı için ESC desteği zorunlu.
 */

import { useEffect, useRef } from "react";

export interface UseFocusTrapOptions {
  enabled?: boolean;
  onEscape?: () => void;
  /** İlk focus öğesini döndüren selector. Bulunamazsa container kullanılır. */
  initialFocusSelector?: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "audio[controls]",
  "video[controls]",
  "iframe",
  "object",
  "embed",
  "[contenteditable]:not([contenteditable='false'])",
].join(",");

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, onEscape, initialFocusSelector } = options;
  const containerRef = useRef<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    // Trap aktifken önceki focus'u sakla
    previousFocusRef.current = document.activeElement as HTMLElement;

    const getFocusable = (): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.visibility !== "hidden" && style.display !== "none";
      });
    };

    // İlk focus
    const initial =
      initialFocusSelector
        ? container.querySelector<HTMLElement>(initialFocusSelector)
        : getFocusable()[0];
    initial?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement;

      // Container dışındaysa → first'e al
      if (!container.contains(current)) {
        e.preventDefault();
        first.focus();
        return;
      }

      // Shift+Tab ilkten önce → son'a al
      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
        return;
      }

      // Tab son'dan sonra → ilk'e al
      if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Trap kapandığında önceki focus'a dön
      previousFocusRef.current?.focus?.();
    };
  }, [enabled, onEscape, initialFocusSelector]);

  return containerRef;
}