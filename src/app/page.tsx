"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Lock, Droplets, Flame, Coins,
  ArrowRight, TrendingUp, Shield, BarChart2, ExternalLink,
} from "lucide-react";
import { TEXT_MICRO, TEXT_DETAIL } from "@/lib/text";
import { TOKEN_STANDARDS } from "@/lib/constants";
import { THEME } from "@/lib/theme";
import { validateTokenAddress, sanitizeAddress } from "@/lib/validation";
import { getAriaLabel, getButtonAriaLabel } from "@/lib/accessibility";

const EXAMPLE_TOKENS = [
  { symbol: "BONK", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "JUP",  address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"  },
  { symbol: "RAY",  address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"  },
  { symbol: "WIF",  address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Token Lock",
    desc: "Auto-detect locks from Streamflow, Unloc & Fluxbeam programs.",
    color: THEME.colors.primary.cyan,
  },
  {
    icon: Coins,
    title: "Fee Claims",
    desc: "Track fee claims from Raydium, Orca & Meteora pools.",
    color: THEME.colors.status.success,
  },
  {
    icon: Droplets,
    title: "Liquidity",
    desc: "Full breakdown of all DEX pairs & liquidity pools.",
    color: THEME.colors.status.info,
  },
  {
    icon: Flame,
    title: "Burn & Buyback",
    desc: "Real-time burn & buyback transaction history.",
    color: THEME.colors.status.warning,
  },
];

const STATS = [
  { label: "DEX Supported", value: "10+", icon: BarChart2, color: THEME.colors.primary.cyan },
  { label: "Data Sources",  value: "3",   icon: Shield,    color: THEME.colors.status.success },
  { label: "Analytics",     value: "Live",icon: TrendingUp, color: THEME.colors.status.info },
  { label: "Lock Programs", value: "4+",  icon: Lock,      color: THEME.colors.status.warning },
];

const SOURCES = [
  { name: "Helius",      badge: "RPC + API",  desc: "Token metadata, transactions & on-chain data",          url: "https://helius.dev",        color: THEME.colors.primary.cyan },
  { name: "DexScreener", badge: "Price API",  desc: "DEX pairs, liquidity pools, price & volume data",       url: "https://dexscreener.com",   color: THEME.colors.status.success },
  { name: "Jupiter",     badge: "Aggregator", desc: "Real-time token prices across the Solana ecosystem",    url: "https://jup.ag",            color: THEME.colors.status.info },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery]     = useState("");
  const [error, setError]     = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const sanitized = sanitizeAddress(query);
    const validation = validateTokenAddress(sanitized);
    
    if (!validation.valid) {
      setError(validation.error || "Invalid token address");
      return;
    }
    
    setError("");
    router.push(`/token/${sanitized}`);
  }

  return (
    <div className="relative flex flex-col overflow-x-hidden">

      {/* ── ambient glow ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-60 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full opacity-[0.15] blur-3xl"
          style={{ background: "radial-gradient(circle, #14d4e8, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-60 h-[500px] w-[500px] rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(circle, #14F195, transparent 70%)" }} />
      </div>

      {/* ══════════════ HERO ══════════════ */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-20 pt-24 text-center sm:pt-32">

        {/* live badge */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F195] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F195]" />
          </span>
          Live on Solana Mainnet
        </div>

        {/* title */}
        <h1 className="mb-5 text-[2.75rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Token Analytics
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(120deg, #14d4e8 20%, #14F195 80%)" }}
          >
            on Solana
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-md text-[15px] leading-relaxed text-white/50">
          Token locks, fee claims, liquidity, burn &amp; buyback — all in one on-chain dashboard.
        </p>

        {/* ── search ── */}
        <form onSubmit={handleSearch} className="mx-auto max-w-2xl" role="search">
          <div
            className="flex items-center gap-3 rounded-2xl border p-2.5 transition-all duration-300"
            style={{
              borderColor  : focused ? THEME.colors.primary.cyan + "73" : THEME.colors.ui.border,
              background   : focused ? THEME.colors.primary.cyan + "0D" : THEME.colors.ui.card,
              boxShadow    : focused
                ? `0 0 0 3px ${THEME.colors.primary.cyan}12, 0 12px 40px ${THEME.colors.primary.cyan}1A`
                : "0 4px 24px rgba(0,0,0,0.25)",
            }}
          >
            <Search 
              className="ml-1 h-4 w-4 shrink-0 text-white/30" 
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError(""); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Paste token mint address…"
              className="flex-1 cursor-text bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              aria-label="Token mint address"
              aria-describedby={error ? "search-error" : undefined}
              aria-invalid={error ? true : undefined}
            />
            <button
              type="submit"
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#040d12] transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{ background: THEME.colors.primary.gradient }}
              aria-label={getButtonAriaLabel("Analyze", "token")}
            >
              Analyze <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          {error && (
            <p 
              id="search-error" 
              className="mt-2.5 text-left text-xs text-red-400/80"
              role="alert"
            >
              {error}
            </p>
          )}
        </form>

        {/* example chips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-white/30">Try:</span>
          {EXAMPLE_TOKENS.map((t) => (
            <button
              key={t.address}
              type="button"
              onClick={() => router.push(`/token/${t.address}`)}
              className="group flex cursor-pointer items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/50 transition-all duration-150 hover:border-[#14d4e8]/40 hover:bg-[#14d4e8]/8 hover:text-white active:scale-95"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#14F195] opacity-40 transition-opacity group-hover:opacity-100" />
              {t.symbol}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════ STATS STRIP ══════════════ */}
      <section className="w-full border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-3xl grid-cols-2 sm:grid-cols-4">
          {STATS.map(({ label, value, icon: Icon, color }, i) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-1.5 px-6 py-6 ${i < STATS.length - 1 ? "border-r border-white/[0.06]" : ""}`}
            >
              <Icon className="h-4 w-4 opacity-70" style={{ color }} />
              <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
              <span className={`${TEXT_DETAIL} text-white/40`}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">Full Analytics Suite</h2>
          <p className="mt-2 text-sm text-white/40">Everything you need, sourced directly from on-chain data</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.05] hover:-translate-y-0.5"
            >
              <div
                className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${color}18` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs leading-relaxed text-white/45">{desc}</p>
              <div
                className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.15]"
                style={{ background: color }}
              />
            </div>
          ))}
        </div>

        {/* ── data sources ── */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Data Sources</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-white/[0.05] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {SOURCES.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="group flex cursor-pointer flex-col gap-3 px-6 py-5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    {s.name}
                    <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 ${TEXT_MICRO} font-medium`}
                    style={{ background: `${s.color}18`, color: s.color }}
                  >
                    {s.badge}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-white/40">{s.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
