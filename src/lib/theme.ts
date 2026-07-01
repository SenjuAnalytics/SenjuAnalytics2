/**
 * Theme constants and color system
 * Centralized color management for consistency
 */

export const THEME = {
  colors: {
    primary: {
      cyan: "#14d4e8",
      green: "#14F195",
      gradient: "linear-gradient(135deg, #14d4e8 0%, #14F195 100%)",
    },
    status: {
      success: "#14F195",
      error: "#ef4444",
      warning: "#fb923c",
      info: "#60A5FA",
    },
    ui: {
      background: "#040d12",
      card: "rgba(255, 255, 255, 0.03)",
      border: "rgba(255, 255, 255, 0.07)",
      text: "#ffffff",
      textMuted: "rgba(255, 255, 255, 0.4)",
    },
  },
  opacity: {
    glow: 0.15,
    hover: 0.08,
    disabled: 0.5,
  },
  borderRadius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
  },
  animation: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
  },
} as const;

/**
 * Platform-specific colors
 */
export const PLATFORM_COLORS: Record<string, string> = {
  pumpfun: "#00ff94",
  raydium: "#c663fc",
  moonshot: "#ffd93d",
  orca: "#00d4ff",
  meteora: "#ff6b35",
  virtuals: "#a78bfa",
  // Add more as needed
} as const;

/**
 * Get color for a platform (with fallback)
 */
export function getPlatformColor(platformId: string): string {
  return PLATFORM_COLORS[platformId.toLowerCase()] || THEME.colors.primary.cyan;
}

/**
 * Generate gradient string from two colors
 */
export function createGradient(color1: string, color2: string, angle = 135): string {
  return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Add opacity to hex color
 */
export function withOpacity(hexColor: string, opacity: number): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
