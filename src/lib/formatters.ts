import { TIME } from "./constants";

export function formatNumber(value: number, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
  return value.toFixed(decimals);
}

export function formatUsd(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  if (value === 0) return "$0.00";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  if (value >= 0.001) return `$${value.toFixed(4)}`;
  if (value >= 0.000001) return `$${value.toFixed(7)}`;
  return `$${value.toFixed(9)}`;
}

export function formatTokenAmount(value: number, decimals = 6): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  const adjusted = value / Math.pow(10, decimals);
  return formatNumber(adjusted, 2);
}

export function formatPercent(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return "—";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return "—";
  const ms = timestamp > TIME.TIMESTAMP_THRESHOLD ? timestamp : timestamp * TIME.SECOND;
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "—";
  const ms = timestamp > TIME.TIMESTAMP_THRESHOLD ? timestamp : timestamp * TIME.SECOND;
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / TIME.SECOND);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Full human-readable date: "Mon, 5 Mar 2037 · 06:00 AM"
 * Clear enough that users never need to guess day/month/year/time.
 */
export function formatFullDate(timestamp: number): string {
  if (!timestamp) return "—";
  const ms = timestamp > TIME.TIMESTAMP_THRESHOLD ? timestamp : timestamp * TIME.SECOND;
  const d = new Date(ms);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${weekday}, ${day} ${month} ${year} · ${time}`;
}

/**
 * Returns a human-readable countdown like "in 11 years" or "3 days ago".
 */
export function formatTimeDistance(timestamp: number): string {
  if (!timestamp) return "—";
  const ms = timestamp > TIME.TIMESTAMP_THRESHOLD ? timestamp : timestamp * TIME.SECOND;
  const diff = ms - Date.now();
  const absDiff = Math.abs(diff);
  const suffix = diff > 0 ? "" : " ago";
  const prefix = diff > 0 ? "in " : "";
  const minutes = Math.floor(absDiff / TIME.MINUTE);
  if (minutes < 60) return `${prefix}${minutes}m${suffix}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${prefix}${hours}h${suffix}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${prefix}${days} day${days !== 1 ? "s" : ""}${suffix}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${prefix}${months} month${months !== 1 ? "s" : ""}${suffix}`;
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days - years * 365) / 30);
  if (remMonths > 0) return `${prefix}${years}y ${remMonths}mo${suffix}`;
  return `${prefix}${years} year${years !== 1 ? "s" : ""}${suffix}`;
}


