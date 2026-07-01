/**
 * Input validation utilities
 * Centralized validation logic for security and data integrity
 */

import { TOKEN_STANDARDS } from "./constants";

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  
  // Solana addresses are base58 encoded, 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate token mint address with detailed error
 */
export function validateTokenAddress(address: string): ValidationResult {
  if (!address || address.trim().length === 0) {
    return {
      valid: false,
      error: "Address is required",
    };
  }

  const trimmed = address.trim();

  if (trimmed.length < TOKEN_STANDARDS.MIN_ADDRESS_LENGTH) {
    return {
      valid: false,
      error: `Address must be at least ${TOKEN_STANDARDS.MIN_ADDRESS_LENGTH} characters`,
    };
  }

  if (!isValidSolanaAddress(trimmed)) {
    return {
      valid: false,
      error: "Invalid Solana address format",
    };
  }

  return { valid: true };
}

/**
 * Sanitize address input (remove whitespace, validate format)
 */
export function sanitizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, "");
}

/**
 * Validate number input
 */
export function validateNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: unknown): ValidationResult {
  if (!validateNumber(value)) {
    return { valid: false, error: "Must be a valid number" };
  }

  if (value <= 0) {
    return { valid: false, error: "Must be a positive number" };
  }

  return { valid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: {
  page?: unknown;
  limit?: unknown;
}): ValidationResult {
  const { page, limit } = params;

  if (page !== undefined) {
    if (!validateNumber(page) || page < 1) {
      return { valid: false, error: "Page must be a positive number" };
    }
  }

  if (limit !== undefined) {
    if (!validateNumber(limit) || limit < 1 || limit > 100) {
      return { valid: false, error: "Limit must be between 1 and 100" };
    }
  }

  return { valid: true };
}

/**
 * Validate timestamp
 */
export function validateTimestamp(timestamp: unknown): timestamp is number {
  if (!validateNumber(timestamp)) return false;
  
  // Reasonable range: 2020-01-01 to 2100-01-01
  const minTimestamp = 1577836800000; // 2020-01-01
  const maxTimestamp = 4102444800000; // 2100-01-01
  
  return timestamp >= minTimestamp && timestamp <= maxTimestamp;
}

/**
 * Type guard: check if value is string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard: check if value is non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}
