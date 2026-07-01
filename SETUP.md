# 🚀 Senju - Setup & Installation Guide

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- ✅ **npm** 10.x or higher (comes with Node.js)
- ✅ **Git** (for cloning)
- ✅ **Helius API Key** ([Get free key](https://helius.dev/))

---

## Quick Start (5 Minutes)

```bash
# 1. Navigate to project directory
cd c:\Users\shole\OneDrive\Desktop\senju2

# 2. Install dependencies
npm install

# 3. Setup environment (already done, just verify)
# Check that .env.local exists and has HELIUS_API_KEY

# 4. Run tests (verify everything works)
npm run test:run

# 5. Start development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Detailed Installation

### Step 1: Install Dependencies

The project uses these main dependencies:

```bash
npm install
```

**Main Dependencies:**
- `next@16.2.3` - Next.js framework
- `react@19.2.4` - React library
- `@solana/web3.js` - Solana SDK
- `@tanstack/react-query` - Data fetching
- `recharts` - Charts
- `tailwindcss@4` - Styling

**Dev Dependencies:**
- `vitest` - Testing framework
- `@testing-library/react` - Component testing
- `typescript` - Type safety

---

### Step 2: Environment Setup

#### **Option A: Using Existing .env.local** ✅

Your `.env.local` is already configured:

```env
# Server-side only - never expose to client
HELIUS_API_KEY=7aa6295f-7ad0-4f83-a8ca-03f1906c70bc

# Optional: Add rate limiting config
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

**Verify it's correct:**
```bash
# Check if HELIUS_API_KEY is set (without NEXT_PUBLIC_ prefix)
type .env.local
```

#### **Option B: Create New .env.local**

If you need to recreate it:

```bash
# Create file
New-Item -Path .env.local -ItemType File

# Add content (replace YOUR_KEY with actual key)
@"
HELIUS_API_KEY=YOUR_KEY_HERE
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
"@ | Set-Content .env.local
```

---

### Step 3: Verify Installation

#### **A. Type Check**

```bash
npm run type-check
```

Expected output: ✅ No errors

#### **B. Run Tests**

```bash
npm run test:run
```

Expected output:
```
✓ src/__tests__/lib/formatters.test.ts (18 tests)
✓ src/__tests__/lib/validation.test.ts (12 tests)

Test Files  2 passed (2)
Tests  30 passed (30)
```

#### **C. Build Check (Optional)**

```bash
npm run build
```

This will take a few minutes. Expected: ✅ Build successful

---

### Step 4: Start Development Server

```bash
npm run dev
```

Output:
```
▲ Next.js 16.2.3
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

---

## 🧪 Testing Your Setup

### 1. Open Application

Navigate to: [http://localhost:3000](http://localhost:3000)

You should see the Senju homepage with:
- ✅ Search box
- ✅ Feature cards
- ✅ Stats strip
- ✅ Data sources

### 2. Test Token Search

Try searching for these example tokens:

**BONK:**
```
DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

**JUP:**
```
JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN
```

**Expected Result:**
- ✅ Redirects to `/token/[address]`
- ✅ Shows token info
- ✅ Displays price, market cap
- ✅ Shows trading pairs

### 3. Test API Routes

#### Test Token Info Endpoint:

```bash
# Windows PowerShell
Invoke-WebRequest http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

# Should return JSON with token data
```

#### Test Rate Limiting:

```bash
# Make multiple requests quickly
1..150 | ForEach-Object {
  Invoke-WebRequest http://localhost:3000/api/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
}

# After ~100 requests, should get 429 (Too Many Requests)
```

---

## 🐛 Troubleshooting

### Problem: "Module not found"

**Solution:**
```bash
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Problem: "API key not found"

**Symptoms:**
- Empty token data
- Console errors about missing API key

**Solution:**
```bash
# Verify .env.local exists
Test-Path .env.local

# Check content
Get-Content .env.local

# Ensure it has HELIUS_API_KEY (NOT NEXT_PUBLIC_HELIUS_API_KEY)
```

### Problem: Tests failing

**Solution:**
```bash
# Clear test cache
Remove-Item -Recurse -Force .vitest

# Run tests again
npm run test:run
```

### Problem: Port 3000 already in use

**Solution:**
```bash
# Use different port
$env:PORT=3001; npm run dev

# Or kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problem: Slow build times

**Solution:**
```bash
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Rebuild
npm run build
```

---

## 📦 Project Scripts

```json
{
  "dev": "next dev",              // Start dev server
  "build": "next build",          // Production build
  "start": "next start",          // Start prod server
  "lint": "eslint",               // Run linter
  "test": "vitest",               // Run tests (watch)
  "test:ui": "vitest --ui",       // Interactive test UI
  "test:coverage": "vitest --coverage", // Coverage report
  "test:run": "vitest run",       // Single test run
  "type-check": "tsc --noEmit"    // TypeScript check
}
```

### Usage Examples:

```bash
# Development
npm run dev

# Testing
npm test                 # Watch mode
npm run test:run        # Single run
npm run test:coverage   # With coverage
npm run test:ui         # Interactive UI

# Production
npm run build
npm start

# Code Quality
npm run lint
npm run type-check
```

---

## 🔧 IDE Setup (Optional)

### VS Code Extensions (Recommended)

Install these extensions for better DX:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",      // ESLint
    "bradlc.vscode-tailwindcss",   // Tailwind IntelliSense
    "vitest.explorer",             // Vitest integration
    "ms-vscode.vscode-typescript-next" // TypeScript
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 🌐 Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `HELIUS_API_KEY` | Helius RPC API key | `7aa6295f-...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `false` |
| `NODE_ENV` | Environment | `development` |

---

## 📚 Next Steps

After successful setup:

1. **Read Documentation**
   - [ ] `ARCHITECTURE.md` - Understand structure
   - [ ] `MIGRATION_GUIDE.md` - Learn new patterns
   - [ ] `src/services/README.md` - Service layer guide

2. **Explore Code**
   - [ ] `src/app/page.tsx` - Home page
   - [ ] `src/app/token/[address]/page.tsx` - Token detail
   - [ ] `src/services/` - Service layer
   - [ ] `src/lib/` - Utilities

3. **Run Tests**
   - [ ] `npm test` - Watch mode
   - [ ] `npm run test:coverage` - Check coverage

4. **Try Adding Features**
   - [ ] Add new platform detector
   - [ ] Add new fee source
   - [ ] Create new component

---

## 🔒 Security Notes

### Important: Never Commit Secrets

Your `.gitignore` should include:

```gitignore
.env
.env.local
.env.*.local
```

**Verify:**
```bash
# Check if .env.local is ignored
git check-ignore .env.local

# Output should be: .env.local
```

### API Key Best Practices

- ✅ Use server-side only (no `NEXT_PUBLIC_` prefix)
- ✅ Rotate keys periodically
- ✅ Use different keys for dev/prod
- ✅ Enable rate limiting
- ❌ Never commit to Git
- ❌ Never expose in client-side code

---

## 📞 Getting Help

### Documentation

- **Architecture:** `ARCHITECTURE.md`
- **Migration:** `MIGRATION_GUIDE.md`
- **Services:** `src/services/README.md`
- **API Docs:** `API_DOCUMENTATION.md`

### Common Issues

1. Check `TROUBLESHOOTING.md` (if exists)
2. Search GitHub Issues
3. Check error logs in console

### Community

- GitHub Issues
- GitHub Discussions
- Twitter: @senju (if applicable)

---

## ✅ Setup Checklist

Use this checklist to verify your setup:

- [ ] Node.js 20+ installed
- [ ] Repository cloned/extracted
- [ ] `npm install` completed successfully
- [ ] `.env.local` file exists with `HELIUS_API_KEY`
- [ ] `npm run type-check` passes
- [ ] `npm run test:run` passes (30 tests)
- [ ] `npm run dev` starts successfully
- [ ] Can access http://localhost:3000
- [ ] Can search for tokens
- [ ] Token detail page loads
- [ ] API routes return data

**All checked?** You're ready to develop! 🎉

---

**Last Updated:** June 2026  
**Version:** 0.1.0  
**Maintained by:** Senju Team
