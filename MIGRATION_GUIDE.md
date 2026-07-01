# 🔄 Migration Guide - Refactoring Updates

## Overview

This guide explains the recent refactoring changes and how to use the new architecture.

---

## 📋 What Changed?

### 1. **Service Layer Added** ⭐ NEW

**Before:**
```typescript
// Scattered fetch calls everywhere
const res = await fetch(`https://mainnet.helius-rpc.com/...`);
```

**After:**
```typescript
// Centralized service layer
import * as heliusService from "@/services/helius.service";
const result = await heliusService.getAccountInfo(address);
```

### 2. **Configuration Centralized** ⭐ NEW

**Before:**
```typescript
// Scattered env vars
const apiKey = process.env.HELIUS_API_KEY || "";
const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
```

**After:**
```typescript
// Centralized config
import { API_CONFIG } from "@/config";
const rpcUrl = API_CONFIG.helius.rpc;
```

### 3. **Theme System Added** ⭐ NEW

**Before:**
```typescript
// Hardcoded colors
<div style={{ color: "#14d4e8" }}>
```

**After:**
```typescript
import { THEME } from "@/lib/theme";
<div style={{ color: THEME.colors.primary.cyan }}>
```

### 4. **Validation Added** ⭐ NEW

**Before:**
```typescript
// Manual validation
if (address.length < 32) {
  setError("Invalid address");
}
```

**After:**
```typescript
import { validateTokenAddress } from "@/lib/validation";
const result = validateTokenAddress(address);
if (!result.valid) {
  setError(result.error);
}
```

### 5. **Accessibility Added** ⭐ NEW

**Before:**
```typescript
<button onClick={...}>Refresh</button>
```

**After:**
```typescript
import { getButtonAriaLabel } from "@/lib/accessibility";
<button onClick={...} aria-label={getButtonAriaLabel("Refresh", "data")}>
  Refresh
</button>
```

### 6. **Constants Improved** ✅

**Before:**
```typescript
const BC_MAYHEM_OFF = 81;
const BC_CASHBACK_OFF = 82;
```

**After:**
```typescript
import { BONDING_CURVE } from "@/lib/constants";
const isMayhem = bcData[BONDING_CURVE.OFFSET_MAYHEM] === 1;
```

---

## 🔧 How to Migrate Your Code

### For API Routes

**Old Pattern:**
```typescript
// route.ts
import { getTokenInfo } from "@/lib/api";

export async function GET(req, ctx) {
  const { address } = await ctx.params;
  const info = await getTokenInfo(address);
  return Response.json(info);
}
```

**New Pattern:**
```typescript
// route.ts
import * as tokenService from "@/services/token.service";
import { validateTokenAddress } from "@/lib/validation";
import { withRateLimit } from "@/lib/rate-limit";

export const GET = withRateLimit(async (req, ctx) => {
  const { address } = await ctx.params;
  
  // Validate input
  const validation = validateTokenAddress(address);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  
  // Use service layer
  const info = await tokenService.getTokenInfo(address);
  return Response.json(info);
});
```

### For Components

**Old Pattern:**
```typescript
// Component.tsx
export function MyComponent() {
  return (
    <div style={{ color: "#14d4e8" }}>
      <button onClick={handleClick}>Click</button>
    </div>
  );
}
```

**New Pattern:**
```typescript
// Component.tsx
import { THEME } from "@/lib/theme";
import { getButtonAriaLabel } from "@/lib/accessibility";

export function MyComponent() {
  return (
    <div style={{ color: THEME.colors.primary.cyan }}>
      <button 
        onClick={handleClick}
        aria-label={getButtonAriaLabel("Click", "action")}
      >
        Click
      </button>
    </div>
  );
}
```

### For Input Validation

**Old Pattern:**
```typescript
function handleSubmit() {
  const trimmed = input.trim();
  if (trimmed.length < 32) {
    setError("Address too short");
    return;
  }
  // proceed...
}
```

**New Pattern:**
```typescript
import { validateTokenAddress, sanitizeAddress } from "@/lib/validation";

function handleSubmit() {
  const sanitized = sanitizeAddress(input);
  const validation = validateTokenAddress(sanitized);
  
  if (!validation.valid) {
    setError(validation.error);
    return;
  }
  // proceed...
}
```

---

## 📦 New Utilities Available

### 1. Theme System (`@/lib/theme`)

```typescript
import { THEME, getPlatformColor, withOpacity } from "@/lib/theme";

// Use theme colors
<div style={{ color: THEME.colors.primary.cyan }} />

// Get platform color with fallback
const color = getPlatformColor("raydium");

// Add opacity to color
const bgColor = withOpacity(THEME.colors.primary.cyan, 0.1);
```

### 2. Validation (`@/lib/validation`)

```typescript
import { 
  validateTokenAddress,
  sanitizeAddress,
  validateNumber,
  validatePositiveNumber,
  validatePagination,
  isValidSolanaAddress,
} from "@/lib/validation";

// Validate address
const result = validateTokenAddress(address);
if (!result.valid) console.error(result.error);

// Sanitize input
const clean = sanitizeAddress(userInput);

// Type guards
if (validateNumber(value)) {
  // TypeScript knows 'value' is number here
}
```

### 3. Accessibility (`@/lib/accessibility`)

```typescript
import { 
  getAriaLabel,
  getLoadingAriaAttrs,
  getButtonAriaLabel,
  getInteractiveAriaAttrs,
  announceToScreenReader,
} from "@/lib/accessibility";

// Simple aria label
<input aria-label={getAriaLabel("Token address", address)} />

// Loading state
<div {...getLoadingAriaAttrs(isLoading)}>

// Button with context
<button aria-label={getButtonAriaLabel("Refresh", "token data")}>

// Announce to screen reader
announceToScreenReader("Data updated successfully");
```

### 4. Rate Limiting (`@/lib/rate-limit`)

```typescript
import { withRateLimit } from "@/lib/rate-limit";

// Wrap API route handler
export const GET = withRateLimit(async (req) => {
  // Your handler code
}, {
  maxRequests: 50,  // Optional: override default
  windowMs: 60000,  // Optional: override default
});
```

### 5. Error Logging (`@/lib/error-logger`)

```typescript
import { logError, logWarning, logInfo, trackEvent } from "@/lib/error-logger";

// Log error with context
try {
  // risky operation
} catch (error) {
  logError("Failed to fetch data", error, { address, source: "helius" });
}

// Log warning
logWarning("Rate limit approaching", { remaining: 10 });

// Track events (for analytics)
trackEvent("token_searched", { address, platform: "pumpfun" });
```

### 6. Services (`@/services/`)

```typescript
// Helius service
import * as helius from "@/services/helius.service";
const account = await helius.getAccountInfo(address);
const holders = await helius.getTokenLargestAccounts(mint);
const metadata = await helius.getAssetMetadata(mint);

// External service
import * as external from "@/services/external.service";
const price = await external.getJupiterPrice(mint);
const pairs = await external.getDexScreenerPairs(mint);
const solPrice = await external.getSolPriceUsd();

// Token service (high-level aggregation)
import * as tokenService from "@/services/token.service";
const info = await tokenService.getTokenInfo(mint);
```

---

## 🧪 Testing Your Changes

### Run Tests

```bash
# Watch mode (for development)
npm test

# Single run (for CI)
npm run test:run

# With coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

### Writing Tests

```typescript
// src/__tests__/lib/myFeature.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/myFeature";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });
  
  it("should handle edge cases", () => {
    expect(myFunction("")).toBe("");
    expect(myFunction(null)).toBe(null);
  });
});
```

---

## ⚠️ Breaking Changes

### 1. Environment Variables

**IMPORTANT:** Remove `NEXT_PUBLIC_` prefix from API keys!

**Before (`.env.local`):**
```env
NEXT_PUBLIC_HELIUS_API_KEY=xxx  # ❌ EXPOSED TO CLIENT
```

**After (`.env.local`):**
```env
HELIUS_API_KEY=xxx  # ✅ Server-side only
```

**Action Required:**
1. Update your `.env.local` file
2. Remove `NEXT_PUBLIC_HELIUS_API_KEY`
3. Add `HELIUS_API_KEY` without prefix

### 2. Direct RPC Calls Removed

If you have any components making direct RPC calls, they need to go through API routes now.

**Before:**
```typescript
// Component making direct RPC call ❌
const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${key}`, ...);
```

**After:**
```typescript
// Use API route ✅
const res = await fetch(`/api/token/${address}`);
```

### 3. Import Paths Changed

Some utilities moved to new locations:

```typescript
// Old
import { getTokenInfo } from "@/lib/api";

// New
import * as tokenService from "@/services/token.service";
const info = await tokenService.getTokenInfo(address);
```

---

## 📝 Code Style Guidelines

### 1. Always Use Theme Constants

```typescript
// ❌ BAD
<div style={{ color: "#14d4e8" }}>

// ✅ GOOD
import { THEME } from "@/lib/theme";
<div style={{ color: THEME.colors.primary.cyan }}>
```

### 2. Always Validate User Input

```typescript
// ❌ BAD
function handleSearch(address: string) {
  router.push(`/token/${address}`);
}

// ✅ GOOD
import { validateTokenAddress, sanitizeAddress } from "@/lib/validation";

function handleSearch(address: string) {
  const sanitized = sanitizeAddress(address);
  const validation = validateTokenAddress(sanitized);
  if (!validation.valid) {
    setError(validation.error);
    return;
  }
  router.push(`/token/${sanitized}`);
}
```

### 3. Always Add Accessibility

```typescript
// ❌ BAD
<button onClick={refresh}>Refresh</button>

// ✅ GOOD
import { getButtonAriaLabel } from "@/lib/accessibility";
<button 
  onClick={refresh}
  aria-label={getButtonAriaLabel("Refresh", "token data")}
>
  Refresh
</button>
```

### 4. Always Use Centralized Logging

```typescript
// ❌ BAD
try {
  // ...
} catch (error) {
  console.error("Error:", error);
}

// ✅ GOOD
import { logError } from "@/lib/error-logger";
try {
  // ...
} catch (error) {
  logError("Failed to fetch token", error, { address });
}
```

### 5. Use Type Guards

```typescript
// ❌ BAD
if (typeof value === "number" && !isNaN(value)) {
  // ...
}

// ✅ GOOD
import { validateNumber } from "@/lib/validation";
if (validateNumber(value)) {
  // TypeScript knows value is number here
}
```

---

## 🎯 Quick Reference

### Import Cheatsheet

```typescript
// Configuration
import { ENV, API_CONFIG, APP_CONFIG } from "@/config";

// Services
import * as helius from "@/services/helius.service";
import * as external from "@/services/external.service";
import * as tokenService from "@/services/token.service";

// Utilities
import { THEME, getPlatformColor } from "@/lib/theme";
import { validateTokenAddress, sanitizeAddress } from "@/lib/validation";
import { getAriaLabel, getButtonAriaLabel } from "@/lib/accessibility";
import { logError, logWarning, trackEvent } from "@/lib/error-logger";
import { withRateLimit } from "@/lib/rate-limit";

// Constants
import { SOLANA_ADDRESSES, TOKEN_STANDARDS, BONDING_CURVE } from "@/lib/constants";
```

---

## 🚀 Installation for New Developers

```bash
# 1. Clone repository
git clone https://github.com/your-repo/senju.git
cd senju

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local and add your HELIUS_API_KEY

# 4. Run tests (verify setup)
npm run test:run

# 5. Run dev server
npm run dev
```

---

## 📚 Additional Resources

- **Architecture Guide:** See `ARCHITECTURE.md`
- **API Documentation:** See `API_DOCUMENTATION.md`
- **Contributing:** See `CONTRIBUTING.md` (TODO)
- **Type Definitions:** See `src/types/token.ts`

---

## ❓ FAQ

### Q: Why remove `NEXT_PUBLIC_` from API key?
**A:** Client-side API keys can be abused. All RPC calls now go through API routes (server-side) with rate limiting.

### Q: Do I need to update existing code?
**A:** Not immediately. Old patterns still work, but new code should follow the new patterns.

### Q: How do I add a new platform?
**A:** See "Adding New Features" in `ARCHITECTURE.md`

### Q: Where do I put business logic?
**A:** In `src/lib/` for domain logic, `src/services/` for external APIs.

### Q: How do I run tests?
**A:** `npm test` for watch mode, `npm run test:run` for single run.

---

## 🆘 Need Help?

- Check existing code for examples
- Read `ARCHITECTURE.md` for design patterns
- Ask in GitHub Discussions
- Open an issue for bugs

**Last Updated:** June 2026
