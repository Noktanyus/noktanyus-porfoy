/**
 * @file Onboarding schemas tests
 * @description F3: schemas, getNextStep, isValidPersona için unit testler.
 */

import { describe, it, expect } from "vitest";
import {
  ONBOARDING_STEPS,
  getStepById,
  getNextStep,
  isValidPersona,
  type OnboardingStepId,
  type UserPersona,
} from "../schemas";

describe("Onboarding Schemas", () => {
  it("4 ana step var", () => {
    expect(ONBOARDING_STEPS.length).toBe(4);
  });

  it("step ID'leri unique", () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tum step'ler title ve description icerir", () => {
    ONBOARDING_STEPS.forEach((step) => {
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
    });
  });

  it("getStepById gecerli ID ile step doner", () => {
    const step = getStepById("welcome");
    expect(step).toBeDefined();
    expect(step?.title).toBe("Hoş Geldiniz!");
  });

  it("getStepById gecersiz ID icin undefined doner", () => {
    expect(getStepById("yok-boyle-step" as OnboardingStepId)).toBeUndefined();
  });

  it("getNextStep siradaki step'i doner", () => {
    expect(getNextStep("welcome")?.id).toBe("profile");
    expect(getNextStep("profile")?.id).toBe("tour");
    expect(getNextStep("tour")?.id).toBe("complete");
  });

  it("getNextStep son step icin null doner", () => {
    expect(getNextStep("complete")).toBeNull();
  });

  it("isValidPersona gecerli degerleri kabul eder", () => {
    const valid: UserPersona[] = ["developer", "designer", "marketer", "founder", "other"];
    valid.forEach((p) => expect(isValidPersona(p)).toBe(true));
  });

  it("isValidPersona gecersiz degerleri reddeder", () => {
    expect(isValidPersona("admin")).toBe(false);
    expect(isValidPersona(null)).toBe(false);
    expect(isValidPersona(undefined)).toBe(false);
    expect(isValidPersona(123)).toBe(false);
    expect(isValidPersona({})).toBe(false);
    expect(isValidPersona("")).toBe(false);
  });

  it("profile step required:true (skip edilemez)", () => {
    const profile = getStepById("profile");
    expect(profile?.required).toBe(true);
  });

  it("welcome, tour, complete skip edilebilir", () => {
    expect(getStepById("welcome")?.required).toBe(false);
    expect(getStepById("tour")?.required).toBe(false);
    expect(getStepById("complete")?.required).toBe(false);
  });

  it("tour step icin tourSteps tanimli", () => {
    const tour = getStepById("tour");
    expect(tour?.tourSteps).toBeDefined();
    expect(tour?.tourSteps?.length).toBeGreaterThan(0);
  });

  it("tour steps'lerin target/title/description var", () => {
    const tour = getStepById("tour");
    tour?.tourSteps?.forEach((ts) => {
      expect(ts.target).toBeTruthy();
      expect(ts.title).toBeTruthy();
      expect(ts.description).toBeTruthy();
    });
  });
});