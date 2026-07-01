/**
 * Unit tests for formatting utilities
 */

import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatUsd,
  formatPercent,
  formatAddress,
  formatTimestamp,
  formatRelativeTime,
} from "@/lib/formatters";

describe("formatNumber", () => {
  it("formats billions correctly", () => {
    expect(formatNumber(1_500_000_000)).toBe("1.50B");
    expect(formatNumber(12_300_000_000)).toBe("12.30B");
  });

  it("formats millions correctly", () => {
    expect(formatNumber(2_500_000)).toBe("2.50M");
    expect(formatNumber(15_600_000)).toBe("15.60M");
  });

  it("formats thousands correctly", () => {
    expect(formatNumber(5_400)).toBe("5.40K");
    expect(formatNumber(999)).toBe("999.00");
  });

  it("handles small numbers", () => {
    expect(formatNumber(42.567)).toBe("42.57");
    expect(formatNumber(0.123)).toBe("0.12");
  });

  it("handles invalid inputs", () => {
    expect(formatNumber(NaN)).toBe("—");
    expect(formatNumber(null as unknown as number)).toBe("—");
    expect(formatNumber(undefined as unknown as number)).toBe("—");
  });
});

describe("formatUsd", () => {
  it("formats large amounts with suffixes", () => {
    expect(formatUsd(1_500_000_000)).toBe("$1.50B");
    expect(formatUsd(2_500_000)).toBe("$2.50M");
    expect(formatUsd(5_400)).toBe("$5.40K");
  });

  it("formats dollars correctly", () => {
    expect(formatUsd(100)).toBe("$100.00");
    expect(formatUsd(42.50)).toBe("$42.50");
  });

  it("formats cents correctly", () => {
    expect(formatUsd(0.50)).toBe("$0.500");
    expect(formatUsd(0.015)).toBe("$0.015");
  });

  it("formats small crypto prices", () => {
    expect(formatUsd(0.00012345)).toBe("$0.0001234");
    expect(formatUsd(0.000000123)).toBe("$0.000000123");
  });

  it("handles zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });

  it("handles invalid inputs", () => {
    expect(formatUsd(NaN)).toBe("—");
    expect(formatUsd(null as unknown as number)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("formats positive percentages", () => {
    expect(formatPercent(5.67)).toBe("+5.67%");
    expect(formatPercent(100)).toBe("+100.00%");
  });

  it("formats negative percentages", () => {
    expect(formatPercent(-5.67)).toBe("-5.67%");
    expect(formatPercent(-100)).toBe("-100.00%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });

  it("handles invalid inputs", () => {
    expect(formatPercent(NaN)).toBe("—");
    expect(formatPercent(undefined as unknown as number)).toBe("—");
  });
});

describe("formatAddress", () => {
  it("truncates Solana addresses", () => {
    const address = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
    expect(formatAddress(address)).toBe("DezX...B263");
    expect(formatAddress(address, 6)).toBe("DezXAZ...pPB263");
  });

  it("handles short addresses", () => {
    expect(formatAddress("short")).toBe("shor...hort");
  });

  it("handles invalid inputs", () => {
    expect(formatAddress("")).toBe("—");
    expect(formatAddress(null as unknown as string)).toBe("—");
  });
});

describe("formatTimestamp", () => {
  it("formats Unix timestamps (seconds)", () => {
    const timestamp = 1609459200; // 2021-01-01 00:00:00 UTC
    const formatted = formatTimestamp(timestamp);
    expect(formatted).toContain("2021");
    expect(formatted).toContain("Jan");
  });

  it("formats millisecond timestamps", () => {
    const timestamp = 1609459200000; // 2021-01-01 00:00:00 UTC
    const formatted = formatTimestamp(timestamp);
    expect(formatted).toContain("2021");
  });

  it("handles invalid inputs", () => {
    expect(formatTimestamp(0)).toBe("—");
    expect(formatTimestamp(null as unknown as number)).toBe("—");
  });
});

describe("formatRelativeTime", () => {
  it("formats seconds ago", () => {
    const timestamp = Date.now() - 30_000; // 30 seconds ago
    expect(formatRelativeTime(timestamp)).toMatch(/\d+s ago/);
  });

  it("formats minutes ago", () => {
    const timestamp = Date.now() - 180_000; // 3 minutes ago
    expect(formatRelativeTime(timestamp)).toMatch(/\d+m ago/);
  });

  it("formats hours ago", () => {
    const timestamp = Date.now() - 7_200_000; // 2 hours ago
    expect(formatRelativeTime(timestamp)).toMatch(/\d+h ago/);
  });

  it("formats days ago", () => {
    const timestamp = Date.now() - 172_800_000; // 2 days ago
    expect(formatRelativeTime(timestamp)).toMatch(/\d+d ago/);
  });

  it("handles invalid inputs", () => {
    expect(formatRelativeTime(0)).toBe("—");
  });
});
