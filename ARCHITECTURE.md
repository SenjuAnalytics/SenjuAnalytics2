# 🏗️ Senju Architecture Documentation

## Overview

Senju follows a **layered architecture** with clear separation of concerns, emphasizing modularity, testability, and maintainability.

## Project Structure

```
senju/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes (Route Handlers)
│   │   ├── token/          # Token detail pages
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   │
│   ├── components/          # React Components
│   │   ├── common/         # Reusable components
│   │   ├── dashboard/      # Feature-specific components
│   │   ├── icons/          # Icon components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Base UI components (shadcn)
│   │
│   ├── config/              # ⭐ NEW: Configuration management
│   │   └── index.ts        # Centralized config & env vars
│   │
│   ├── services/            # ⭐ NEW: Service layer (API integrations)
│   │   ├── helius.service.ts    # Helius RPC/API
│   │   ├── external.service.ts  # External APIs (DexScreener, Jupiter)
│   │   └── token.service.ts     # Token data aggregation
│   │
│   ├── lib/                 # Business logic & utilities
│   │   ├── fees/           # Fee detection system
│   │   │   ├── modes/      # Fee modes (creator, cashback, agent)
│   │   │   └── sources/    # Per-DEX fee detectors
│   │   ├── locks/          # Lock detection
│   │   ├── platforms/      # Platform detection
│   │   ├── accessibility.ts # ⭐ NEW: A11y utilities
│   │   ├── constants.ts    # ✅ IMPROVED: Better organization
│   │   ├── error-logger.ts # Error logging
│   │   ├── formatters.ts   # Number/date formatters
│   │   ├── rate-limit.ts   # ⭐ NEW: Rate limiting
│   │   ├── theme.ts        # ⭐ NEW: Theme & color system
│   │   ├── validation.ts   # ⭐ NEW: Input validation
│   │   └── utils.ts        # General utilities
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useTokenData.ts # Token data fetching
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── token.ts        # Token-related types
│   │
│   ├── providers/           # React context providers
│   │   └── QueryProvider.tsx # React Query provider
│   │
│   └── __tests__/           # ⭐ NEW: Test suite
│       ├── lib/            # Unit tests for lib/
│       ├── components/     # Component tests
│       └── setup.ts        # Test configuration
│
├── public/                  # Static assets
│   ├── images/             # Branding assets
│   └── platforms/          # Platform icons
│
├── vitest.config.ts         # ⭐ NEW: Test configuration
└── ARCHITECTURE.md          # ⭐ NEW: This file
```

---

## Architecture Layers

### 1. **Presentation Layer** (`src/app`, `src/components`)

**Responsibility:** UI rendering and user interactions

**Components:**
- `app/` - Next.js pages and API routes
- `components/common/` - Reusable UI components
- `components/dashboard/` - Feature-specific components

**Rules:**
- ✅ Can use hooks from `src/hooks`
- ✅ Can import from `src/lib` (formatters, utils)
- ❌ Cannot import directly from `src/services` (use hooks instead)

---

### 2. **Service Layer** (`src/services`) ⭐ NEW

**Responsibility:** External API communication and data fetching

**Files:**
- `helius.service.ts` - Helius RPC/API calls
- `external.service.ts` - Third-party APIs (DexScreener, Jupiter)
- `token.service.ts` - High-level token data aggregation

**Benefits:**
- ✅ Centralized API logic
- ✅ Easy to mock for testing
- ✅ Single source of truth for external calls
- ✅ Timeout and error handling in one place

**Example:**
```typescript
// Before (scattered in api.ts)
const res = await fetch(`https://api.helius.xyz/...`);

// After (centralized service)
import * as helius from "@/services/helius.service";
const result = await helius.getAccountInfo(address);
```

---

### 3. **Business Logic Layer** (`src/lib`)

**Responsibility:** Business rules, calculations, and domain logic

**Modules:**
- `fees/` - Fee detection system (plugin architecture)
- `locks/` - Lock detection system (extensible)
- `platforms/` - Platform detection (registry pattern)
- `formatters.ts` - Data formatting
- `validation.ts` - Input validation ⭐ NEW
- `theme.ts` - Design system constants ⭐ NEW

**Patterns Used:**
- **Registry Pattern** - Platform/fee source registration
- **Plugin Architecture** - Easy to add new platforms/DEXes
- **Pure Functions** - Easy to test

---

### 4. **Configuration Layer** (`src/config`) ⭐ NEW

**Responsibility:** Centralized configuration management

**Benefits:**
- ✅ Single source of truth for env vars
- ✅ Type-safe configuration
- ✅ Validation on startup
- ✅ No scattered `process.env` calls

**Example:**
```typescript
// Before
const apiKey = process.env.HELIUS_API_KEY || "";

// After
import { ENV } from "@/config";
const apiKey = ENV.heliusApiKey;
```

---

## Key Design Patterns

### 1. **Plugin/Registry Pattern**

Used for extensible systems (platforms, fee sources, locks).

**Benefits:**
- Add new platform in 5 minutes
- No changes to existing code
- Easy to test in isolation

**Example:**
```typescript
// Register new fee source
export const newDexFeeSource: FeeSource = {
  id: "newdex",
  name: "New DEX",
  getFeeClaims: async (mint) => { /* ... */ },
};

// Add to registry
const SOURCES: FeeSource[] = [
  pumpswapFeeSource,
  raydiumFeeSource,
  newDexFeeSource, // ✅ That's it!
];
```

### 2. **Service Layer Pattern**

Separates external API calls from business logic.

**Benefits:**
- Easy to mock for testing
- Centralized timeout/error handling
- Single responsibility principle

### 3. **Repository Pattern**

Used in hooks (`useTokenData.ts`) - abstracts data fetching.

**Benefits:**
- Components don't know about APIs
- Easy to swap data sources
- Caching handled transparently (React Query)

---

## Data Flow

```
User Action (UI)
    ↓
Component Event Handler
    ↓
Custom Hook (useTokenData)
    ↓
API Route (/api/token/[address])
    ↓
Service Layer (token.service.ts)
    ↓
External APIs (Helius, DexScreener, etc.)
    ↓
Service Layer (transform data)
    ↓
API Route (detect platform, enrich data)
    ↓
Custom Hook (cache with React Query)
    ↓
Component (render UI)
```

---

## Security Improvements ⭐

### Before:
```env
NEXT_PUBLIC_HELIUS_API_KEY=xxx  # ❌ Exposed to client!
```

### After:
```env
HELIUS_API_KEY=xxx  # ✅ Server-side only
```

**Changes:**
1. Remove `NEXT_PUBLIC_` prefix
2. All RPC calls go through API routes (server-side)
3. Rate limiting added to prevent abuse

---

## Testing Strategy ⭐ NEW

### Unit Tests
- `src/__tests__/lib/` - Pure function tests
- Coverage goal: >80% for utils

### Integration Tests (TODO)
- API route testing
- Service layer mocking

### E2E Tests (TODO)
- Critical user flows
- Platform detection accuracy

**Run tests:**
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
```

---

## Adding New Features

### Adding a New Platform

1. **Create detector** in `src/lib/platforms/newplatform.ts`:
```typescript
export const newplatform: PlatformDef = {
  id: "newplatform",
  name: "New Platform",
  color: "#ff0000",
  detect: async (ctx) => {
    // Detection logic
    return ctx.dexIds.includes("newplatform");
  },
};
```

2. **Register** in `src/lib/platforms/index.ts`:
```typescript
export const PLATFORMS: PlatformDef[] = [
  // ...
  newplatform,
];
```

3. **Add icon** to `public/platforms/newplatform.png`

4. **Done!** No other files need changes.

### Adding a New Fee Source

1. **Create source** in `src/lib/fees/sources/newdex.ts`:
```typescript
export const newdexFeeSource: FeeSource = {
  id: "newdex",
  name: "New DEX",
  getFeeClaims: async (mint) => {
    // Fee detection logic
    return [];
  },
};
```

2. **Register** in `src/lib/fees/index.ts`:
```typescript
const SOURCES: FeeSource[] = [
  // ...
  newdexFeeSource,
];
```

3. **Done!**

---

## Performance Optimizations

1. **Parallel API Calls**
   ```typescript
   const [a, b, c] = await Promise.allSettled([
     fetchA(), fetchB(), fetchC()
   ]);
   ```

2. **Request Timeouts**
   ```typescript
   fetch(url, { signal: AbortSignal.timeout(5000) })
   ```

3. **React Query Caching**
   ```typescript
   staleTime: 30_000 // 30 seconds
   ```

4. **Deduplication**
   ```typescript
   // Remove duplicate transactions/records
   const seen = new Set();
   return all.filter(r => !seen.has(r.id) && seen.add(r.id));
   ```

---

## Accessibility (A11y) ⭐ NEW

All components now include:
- ✅ `aria-label` for screen readers
- ✅ `aria-describedby` for errors
- ✅ `role` attributes
- ✅ Keyboard navigation support

**Utilities:**
```typescript
import { getAriaLabel, getLoadingAriaAttrs } from "@/lib/accessibility";

<div {...getLoadingAriaAttrs(isLoading)}>
  <input aria-label={getAriaLabel("Token address", address)} />
</div>
```

---

## Environment Variables

### Required (Production)
```env
HELIUS_API_KEY=your_key_here
```

### Optional
```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

---

## Future Improvements

### High Priority
- [ ] Add integration tests for API routes
- [ ] Implement request caching (Redis)
- [ ] Add monitoring (Sentry)

### Medium Priority
- [ ] Add more lock program detectors
- [ ] Implement WebSocket for real-time data
- [ ] Add user preferences (localStorage)

### Low Priority
- [ ] Dark/light theme toggle
- [ ] Export data to CSV
- [ ] Advanced filtering

---

## Contributing

When adding new code, follow these principles:

1. **Modularity** - Each file should have a single responsibility
2. **Testability** - Write pure functions when possible
3. **Accessibility** - Add ARIA labels to interactive elements
4. **Documentation** - Add JSDoc comments for complex logic
5. **Type Safety** - No `any` types, use proper TypeScript
6. **Error Handling** - Use `logError` utility consistently

---

## Questions?

Check existing code for patterns, or refer to:
- `CONTRIBUTING.md` (TODO)
- `API_DOCUMENTATION.md` (existing)
- GitHub Issues

**Last Updated:** June 2026
