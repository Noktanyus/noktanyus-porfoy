"use client";

/**
 * @file ThemeCustomizer
 * @description Kullanıcının mevcut tema preset'ini seçmesini sağlayan UI paneli.
 *              Dropdown grid şeklinde preset kartları — her kart için
 *              canlı renk önizlemesi (light + dark swatch).
 */

import { useState } from "react";
import { PRESETS } from "../presets";
import { useThemePreset } from "../hooks/useThemePreset";
import { logger } from "@/lib/logger";

interface ThemeCustomizerProps {
  initialPreset?: Parameters<typeof useThemePreset>[0];
  className?: string;
  compact?: boolean;
}

export default function ThemeCustomizer({
  initialPreset,
  className = "",
  compact = false,
}: ThemeCustomizerProps) {
  const { presetId, setPreset } = useThemePreset(initialPreset);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: (typeof PRESETS)[number]["id"]) => {
    setPreset(id);
    setIsOpen(false);
    logger.debug(`[ThemeCustomizer] preset switched: ${id}`);
  };

  const activePreset = PRESETS.find((p) => p.id === presetId);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Tema seçici aç"
        className="glass-pill flex items-center gap-2 hover:bg-white/70 dark:hover:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <span aria-hidden="true" className="text-base">
          {activePreset?.badge ?? "🎨"}
        </span>
        {!compact && (
          <span className="text-sm font-medium">{activePreset?.label ?? "Tema"}</span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Tema seçici"
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] glass-card-premium p-4 z-50"
          >
            <h3 className="text-sm font-semibold mb-3 text-foreground">
              Tema Seç
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((preset) => {
                const isActive = preset.id === presetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelect(preset.id)}
                    aria-pressed={isActive}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl text-left transition-all
                      focus:outline-none focus:ring-2 focus:ring-primary/50
                      ${
                        isActive
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20"
                      }
                    `}
                  >
                    <span aria-hidden="true" className="text-2xl flex-shrink-0">
                      {preset.badge}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {preset.label}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {preset.description}
                      </div>
                    </div>
                    {/* Color swatch preview */}
                    <div
                      className="flex flex-shrink-0 gap-0.5"
                      aria-hidden="true"
                    >
                      <div
                        className="w-3 h-6 rounded-l-md border border-white/20"
                        style={{
                          background: `oklch(${preset.tokens.light.primary})`,
                        }}
                      />
                      <div
                        className="w-3 h-6 border border-white/20"
                        style={{
                          background: `oklch(${preset.tokens.light.accent})`,
                        }}
                      />
                      <div
                        className="w-3 h-6 rounded-r-md border border-white/20"
                        style={{
                          background: `oklch(${preset.tokens.light.background})`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}