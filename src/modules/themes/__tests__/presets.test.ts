/**
 * @file Theme presets unit tests
 * @description PRESETS registry, getPresetById, isThemePresetId için temel testler.
 */

import { describe, it, expect } from "vitest";
import { PRESETS, getPresetById, isThemePresetId } from "../presets";

describe("Theme Presets", () => {
  it("PRESETS en az 6 tema icerir", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it("her preset unique ID'ye sahip", () => {
    const ids = PRESETS.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("her preset light ve dark token setine sahip", () => {
    PRESETS.forEach((preset) => {
      expect(preset.tokens.light).toBeDefined();
      expect(preset.tokens.dark).toBeDefined();
      expect(preset.tokens.light.primary).toBeTruthy();
      expect(preset.tokens.dark.primary).toBeTruthy();
    });
  });

  it("getPresetById gecerli ID ile preset doner", () => {
    const preset = getPresetById("default");
    expect(preset).toBeDefined();
    expect(preset?.label).toBe("Varsayılan");
  });

  it("getPresetById gecersiz ID icin undefined doner", () => {
    expect(getPresetById("yok-boyle-bir-tema")).toBeUndefined();
  });

  it("isThemePresetId gecerli ID'leri kabul eder", () => {
    expect(isThemePresetId("default")).toBe(true);
    expect(isThemePresetId("ocean")).toBe(true);
    expect(isThemePresetId("midnight")).toBe(true);
  });

  it("isThemePresetId gecersiz degerleri reddeder", () => {
    expect(isThemePresetId("yok")).toBe(false);
    expect(isThemePresetId(null)).toBe(false);
    expect(isThemePresetId(undefined)).toBe(false);
    expect(isThemePresetId(123)).toBe(false);
    expect(isThemePresetId({})).toBe(false);
  });

  it("OKLCH token formatinda uc deger (L C H) icerir", () => {
    const preset = getPresetById("default");
    expect(preset).toBeDefined();
    // "0.55 0.18 255" formati
    expect(preset!.tokens.light.primary).toMatch(/^\d+\.\d+\s+\d+\.\d+\s+\d+/);
  });

  it("tum preset'lerin badge ve description var", () => {
    PRESETS.forEach((preset) => {
      expect(preset.badge).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.label).toBeTruthy();
    });
  });

  it("light ve dark token'lar ayni sayida key icerir", () => {
    const preset = getPresetById("ocean");
    expect(preset).toBeDefined();
    expect(Object.keys(preset!.tokens.light).length).toBe(
      Object.keys(preset!.tokens.dark).length
    );
  });

  it("yeni preset eklenirse test gecerli kalmali (regression guard)", () => {
    // 6+ preset bekliyoruz — yeni eklenirse test kirilmamali
    expect(PRESETS.length).toBeGreaterThanOrEqual(6);
  });
});