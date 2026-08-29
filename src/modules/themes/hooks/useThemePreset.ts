"use client";

/**
 * @file useThemePreset Hook
 * @description Aktif tema preset state'ini yönetir. localStorage + DB senkronizasyonu.
 */

import { useEffect, useState, useCallback } from "react";
import type { ThemePresetId } from "../presets";
import { isThemePresetId, getPresetById } from "../presets";
import {
  applyPresetById,
  persistPresetToStorage,
  restorePresetFromStorage,
  readPresetFromDocument,
} from "../applier";

interface UseThemePresetReturn {
  presetId: ThemePresetId;
  setPreset: (id: ThemePresetId) => void;
  cycleNext: () => void;
  cyclePrev: () => void;
  reset: () => void;
}

const STORAGE_KEY = "theme-preset";

export function useThemePreset(initialPreset?: ThemePresetId): UseThemePresetReturn {
  const [presetId, setPresetId] = useState<ThemePresetId>(initialPreset ?? "default");

  // Mount: localStorage'dan geri yükle
  useEffect(() => {
    const restored = restorePresetFromStorage(STORAGE_KEY);
    if (restored) {
      setPresetId(restored);
    } else if (typeof document !== "undefined") {
      const fromDom = readPresetFromDocument();
      setPresetId(fromDom);
    }
  }, []);

  const setPreset = useCallback((id: ThemePresetId) => {
    setPresetId(id);
    applyPresetById(id);
    persistPresetToStorage(id, STORAGE_KEY);
  }, []);

  const cycleNext = useCallback(() => {
    // Import lazily to avoid circular
    import("../presets").then(({ PRESETS }) => {
      const idx = PRESETS.findIndex((p) => p.id === presetId);
      const next = PRESETS[(idx + 1) % PRESETS.length];
      setPreset(next.id);
    });
  }, [presetId, setPreset]);

  const cyclePrev = useCallback(() => {
    import("../presets").then(({ PRESETS }) => {
      const idx = PRESETS.findIndex((p) => p.id === presetId);
      const prev = PRESETS[(idx - 1 + PRESETS.length) % PRESETS.length];
      setPreset(prev.id);
    });
  }, [presetId, setPreset]);

  const reset = useCallback(() => {
    setPreset("default");
  }, [setPreset]);

  return { presetId, setPreset, cycleNext, cyclePrev, reset };
}

export { getPresetById, isThemePresetId };