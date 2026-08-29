/**
 * @file Branding schemas tests
 * @description F4: schemas, font options, color validation testleri.
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_BRANDING,
  FONT_OPTIONS,
  getFontByValue,
  isFontFamily,
  isValidHexColor,
  hexToOklch,
} from "../schemas";

describe("Branding Schemas", () => {
  it("DEFAULT_BRANDING tum alanlari icerir", () => {
    expect(DEFAULT_BRANDING).toHaveProperty("logoUrl");
    expect(DEFAULT_BRANDING).toHaveProperty("primaryColor");
    expect(DEFAULT_BRANDING).toHaveProperty("accentColor");
    expect(DEFAULT_BRANDING).toHaveProperty("fontFamily");
    expect(DEFAULT_BRANDING).toHaveProperty("customCss");
  });

  it("DEFAULT_BRANDING.primaryColor valid hex", () => {
    expect(isValidHexColor(DEFAULT_BRANDING.primaryColor)).toBe(true);
  });

  it("FONT_OPTIONS 4+ font icerir", () => {
    expect(FONT_OPTIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("her font cssValue ve weights icerir", () => {
    FONT_OPTIONS.forEach((f) => {
      expect(f.cssValue).toBeTruthy();
      expect(f.weights.length).toBeGreaterThan(0);
    });
  });

  it("getFontByValue gecerli font doner", () => {
    const inter = getFontByValue("inter");
    expect(inter).toBeDefined();
    expect(inter?.label).toBe("Inter");
  });

  it("getFontByValue gecersiz icin undefined", () => {
    expect(getFontByValue("comic-sans")).toBeUndefined();
  });

  it("isFontFamily gecerli degerleri kabul eder", () => {
    expect(isFontFamily("inter")).toBe(true);
    expect(isFontFamily("system")).toBe(true);
    expect(isFontFamily("poppins")).toBe(true);
  });

  it("isFontFamily gecersiz degerleri reddeder", () => {
    expect(isFontFamily("comic-sans")).toBe(false);
    expect(isFontFamily(null)).toBe(false);
    expect(isFontFamily(undefined)).toBe(false);
    expect(isFontFamily(123)).toBe(false);
  });

  it("isValidHexColor 6-char hex kabul eder", () => {
    expect(isValidHexColor("#3b82f6")).toBe(true);
    expect(isValidHexColor("#ABCDEF")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
    expect(isValidHexColor("#ffffff")).toBe(true);
  });

  it("isValidHexColor 3-char shorthand kabul eder", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#abc")).toBe(true);
  });

  it("isValidHexColor 8-char alpha kabul eder", () => {
    expect(isValidHexColor("#ff00ff80")).toBe(true);
  });

  it("isValidHexColor '#' olmadan reddeder", () => {
    expect(isValidHexColor("3b82f6")).toBe(false);
    expect(isValidHexColor("ff00ff")).toBe(false);
  });

  it("isValidHexColor gecersiz karakter reddeder", () => {
    expect(isValidHexColor("#xyzxyz")).toBe(false);
    expect(isValidHexColor("#zzz")).toBe(false);
  });

  it("isValidHexColor yanlis uzunluk reddeder", () => {
    expect(isValidHexColor("#12345")).toBe(false); // 5 char
    expect(isValidHexColor("#1234567")).toBe(false); // 7 char
  });

  it("isValidHexColor null/undefined/non-string reddeder", () => {
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
    expect(isValidHexColor(123)).toBe(false);
    expect(isValidHexColor({})).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });

  it("hexToOklch hex'i oldugu gibi doner (fallback)", () => {
    expect(hexToOklch("#3b82f6")).toBe("#3b82f6");
  });
});