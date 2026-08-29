/**
 * @file GraphQL validation tests
 * @description D1: depth/complexity/rate-limit/mutation-detection testleri.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateDepth,
  calculateComplexity,
  validateQuery,
  isMutation,
  isSubscription,
  isIntrospection,
  checkRateLimit,
  _resetRateLimitStore,
} from "../validation";

describe("GraphQL Validation", () => {
  describe("calculateDepth", () => {
    it("basit sorgu icin 1+ doner", () => {
      const depth = calculateDepth(`{ users { id } }`);
      expect(depth).toBeGreaterThanOrEqual(1);
    });

    it("ic ice sorgu daha yuksek depth", () => {
      const depth = calculateDepth(`{ users { orders { items { product { name } } } } }`);
      expect(depth).toBeGreaterThan(3);
    });

    it("bos sorgu 0 doner", () => {
      expect(calculateDepth("")).toBe(0);
    });
  });

  describe("calculateComplexity", () => {
    it("basit sorgu 0+ complexity", () => {
      const c = calculateComplexity(`{ health }`);
      expect(c).toBeGreaterThanOrEqual(0);
    });

    it("cok field'li sorgu yuksek complexity", () => {
      const simple = calculateComplexity(`{ users { id name email } }`);
      const complex = calculateComplexity(`{ users { id orders { id items { id } } } }`);
      expect(complex).toBeGreaterThan(simple);
    });
  });

  describe("validateQuery", () => {
    it("kucuk query gecerli", () => {
      const r = validateQuery(`{ health }`);
      expect(r.valid).toBe(true);
    });

    it("max depth asiminda gecersiz", () => {
      // 15 levels deep
      const deep = `{ a { a { a { a { a { a { a { a { a { a { a { a { a { a { a } } } } } } } } } } } } } } }`;
      const r = validateQuery(deep, { maxDepth: 5 });
      expect(r.valid).toBe(false);
      expect(r.reason).toContain("depth");
    });

    it("yuksek complexity gecersiz", () => {
      const complex = `{ a b c d e f g h i j k l m n o p q r s t u v w x y z }`;
      const r = validateQuery(complex, { maxComplexity: 5 });
      expect(r.valid).toBe(false);
      expect(r.reason).toContain("complexity");
    });
  });

  describe("isMutation", () => {
    it("mutation keyword tespiti", () => {
      expect(isMutation(`mutation { updateOrderStatus }`)).toBe(true);
    });

    it("query mutation degil", () => {
      expect(isMutation(`{ users }`)).toBe(false);
    });

    it("bos string false", () => {
      expect(isMutation("")).toBe(false);
    });
  });

  describe("isSubscription", () => {
    it("subscription keyword tespiti", () => {
      expect(isSubscription(`subscription { orderCreated }`)).toBe(true);
    });

    it("query subscription degil", () => {
      expect(isSubscription(`{ users }`)).toBe(false);
    });
  });

  describe("isIntrospection", () => {
    it("__schema tespiti", () => {
      expect(isIntrospection(`{ __schema { types { name } } }`)).toBe(true);
    });

    it("normal query false", () => {
      expect(isIntrospection(`{ users { id } }`)).toBe(false);
    });
  });

  describe("checkRateLimit", () => {
    beforeEach(() => _resetRateLimitStore());

    it("ilk request gecerli", () => {
      const r = checkRateLimit("user-1");
      expect(r.valid).toBe(true);
    });

    it("ayni user 100+ request sonrasi gecersiz", () => {
      for (let i = 0; i < 100; i++) {
        checkRateLimit("user-2");
      }
      const r = checkRateLimit("user-2");
      expect(r.valid).toBe(false);
      expect(r.reason).toContain("Rate limit");
    });

    it("farkli user bagimsiz limit", () => {
      for (let i = 0; i < 50; i++) {
        checkRateLimit("user-a");
      }
      // user-b yeni — gecerli
      expect(checkRateLimit("user-b").valid).toBe(true);
    });
  });
});