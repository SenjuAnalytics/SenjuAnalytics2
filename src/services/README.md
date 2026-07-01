# 🔌 Service Layer Documentation

## Overview

The service layer handles all external API communication. This layer sits between API routes and external services, providing:

- ✅ Centralized API logic
- ✅ Consistent error handling
- ✅ Timeout management
- ✅ Easy mocking for tests
- ✅ Type-safe interfaces

---

## Architecture

```
API Routes (route.ts)
    ↓
Services (*.service.ts)
    ↓
External APIs (Helius, DexScreener, etc.)
```

---

## Available Services

### 1. **Helius Service** (`helius.service.ts`)

Handles all Helius RPC and API calls.

#### Functions:

**`heliusRpc(method, params)`**
- Generic RPC call wrapper
- Automatic timeout (5s)
- Error logging
- Type-safe

```typescript
import * as helius from "@/services/helius.service";

const result = await helius.heliusRpc("getAccountInfo", [address, { encoding: "jsonParsed" }]);
```

**`getAccountInfo(address, encoding?)`**
- Get Solana account info
- Default encoding: `"jsonParsed"`

```typescript
const account = await helius.getAccountInfo(mintAddress);
const decimals = account?.value?.data?.parsed?.info?.decimals;
```

**`getTokenLargestAccounts(mint)`**
- Get largest token holders
- Returns array of accounts

```typescript
const holders = await helius.getTokenLargestAccounts(mintAddress);
const holderCount = holders?.value?.length ?? 0;
```

**`getAssetMetadata(mint)`**
- Get token metadata via DAS API
- Returns logo, name, description

```typescript
const metadata = await helius.getAssetMetadata(mintAddress);
const logoUri = metadata?.content?.links?.image;
```

**`getTransactionHistory(address, limit?)`**
- Get transaction history
- Default limit: 50

```typescript
const txns = await helius.getTransactionHistory(mintAddress, 100);
```

---

### 2. **External Service** (`external.service.ts`)

Handles third-party APIs (DexScreener, Jupiter, Binance).

#### Functions:

**`getJupiterPrice(mint)`**
- Get token price from Jupiter
- Returns number | null

```typescript
import * as external from "@/services/external.service";

const price = await external.getJupiterPrice(mintAddress);
if (price) {
  console.log(`Price: $${price}`);
}
```

**`getDexScreenerPairs(mint)`**
- Get all trading pairs
- Filters for Solana only
- Returns TokenPair[]

```typescript
const pairs = await external.getDexScreenerPairs(mintAddress);
const bestPair = pairs.sort((a, b) => 
  (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
)[0];
```

**`getSolPriceUsd()`**
- Get SOL price in USD
- Uses Binance API
- Returns number (0 on error)

```typescript
const solPrice = await external.getSolPriceUsd();
console.log(`1 SOL = $${solPrice}`);
```

---

### 3. **Token Service** (`token.service.ts`)

High-level token data aggregation. Combines multiple sources.

#### Functions:

**`getTokenInfo(mint)`**
- Aggregate token information
- Parallel fetching from multiple sources
- Returns enriched TokenInfo

```typescript
import * as tokenService from "@/services/token.service";

const info = await tokenService.getTokenInfo(mintAddress);
console.log({
  name: info.name,
  symbol: info.symbol,
  price: info.price,
  supply: info.supply,
});
```

**Data Sources:**
- Helius RPC → decimals, supply
- Jupiter → price
- DAS API → metadata, logo

**`getTokenPairs(mint)`**
- Wrapper for DexScreener pairs
- Same as `external.getDexScreenerPairs()`

**`getSolPrice()`**
- Wrapper for SOL price
- Same as `external.getSolPriceUsd()`

---

## Usage Examples

### Example 1: Fetch Token Info in API Route

```typescript
// src/app/api/token/[address]/route.ts
import * as tokenService from "@/services/token.service";
import { validateTokenAddress } from "@/lib/validation";
import { logError } from "@/lib/error-logger";

export async function GET(req, ctx) {
  const { address } = await ctx.params;
  
  // Validate input
  const validation = validateTokenAddress(address);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  
  try {
    // Use service
    const info = await tokenService.getTokenInfo(address);
    return Response.json({ token: info });
  } catch (error) {
    logError("Failed to fetch token info", error, { address });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Example 2: Parallel Data Fetching

```typescript
import * as helius from "@/services/helius.service";
import * as external from "@/services/external.service";

// Fetch all data in parallel
const [account, metadata, price, solPrice] = await Promise.allSettled([
  helius.getAccountInfo(mint),
  helius.getAssetMetadata(mint),
  external.getJupiterPrice(mint),
  external.getSolPriceUsd(),
]);

// Handle results
if (account.status === "fulfilled") {
  const decimals = account.value?.data?.parsed?.info?.decimals;
}

if (price.status === "fulfilled" && price.value) {
  console.log(`Price: $${price.value}`);
}
```

### Example 3: Error Handling

```typescript
import * as helius from "@/services/helius.service";
import { logError } from "@/lib/error-logger";

try {
  const account = await helius.getAccountInfo(address);
  // Process account data
} catch (error) {
  // Errors are already logged by the service
  // Just handle the failure case
  return { error: "Failed to fetch account" };
}
```

---

## Configuration

All service configurations are centralized in `src/config/index.ts`:

```typescript
export const API_CONFIG = {
  helius: {
    rpc: `https://mainnet.helius-rpc.com/?api-key=${ENV.heliusApiKey}`,
    api: "https://api.helius.xyz/v0",
    timeout: 5_000,  // 5 seconds
  },
  external: {
    dexscreener: "https://api.dexscreener.com/latest/dex",
    jupiter: "https://api.jup.ag/price/v2",
    binance: "https://api.binance.com/api/v3",
    timeout: 6_000,  // 6 seconds
  },
};
```

---

## Error Handling

All service functions:
- ✅ Catch errors automatically
- ✅ Log via `logError()` utility
- ✅ Return null/empty on failure (no throw)
- ✅ Include timeout protection

**Example:**
```typescript
// Service handles errors internally
const price = await external.getJupiterPrice(mint);

// No need for try-catch, just check for null
if (price !== null) {
  // Use price
} else {
  // Fallback to another source
}
```

---

## Testing Services

### Mocking in Tests

```typescript
// test.ts
import { vi, describe, it, expect } from "vitest";
import * as helius from "@/services/helius.service";

// Mock the entire module
vi.mock("@/services/helius.service", () => ({
  getAccountInfo: vi.fn(),
  getAssetMetadata: vi.fn(),
}));

describe("MyComponent", () => {
  it("should fetch token data", async () => {
    // Setup mock
    vi.mocked(helius.getAccountInfo).mockResolvedValue({
      value: { data: { parsed: { info: { decimals: 9 } } } },
    });
    
    // Test your code
    const result = await myFunction();
    
    // Assert
    expect(helius.getAccountInfo).toHaveBeenCalledWith("DezX...");
    expect(result.decimals).toBe(9);
  });
});
```

---

## Adding New Services

### Step 1: Create Service File

```typescript
// src/services/mynew.service.ts
import { API_CONFIG } from "@/config";
import { logError } from "@/lib/error-logger";

export async function getMyData(id: string): Promise<MyData | null> {
  try {
    const res = await fetch(`https://api.example.com/data/${id}`, {
      signal: AbortSignal.timeout(API_CONFIG.external.timeout),
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    logError("Failed to fetch my data", error, { id });
    return null;
  }
}
```

### Step 2: Add Config (Optional)

```typescript
// src/config/index.ts
export const API_CONFIG = {
  // ...existing...
  mynew: {
    baseUrl: "https://api.example.com",
    timeout: 5_000,
  },
};
```

### Step 3: Use in API Route

```typescript
// src/app/api/myroute/route.ts
import * as mynewService from "@/services/mynew.service";

export async function GET() {
  const data = await mynewService.getMyData("123");
  return Response.json({ data });
}
```

---

## Best Practices

### 1. Always Use Timeouts

```typescript
// ✅ GOOD
fetch(url, { signal: AbortSignal.timeout(5000) });

// ❌ BAD
fetch(url); // Can hang forever
```

### 2. Always Log Errors

```typescript
// ✅ GOOD
try {
  // ...
} catch (error) {
  logError("Failed to fetch", error, { context });
  return null;
}

// ❌ BAD
try {
  // ...
} catch (error) {
  console.error(error); // Inconsistent logging
  throw error; // Don't throw from services
}
```

### 3. Return Null on Error (Don't Throw)

```typescript
// ✅ GOOD
export async function getData(): Promise<Data | null> {
  try {
    // ...
  } catch {
    return null;
  }
}

// ❌ BAD
export async function getData(): Promise<Data> {
  try {
    // ...
  } catch (error) {
    throw error; // Forces every caller to use try-catch
  }
}
```

### 4. Use Parallel Fetching

```typescript
// ✅ GOOD - Parallel (fast)
const [a, b, c] = await Promise.allSettled([
  serviceA.getData(),
  serviceB.getData(),
  serviceC.getData(),
]);

// ❌ BAD - Sequential (slow)
const a = await serviceA.getData();
const b = await serviceB.getData();
const c = await serviceC.getData();
```

### 5. Type Your Returns

```typescript
// ✅ GOOD
export async function getData(id: string): Promise<MyData | null> {
  // ...
}

// ❌ BAD
export async function getData(id) {
  // ...
}
```

---

## Performance Tips

1. **Use `Promise.allSettled()` for parallel calls**
   - Faster than sequential
   - One failure doesn't block others

2. **Add timeouts to all external calls**
   - Prevents hanging requests
   - Better user experience

3. **Cache when possible**
   - SOL price changes slowly (cache 1 min)
   - Token metadata rarely changes (cache longer)

4. **Deduplicate requests**
   - React Query handles this at hook level
   - Service layer focuses on fetching

---

## Troubleshooting

### Problem: Service times out

**Solution:**
1. Check if API is down
2. Increase timeout in `src/config/index.ts`
3. Add retry logic if needed

### Problem: Getting null responses

**Solution:**
1. Check error logs (services log automatically)
2. Test API endpoint directly
3. Verify API key is valid

### Problem: Slow responses

**Solution:**
1. Use `Promise.allSettled()` for parallel calls
2. Check network latency
3. Consider caching frequently-accessed data

---

## Migration from Old Code

**Before (scattered fetch calls):**
```typescript
const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${key}`, {
  method: "POST",
  body: JSON.stringify({ method: "getAccountInfo", params: [address] }),
});
```

**After (service layer):**
```typescript
import * as helius from "@/services/helius.service";
const account = await helius.getAccountInfo(address);
```

**Benefits:**
- ✅ Less boilerplate
- ✅ Automatic error handling
- ✅ Consistent timeouts
- ✅ Easy to mock for tests

---

## Related Documentation

- **Configuration:** `src/config/index.ts`
- **Error Logging:** `src/lib/error-logger.ts`
- **Architecture:** `ARCHITECTURE.md`
- **Migration Guide:** `MIGRATION_GUIDE.md`

**Last Updated:** June 2026
