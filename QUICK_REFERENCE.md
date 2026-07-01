# ⚡ Quick Reference - Senju

> One-page cheatsheet for common tasks

---

## 🚀 Quick Commands

```bash
npm run dev              # Start dev server
npm test                 # Run tests (watch)
npm run test:run         # Run tests (once)
npm run build            # Production build
npm run type-check       # TypeScript check
npm run lint             # Lint code
```

---

## 📦 Common Imports

```typescript
// Config
import { ENV, API_CONFIG } from "@/config";

// Services
import * as helius from "@/services/helius.service";
import * as external from "@/services/external.service";
import * as tokenService from "@/services/token.service";

// Theme & Styling
import { THEME, getPlatformColor } from "@/lib/theme";

// Validation
import { validateTokenAddress, sanitizeAddress } from "@/lib/validation";

// Accessibility
import { getAriaLabel, getButtonAriaLabel } from "@/lib/accessibility";

// Error Handling
import { logError, logWarning } from "@/lib/error-logger";

// Rate Limiting
import { withRateLimit } from "@/lib/rate-limit";

// Constants
import { SOLANA_ADDRESSES, TOKEN_STANDARDS, BONDING_CURVE } from "@/lib/constants";
```

---

## 🎨 Using Theme

```typescript
// ✅ Good
import { THEME } from "@/lib/theme";
<div style={{ color: THEME.colors.primary.cyan }}>

// ❌ Bad
<div style={{ color: "#14d4e8" }}>
```

**Available Colors:**
```typescript
THEME.colors.primary.cyan      // #14d4e8
THEME.colors.primary.green     // #14F195
THEME.colors.status.success    // #14F195
THEME.colors.status.error      // #ef4444
THEME.colors.status.warning    // #fb923c
THEME.colors.status.info       // #60A5FA
```

---

## ✅ Input Validation

```typescript
import { validateTokenAddress, sanitizeAddress } from "@/lib/validation";

// Sanitize first
const clean = sanitizeAddress(userInput);

// Then validate
const result = validateTokenAddress(clean);
if (!result.valid) {
  setError(result.error);
  return;
}

// Proceed with clean address
processToken(clean);
```

---

## ♿ Accessibility

```typescript
import { getAriaLabel, getButtonAriaLabel } from "@/lib/accessibility";

// Input field
<input 
  aria-label={getAriaLabel("Token address", address)}
  aria-invalid={!!error}
  aria-describedby={error ? "error-msg" : undefined}
/>

// Button
<button aria-label={getButtonAriaLabel("Refresh", "token data")}>
  Refresh
</button>

// Loading state
<div {...getLoadingAriaAttrs(isLoading)}>
  {content}
</div>
```

---

## 🔌 Using Services

### Token Info
```typescript
import * as tokenService from "@/services/token.service";

const info = await tokenService.getTokenInfo(address);
// Returns: { name, symbol, price, supply, ... }
```

### Helius RPC
```typescript
import * as helius from "@/services/helius.service";

const account = await helius.getAccountInfo(address);
const holders = await helius.getTokenLargestAccounts(mint);
const metadata = await helius.getAssetMetadata(mint);
```

### External APIs
```typescript
import * as external from "@/services/external.service";

const price = await external.getJupiterPrice(mint);
const pairs = await external.getDexScreenerPairs(mint);
const solPrice = await external.getSolPriceUsd();
```

---

## 🛡️ Error Handling

```typescript
import { logError } from "@/lib/error-logger";

try {
  const data = await fetchData();
} catch (error) {
  logError("Failed to fetch", error, { address, source: "helius" });
  // Handle error
}
```

---

## 🚦 Rate Limiting API Routes

```typescript
import { withRateLimit } from "@/lib/rate-limit";

export const GET = withRateLimit(async (req, ctx) => {
  // Your handler
  return Response.json({ data });
}, {
  maxRequests: 50,   // Optional
  windowMs: 60000,   // Optional
});
```

---

## 🧪 Writing Tests

```typescript
import { describe, it, expect } from "vitest";

describe("myFunction", () => {
  it("should work", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });
});
```

---

## 📁 Where to Put Code

```
New feature? → src/lib/features/myfeature.ts
New component? → src/components/common/ or /dashboard/
New service? → src/services/myservice.service.ts
New test? → src/__tests__/lib/myfeature.test.ts
New type? → src/types/mytype.ts
```

---

## 🔧 Environment Variables

```env
# Required (server-side only)
HELIUS_API_KEY=your_key_here

# Optional
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

**Access in code:**
```typescript
import { ENV, API_CONFIG } from "@/config";

const apiKey = ENV.heliusApiKey;        // Server-side only
const rpcUrl = API_CONFIG.helius.rpc;   // With API key included
```

---

## 🏗️ Adding New Platform

1. **Create file:** `src/lib/platforms/myplatform.ts`
```typescript
export const myplatform: PlatformDef = {
  id: "myplatform",
  name: "My Platform",
  color: "#ff0000",
  detect: async (ctx) => ctx.dexIds.includes("myplatform"),
};
```

2. **Register:** `src/lib/platforms/index.ts`
```typescript
import { myplatform } from "./myplatform";
export const PLATFORMS: PlatformDef[] = [..., myplatform];
```

3. **Add icon:** `public/platforms/myplatform.png`

---

## 💰 Adding New Fee Source

1. **Create file:** `src/lib/fees/sources/mydex.ts`
```typescript
export const mydexFeeSource: FeeSource = {
  id: "mydex",
  name: "My DEX",
  getFeeClaims: async (mint) => [...],
};
```

2. **Register:** `src/lib/fees/index.ts`
```typescript
import { mydexFeeSource } from "./sources/mydex";
const SOURCES: FeeSource[] = [..., mydexFeeSource];
```

---

## 🎯 Common Patterns

### Parallel API Calls
```typescript
const [a, b, c] = await Promise.allSettled([
  fetchA(),
  fetchB(),
  fetchC(),
]);

if (a.status === "fulfilled") {
  // Use a.value
}
```

### Conditional Rendering with Loading
```typescript
{isPending ? (
  <Skeleton />
) : data ? (
  <Content data={data} />
) : (
  <EmptyState />
)}
```

### Form Validation
```typescript
function handleSubmit(e: FormEvent) {
  e.preventDefault();
  
  const sanitized = sanitizeAddress(input);
  const validation = validateTokenAddress(sanitized);
  
  if (!validation.valid) {
    setError(validation.error);
    return;
  }
  
  // Process...
}
```

---

## 📚 Documentation Links

- **Setup:** `SETUP.md`
- **Architecture:** `ARCHITECTURE.md`
- **Migration:** `MIGRATION_GUIDE.md`
- **Services:** `src/services/README.md`
- **Summary:** `REFACTORING_SUMMARY.md`
- **Changes:** `CHANGES.md`

---

## 🐛 Common Issues

### API Key Not Working
```bash
# Check .env.local
Get-Content .env.local

# Should have HELIUS_API_KEY (NOT NEXT_PUBLIC_)
```

### Tests Failing
```bash
# Clear cache
Remove-Item -Recurse .vitest

# Run again
npm run test:run
```

### Port In Use
```bash
# Use different port
$env:PORT=3001; npm run dev
```

---

## 🎨 Color Reference

```typescript
// Primary
THEME.colors.primary.cyan       // #14d4e8
THEME.colors.primary.green      // #14F195

// Status
THEME.colors.status.success     // #14F195
THEME.colors.status.error       // #ef4444
THEME.colors.status.warning     // #fb923c
THEME.colors.status.info        // #60A5FA

// UI
THEME.colors.ui.background      // #040d12
THEME.colors.ui.card            // rgba(255,255,255,0.03)
THEME.colors.ui.border          // rgba(255,255,255,0.07)
THEME.colors.ui.text            // #ffffff
THEME.colors.ui.textMuted       // rgba(255,255,255,0.4)
```

---

## 🔑 Key Constants

```typescript
// Solana
SOLANA_ADDRESSES.BURN           // Burn address
SOLANA_ADDRESSES.NULL           // Null address

// Token Standards
TOKEN_STANDARDS.ADDRESS_LENGTH  // 32
TOKEN_STANDARDS.SOL_DECIMALS    // 9
TOKEN_STANDARDS.DEFAULT_DECIMALS // 9

// Bonding Curve
BONDING_CURVE.OFFSET_COMPLETE   // 48
BONDING_CURVE.OFFSET_MAYHEM     // 81
BONDING_CURVE.OFFSET_CASHBACK   // 82
BONDING_CURVE.MIN_LENGTH        // 83

// API Limits
API_LIMITS.DEFAULT_TX_LIMIT     // 50
API_LIMITS.MAX_TX_LIMIT         // 100
```

---

## 📊 Type Reference

```typescript
// Token
TokenInfo, TokenPair, TokenTransaction

// Locks
TokenLock

// Fees
FeeClaimRecord, FeeMode, FeeModeResult

// Liquidity
LiquidityPool

// Burns
BurnRecord

// Platform
LaunchPlatform, PlatformDef
```

---

## ⚡ Performance Tips

1. **Use parallel fetching:** `Promise.allSettled()`
2. **Add timeouts:** `AbortSignal.timeout(5000)`
3. **Use React Query caching:** Already configured
4. **Deduplicate records:** `Set` for unique values

---

## 🆘 Quick Help

**Need help?**
1. Check relevant `*.md` file
2. Search existing code for examples
3. Read service documentation
4. Ask in discussions

**Last Updated:** June 9, 2026
