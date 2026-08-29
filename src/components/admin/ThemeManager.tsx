"use client";

/**
 * @file ThemeManager (Admin)
 * @description Sistem varsayılan tema seçici + aktif preset preview grid'i.
 *              Canlı önizleme ile seçilen temanın nasıl görüneceğini gösterir.
 */

import { useEffect, useState } from "react";
import { PRESETS, type ThemePreset, type ThemePresetId } from "@/modules/themes/presets";
import { applyPresetById, persistPresetToStorage } from "@/modules/themes/applier";

interface PresetCardProps {
  preset: ThemePreset;
  active: boolean;
  onSelect: (id: ThemePresetId) => void;
}

function PresetCard({ preset, active, onSelect }: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      aria-pressed={active}
      className={`
        group relative overflow-hidden rounded-2xl border-2 p-5 text-left
        transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50
        ${
          active
            ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
            : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
        }
      `}
      style={{
        background: `linear-gradient(135deg, oklch(${preset.tokens.light.background}), oklch(${preset.tokens.light.card}))`,
      }}
    >
      {/* Light preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl">
              {preset.badge}
            </span>
            <div>
              <div
                className="font-bold text-sm"
                style={{ color: `oklch(${preset.tokens.light.foreground})` }}
              >
                {preset.label}
              </div>
              <div
                className="text-xs opacity-70"
                style={{ color: `oklch(${preset.tokens.light.mutedForeground ?? preset.tokens.light["muted-foreground"]})` }}
              >
                Light
              </div>
            </div>
          </div>
          {active && (
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{
                background: `oklch(${preset.tokens.light.primary})`,
                color: `oklch(${preset.tokens.light["primary-foreground"]})`,
              }}
            >
              AKTİF
            </span>
          )}
        </div>

        {/* Color swatches */}
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
          {Object.entries({
            primary: preset.tokens.light.primary,
            secondary: preset.tokens.light.secondary,
            accent: preset.tokens.light.accent,
            muted: preset.tokens.light.muted,
            destructive: preset.tokens.light.destructive,
            success: preset.tokens.light.success,
            warning: preset.tokens.light.warning,
            info: preset.tokens.light.info,
          }).map(([key, val]) => (
            <div
              key={key}
              className="flex-1"
              style={{ background: `oklch(${val})` }}
              title={key}
            />
          ))}
        </div>

        {/* Sample button */}
        <div className="flex gap-2">
          <button
            type="button"
            tabIndex={-1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: `oklch(${preset.tokens.light.primary})`,
              color: `oklch(${preset.tokens.light["primary-foreground"]})`,
            }}
          >
            Primary
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
            style={{
              background: "transparent",
              color: `oklch(${preset.tokens.light.foreground})`,
              borderColor: `oklch(${preset.tokens.light.border})`,
            }}
          >
            Outline
          </button>
        </div>
      </div>

      {/* Dark preview overlay */}
      <div
        className="mt-3 pt-3 border-t"
        style={{
          borderColor: `oklch(${preset.tokens.light.border})`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs opacity-70"
            style={{ color: `oklch(${preset.tokens.light["muted-foreground"]})` }}
          >
            Dark:
          </span>
          <div className="flex gap-1 flex-1">
            {[
              preset.tokens.dark.primary,
              preset.tokens.dark.secondary,
              preset.tokens.dark.accent,
            ].map((val, i) => (
              <div
                key={i}
                className="h-3 flex-1 rounded"
                style={{ background: `oklch(${val})` }}
              />
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export function ThemeManager() {
  const [activePreset, setActivePreset] = useState<ThemePresetId>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      const stored = document.documentElement.dataset.themePreset;
      if (stored) setActivePreset(stored as ThemePresetId);
    }
  }, []);

  const handleSelect = (id: ThemePresetId) => {
    setActivePreset(id);
    applyPresetById(id);
    persistPresetToStorage(id);
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Aktif Preset</div>
          <div className="text-lg font-bold">
            {PRESETS.find((p) => p.id === activePreset)?.badge}{" "}
            {PRESETS.find((p) => p.id === activePreset)?.label}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Toplam Preset</div>
          <div className="text-lg font-bold">{PRESETS.length}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Token Sistemi</div>
          <div className="text-lg font-bold">OKLCH</div>
        </div>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            active={mounted && preset.id === activePreset}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Info section */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="font-semibold">Tema Sistemi Hakkında</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tüm temalar <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-xs">OKLCH</code> renk
          uzayını kullanır. Her preset hem light hem dark varyant içerir ve
          <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-xs mx-1">data-theme-preset</code>
          attribute&apos;u üzerinden runtime&apos;da değiştirilebilir.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Yeni preset eklemek için <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-xs">src/modules/themes/presets.ts</code> dosyasına
          yeni bir <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-xs">ThemePreset</code> objesi ekleyin.
        </p>
      </div>
    </div>
  );
}