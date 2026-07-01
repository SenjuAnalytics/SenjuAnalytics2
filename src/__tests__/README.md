# 🧪 Testing Guide

## Overview

This directory contains all tests for the Senju project. We use **Vitest** as our testing framework with **Testing Library** for component tests.

---

## Structure

```
__tests__/
├── setup.ts              # Global test configuration
├── lib/                  # Unit tests for lib/
│   ├── formatters.test.ts
│   └── validation.test.ts
├── components/           # Component tests (TODO)
├── services/             # Service tests (TODO)
└── integration/          # Integration tests (TODO)
```

---

## Running Tests

### Watch Mode (Development)
```bash
npm test
```

Runs tests in watch mode. Tests re-run when files change.

### Single Run (CI/CD)
```bash
npm run test:run
```

Runs all tests once and exits.

### With Coverage
```bash
npm run test:coverage
```

Generates coverage report in `coverage/` directory.

### Interactive UI
```bash
npm run test:ui
```

Opens Vitest UI in browser for interactive testing.

---

## Writing Tests

### Unit Test Template

```typescript
// src/__tests__/lib/myfeature.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/myfeature";

describe("myFunction", () => {
  it("should handle valid input", () => {
    const result = myFunction("valid");
    expect(result).toBe("expected");
  });

  it("should handle invalid input", () => {
    const result = myFunction("");
    expect(result).toBe(null);
  });

  it("should handle edge cases", () => {
    expect(myFunction(null)).toBe(null);
    expect(myFunction(undefined)).toBe(null);
  });
});
```

### Component Test Template

```typescript
// src/__tests__/components/MyComponent.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const { user } = render(<MyComponent />);
    const button = screen.getByRole("button");
    await user.click(button);
    // Assert expected behavior
  });
});
```

### Service Test Template (with Mocks)

```typescript
// src/__tests__/services/myservice.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as myService from "@/services/myservice.service";

// Mock fetch
global.fetch = vi.fn();

describe("myService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch data successfully", async () => {
    // Setup mock
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" }),
    } as Response);

    // Call service
    const result = await myService.getData();

    // Assert
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api"));
    expect(result).toEqual({ data: "test" });
  });

  it("should handle errors", async () => {
    // Setup mock error
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    // Call service
    const result = await myService.getData();

    // Assert
    expect(result).toBe(null); // Services return null on error
  });
});
```

---

## Test Categories

### Unit Tests (`lib/`)

Test pure functions in isolation.

**What to test:**
- ✅ Input/output behavior
- ✅ Edge cases
- ✅ Error handling
- ✅ Type guards
- ✅ Validation logic

**Example:**
```typescript
// Testing formatter
describe("formatUsd", () => {
  it("formats large amounts", () => {
    expect(formatUsd(1_500_000)).toBe("$1.50M");
  });

  it("handles invalid input", () => {
    expect(formatUsd(NaN)).toBe("—");
  });
});
```

### Component Tests (`components/`)

Test React components.

**What to test:**
- ✅ Rendering
- ✅ User interactions
- ✅ Props handling
- ✅ Conditional rendering
- ✅ Accessibility

**Example:**
```typescript
describe("StatCard", () => {
  it("renders value correctly", () => {
    render(<StatCard title="Price" value="$1.50" />);
    expect(screen.getByText("$1.50")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<StatCard title="Price" value="$1.50" isLoading />);
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });
});
```

### Service Tests (`services/`)

Test service layer with mocked external calls.

**What to test:**
- ✅ API calls made correctly
- ✅ Data transformation
- ✅ Error handling
- ✅ Timeout behavior
- ✅ Return values

### Integration Tests (`integration/`)

Test multiple units working together.

**What to test:**
- ✅ API route responses
- ✅ Data flow through layers
- ✅ Real-world scenarios

---

## Current Test Coverage

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
lib/formatters.ts      |   100   |   100    |   100   |   100
lib/validation.ts      |   95    |   90     |   100   |   95
```

**Goal:** >80% coverage for all modules

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad - tests implementation
it("should call setState with new value", () => {
  const setState = vi.fn();
  // ...
  expect(setState).toHaveBeenCalledWith("new");
});

// ✅ Good - tests behavior
it("should update displayed value", () => {
  render(<MyComponent />);
  user.click(screen.getByRole("button"));
  expect(screen.getByText("new value")).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it("works", () => { ... });

// ✅ Good
it("should return null when address is invalid", () => { ... });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it("should validate token address", () => {
  // Arrange
  const address = "DezXAZ...";

  // Act
  const result = validateTokenAddress(address);

  // Assert
  expect(result.valid).toBe(true);
});
```

### 4. Test Edge Cases

```typescript
describe("formatNumber", () => {
  it("handles normal numbers", () => { ... });
  it("handles zero", () => { ... });
  it("handles negative numbers", () => { ... });
  it("handles very large numbers", () => { ... });
  it("handles NaN", () => { ... });
  it("handles null/undefined", () => { ... });
});
```

### 5. Mock External Dependencies

```typescript
// Mock fetch globally
global.fetch = vi.fn();

// Mock specific module
vi.mock("@/services/helius.service", () => ({
  getAccountInfo: vi.fn(),
}));
```

---

## Common Matchers

```typescript
// Equality
expect(value).toBe(expected);              // Strict equality
expect(value).toEqual(expected);           // Deep equality
expect(value).toStrictEqual(expected);     // Strict deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeLessThan(5);
expect(number).toBeCloseTo(0.3);          // Float comparison

// Strings
expect(string).toContain("substring");
expect(string).toMatch(/regex/);

// Arrays/Objects
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty("key", value);

// DOM (Testing Library)
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveTextContent("text");
expect(element).toHaveAttribute("aria-label", "label");
```

---

## Mocking Guide

### Mock Function

```typescript
const mockFn = vi.fn();

// Setup return value
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ data: "test" });

// Assert calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith("arg");
```

### Mock Module

```typescript
vi.mock("@/services/helius.service", () => ({
  getAccountInfo: vi.fn(),
  getAssetMetadata: vi.fn(),
}));

// Use in test
import * as helius from "@/services/helius.service";
vi.mocked(helius.getAccountInfo).mockResolvedValue({ ... });
```

### Mock Fetch

```typescript
global.fetch = vi.fn();

vi.mocked(fetch).mockResolvedValue({
  ok: true,
  json: async () => ({ data: "test" }),
} as Response);
```

---

## Debugging Tests

### Run Specific Test

```bash
# Run one file
npm test -- formatters.test.ts

# Run one test
npm test -- -t "should format USD"
```

### Debug with Console

```typescript
it("should work", () => {
  const result = myFunction("input");
  console.log("Result:", result);  // Shows in test output
  expect(result).toBe("expected");
});
```

### Debug with Debugger

```typescript
it("should work", () => {
  debugger;  // Pauses execution if debugging
  const result = myFunction("input");
  expect(result).toBe("expected");
});
```

---

## Testing Checklist

Before committing:

- [ ] All tests pass (`npm run test:run`)
- [ ] Coverage >80% for new code
- [ ] Edge cases tested
- [ ] Error cases tested
- [ ] Async code properly tested
- [ ] Mocks cleaned up between tests
- [ ] No skipped tests (`it.skip`)
- [ ] No focused tests (`it.only`)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

---

## FAQ

### Q: How do I test async functions?

**A:** Use `async/await`:
```typescript
it("should fetch data", async () => {
  const result = await myAsyncFunction();
  expect(result).toBe("expected");
});
```

### Q: How do I test error throwing?

**A:** Use `expect().toThrow()`:
```typescript
it("should throw error", () => {
  expect(() => myFunction()).toThrow("Error message");
});
```

### Q: How do I test timers?

**A:** Use `vi.useFakeTimers()`:
```typescript
it("should delay", () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  setTimeout(callback, 1000);
  
  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
  
  vi.useRealTimers();
});
```

### Q: Tests are slow. How to speed up?

**A:** 
- Run fewer tests during development
- Mock external calls
- Use `it.concurrent` for independent tests
- Avoid unnecessary async operations

---

## Resources

- **Vitest Docs:** https://vitest.dev
- **Testing Library:** https://testing-library.com
- **Vitest Examples:** https://github.com/vitest-dev/vitest/tree/main/examples

---

## Next Steps

### TODO: Add More Tests

Priority areas for testing:

1. **Components** (`components/`)
   - [ ] StatCard
   - [ ] AddressDisplay
   - [ ] EmptyState
   - [ ] DataTable

2. **Services** (`services/`)
   - [ ] helius.service
   - [ ] external.service
   - [ ] token.service

3. **Hooks** (`hooks/`)
   - [ ] useTokenData

4. **API Routes** (`app/api/`)
   - [ ] Token info endpoint
   - [ ] Fee claims endpoint
   - [ ] Liquidity endpoint

---

**Last Updated:** June 9, 2026  
**Current Tests:** 30  
**Coverage Goal:** 80%
