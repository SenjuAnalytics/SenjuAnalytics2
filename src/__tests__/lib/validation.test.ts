/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from "vitest";
import {
  isValidSolanaAddress,
  validateTokenAddress,
  sanitizeAddress,
  validateNumber,
  validatePositiveNumber,
  validatePagination,
  isString,
  isNonEmptyString,
} from "@/lib/validation";

describe("isValidSolanaAddress", () => {
  it("validates correct Solana addresses", () => {
    expect(isValidSolanaAddress("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")).toBe(true);
    expect(isValidSolanaAddress("11111111111111111111111111111111")).toBe(true);
  });

  it("rejects invalid addresses", () => {
    expect(isValidSolanaAddress("")).toBe(false);
    expect(isValidSolanaAddress("invalid")).toBe(false);
    expect(isValidSolanaAddress("DezXAZ8z@invalid")).toBe(false);
    expect(isValidSolanaAddress("tooshort")).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(isValidSolanaAddress(null as unknown as string)).toBe(false);
    expect(isValidSolanaAddress(undefined as unknown as string)).toBe(false);
    expect(isValidSolanaAddress(123 as unknown as string)).toBe(false);
  });
});

describe("validateTokenAddress", () => {
  it("validates correct addresses", () => {
    const result = validateTokenAddress("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects empty addresses", () => {
    const result = validateTokenAddress("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Address is required");
  });

  it("rejects short addresses", () => {
    const result = validateTokenAddress("short");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 32 characters");
  });

  it("rejects invalid format", () => {
    const result = validateTokenAddress("DezXAZ8z@InvalidCharacters!!!!!!");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid Solana address format");
  });

  it("trims whitespace before validation", () => {
    const result = validateTokenAddress("  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263  ");
    expect(result.valid).toBe(true);
  });
});

describe("sanitizeAddress", () => {
  it("removes leading/trailing whitespace", () => {
    expect(sanitizeAddress("  address  ")).toBe("address");
  });

  it("removes internal whitespace", () => {
    expect(sanitizeAddress("addre ss")).toBe("address");
    expect(sanitizeAddress("add re  ss")).toBe("address");
  });

  it("handles empty strings", () => {
    expect(sanitizeAddress("")).toBe("");
    expect(sanitizeAddress("   ")).toBe("");
  });
});

describe("validateNumber", () => {
  it("validates valid numbers", () => {
    expect(validateNumber(42)).toBe(true);
    expect(validateNumber(0)).toBe(true);
    expect(validateNumber(-5)).toBe(true);
    expect(validateNumber(3.14)).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(validateNumber(NaN)).toBe(false);
    expect(validateNumber(Infinity)).toBe(false);
    expect(validateNumber(-Infinity)).toBe(false);
    expect(validateNumber("42" as unknown as number)).toBe(false);
    expect(validateNumber(null as unknown as number)).toBe(false);
  });
});

describe("validatePositiveNumber", () => {
  it("validates positive numbers", () => {
    const result = validatePositiveNumber(42);
    expect(result.valid).toBe(true);
  });

  it("rejects zero and negative numbers", () => {
    expect(validatePositiveNumber(0).valid).toBe(false);
    expect(validatePositiveNumber(-5).valid).toBe(false);
  });

  it("rejects non-numbers", () => {
    expect(validatePositiveNumber("42").valid).toBe(false);
    expect(validatePositiveNumber(NaN).valid).toBe(false);
  });
});

describe("validatePagination", () => {
  it("validates valid pagination", () => {
    expect(validatePagination({ page: 1, limit: 10 }).valid).toBe(true);
    expect(validatePagination({ page: 5, limit: 50 }).valid).toBe(true);
  });

  it("rejects invalid page numbers", () => {
    expect(validatePagination({ page: 0 }).valid).toBe(false);
    expect(validatePagination({ page: -1 }).valid).toBe(false);
    expect(validatePagination({ page: "1" }).valid).toBe(false);
  });

  it("rejects invalid limits", () => {
    expect(validatePagination({ limit: 0 }).valid).toBe(false);
    expect(validatePagination({ limit: -1 }).valid).toBe(false);
    expect(validatePagination({ limit: 101 }).valid).toBe(false);
  });

  it("allows undefined params", () => {
    expect(validatePagination({}).valid).toBe(true);
  });
});

describe("isString", () => {
  it("identifies strings", () => {
    expect(isString("hello")).toBe(true);
    expect(isString("")).toBe(true);
  });

  it("rejects non-strings", () => {
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
  });
});

describe("isNonEmptyString", () => {
  it("identifies non-empty strings", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString("  text  ")).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString("   ")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });
});
