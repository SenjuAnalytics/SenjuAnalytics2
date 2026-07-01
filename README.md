# 🔍 Senju — Solana Token Analytics Dashboard

<div align="center">

![Senju Logo](public/images/senju2.jpg)

**Advanced on-chain analytics for Solana tokens**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Live Demo](#) • [Documentation](#features) • [Report Bug](https://github.com/SenjuAnalytics/SenjuAnalytics2/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Platform Support](#platform-support)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**Senju** is a comprehensive analytics dashboard for Solana tokens that provides real-time insights into:

- 🔒 **Token Locks** — Track locks from Streamflow, Unloc, Fluxbeam, and more
- 💰 **Fee Claims** — Monitor creator fees from Raydium, PumpSwap, Pump.fun
- 💧 **Liquidity Pools** — Analyze DEX pairs across 10+ platforms
- 🔥 **Burns & Buybacks** — Real-time burn and buyback transaction history
- 🤖 **Agent Mode** — Advanced revenue tracking for AI agent tokens

Built with Next.js 16, TypeScript, and Tailwind CSS, Senju delivers a fast, responsive, and beautiful user experience.

---

## ✨ Features

### 🎯 Core Analytics

- **Token Overview**
  - Real-time price, market cap, volume, and supply
  - 24-hour price charts with Recharts
  - Bonding curve progress tracking (Pump.fun)
  - Launch platform detection (15+ platforms)

- **Liquidity Analysis**
  - Multi-DEX pool aggregation
  - SOL liquidity tracking
  - 24h volume and fees
  - APR calculations

- **Token Lock Detection**
  - On-chain lock reading via `getProgramAccounts`
  - Streamflow, Unloc, Fluxbeam support
  - Vesting schedule visualization
  - Lock status tracking (active/unlocked)

- **Fee Claim Tracking**
  - Creator fee detection (PumpSwap, Raydium, Pump.fun)
  - Multi-mode support: Creator, Cashback, Mayhem, Agent
  - Vault address identification
  - Historical claim records with USD values

- **Burn & Buyback**
  - Automatic burn detection
  - Agent buyback tracking
  - Transaction history with timestamps

### 🎨 UI/UX

- **Modern Design**
  - Dark theme with teal/green accents
  - Glassmorphism effects
  - Smooth animations and transitions
  - Responsive mobile-first layout

- **Performance**
  - React Query for data caching
  - Skeleton loading states
  - Optimistic UI updates
  - Error boundaries for graceful failures

---

## 🛠 Tech Stack

### Frontend
- **Framework:** [Next.js 16.2.3](https://nextjs.org/) (App Router)
- **Language:** [TypeScript 5.9](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4.2](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand 5.0](https://zustand-demo.pmnd.rs/)
- **Data Fetching:** [TanStack Query 5.95](https://tanstack.com/query)
- **Charts:** [Recharts 3.8](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Blockchain
- **Solana SDK:** [@solana/web3.js 1.98](https://solana-labs.github.io/solana-web3.js/)
- **Solana v2:** [@solana/web3.js 2.0](https://github.com/solana-labs/solana-web3.js/tree/master/packages)
- **RPC Provider:** [Helius](https://helius.dev/)

### Data Sources
- **Helius API** — Token metadata, transactions, on-chain data
- **DexScreener API** — DEX pairs, liquidity, price data
- **Jupiter API** — Real-time token prices

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (recommended: 20.x LTS)
- **npm** 10+ or **pnpm** 8+
- **Helius API Key** ([Get one free](https://helius.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SenjuAnalytics/SenjuAnalytics2.git
   cd SenjuAnalytics2
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   HELIUS_API_KEY=your_helius_api_key_here
   NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

### Quick Test

Try searching for these example tokens:
- **BONK:** `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- **JUP:** `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **RAY:** `4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R`

---

## 📁 Project Structure

```
senju/
├── public/
│   ├── images/          # Logo and branding assets
│   └── platforms/       # Platform icons (Pump.fun, Raydium, etc.)
├── src/
│   ├── app/
│   │   ├── api/         # API routes (Next.js Route Handlers)
│   │   │   └── token/[address]/
│   │   │       ├── route.ts           # Token info
│   │   │       ├── fees/route.ts      # Fee claims
│   │   │       ├── liquidity/route.ts # Liquidity pools
│   │   │       ├── locks/route.ts     # Token locks
│   │   │       └── burns/route.ts     # Burn records
│   │   ├── token/[address]/
│   │   │   └── page.tsx # Token detail page
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Home page
│   │   └── globals.css  # Global styles
│   ├── components/
│   │   ├── common/      # Reusable components
│   │   ├── dashboard/   # Tab components (Overview, Liquidity, etc.)
│   │   ├── icons/       # Custom icon components
│   │   ├── layout/      # Layout components (Navbar)
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   ├── fees/        # Fee detection system
│   │   │   ├── modes/   # Fee modes (Creator, Cashback, Agent)
│   │   │   └── sources/ # Per-DEX fee detectors
│   │   ├── locks/       # Lock detection (Streamflow, etc.)
│   │   ├── platforms/   # Platform detection (15+ platforms)
│   │   ├── api.ts       # API client functions
│   │   ├── constants.ts # App-wide constants
│   │   ├── formatters.ts# Number/date formatters
│   │   └── utils.ts     # Utility functions
│   ├── providers/       # React context providers
│   ├── types/           # TypeScript type definitions
│   └── ...
├── .env.local           # Environment variables (DO NOT COMMIT)
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

---

## 🔌 API Integration

### Helius RPC & API

Senju uses Helius for:
- Token metadata (DAS API)
- Transaction history
- Account data
- On-chain program reads

**Rate Limits:**
- Free tier: 100 req/s
- Paid tiers: Higher limits + enhanced features

### DexScreener API

Used for:
- DEX pair discovery
- Liquidity data
- Price feeds
- Trading volume

**Rate Limits:**
- Public API: No auth required
- Fair use policy applies

### Jupiter Price API

Used for:
- Real-time token prices
- Fallback price source

**Rate Limits:**
- Public API: No auth required
- 600 req/min recommended

---

## 🎯 Platform Support

Senju detects and displays launch platforms for tokens:

| Platform | Detection Method | Features |
|----------|-----------------|----------|
| **Pump.fun** | Bonding curve + metadata | Bonding curve progress, graduation tracking |
| **PumpSwap** | Pool detection | Creator fees, liquidity tracking |
| **Raydium** | Pool detection | CLMM & AMM support, fee claims |
| **Moonshot** | Metadata URI | Platform badge |
| **Virtuals** | Metadata URI | AI agent detection |
| **Believe** | Metadata URI | Platform badge |
| **Boop** | Metadata URI | Platform badge |
| **Heaven** | Metadata URI | Platform badge |
| **LaunchLab** | Metadata URI | Platform badge |
| **LetsBonk** | Metadata URI | Platform badge |
| **Meteora** | Pool detection | Fee tracking |
| **Fluxbeam** | Metadata URI | Platform badge |
| **Bags** | Metadata URI | Platform badge |
| **MoonIt** | Metadata URI | Platform badge |

---

## 💻 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Code Style

- **ESLint** for linting
- **TypeScript** for type safety
- **Prettier** (recommended) for formatting

### Adding New Features

1. **New Platform Detection**
   - Add detector to `src/lib/platforms/`
   - Register in `src/lib/platforms/index.ts`
   - Add icon to `public/platforms/`

2. **New Fee Source**
   - Create detector in `src/lib/fees/sources/`
   - Register in `src/lib/fees/index.ts`

3. **New Lock Program**
   - Add detector to `src/lib/locks/`
   - Register in `src/lib/locks/index.ts`

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables
   - Deploy!

### Environment Variables

Required for production:
```env
HELIUS_API_KEY=your_production_key
NEXT_PUBLIC_HELIUS_API_KEY=your_production_key
```

### Build Optimization

- Automatic code splitting
- Image optimization with Next.js Image
- Static generation where possible
- API route caching (coming soon)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write TypeScript (no `any` types)
- Follow existing code style
- Add comments for complex logic
- Test your changes locally
- Update documentation if needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Helius** for excellent Solana RPC infrastructure
- **DexScreener** for comprehensive DEX data
- **Jupiter** for reliable price feeds
- **shadcn/ui** for beautiful UI components
- **Solana Foundation** for the amazing blockchain

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/SenjuAnalytics/SenjuAnalytics2/issues)
- **Discussions:** [GitHub Discussions](https://github.com/SenjuAnalytics/SenjuAnalytics2/discussions)

---

<div align="center">

**Built with ❤️ for the Solana community**

[⬆ Back to Top](#-senju--solana-token-analytics-dashboard)

</div>
