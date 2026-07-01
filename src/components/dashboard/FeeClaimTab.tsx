"use client";

import Image from "next/image";
import { Coins, DollarSign, Hash, Clock, Wallet, ArrowDownToLine, Layers, Gift, Flame, Bot, Percent, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import { StatCard } from "@/components/common/StatCard";
import { formatNumber, formatUsd, formatRelativeTime, formatTimestamp } from "@/lib/formatters";
import type { FeeClaimRecord } from "@/types/token";
import { TEXT_MICRO } from "@/lib/text";
import type { FeeMode, FeeModeInfo, AgentStats } from "@/types/api";
import { useFeeClaims } from "@/hooks/useTokenData";
import { API_LIMITS, UI } from "@/lib/constants";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ────────────────────────────────────────────────────

// FeeApiResponse removed — FeesResponse from @/types/api is used via useFeeClaims hook

interface FeeClaimTabProps {
  address: string;
  tokenDecimals?: number;
  tokenSymbol?: string;
}

// ── Shared sub-components ────────────────────────────────────

function FeeTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-medium text-[#14d4e8]">{formatUsd(payload[0].value)}</p>
    </div>
  );
}

interface VaultAddressCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  address: string;
  accentColor: string;
}

function VaultAddressCard({ icon: Icon, label, description, address, accentColor }: VaultAddressCardProps) {
  return (
    <div
      className="flex-1 min-w-0 rounded-lg px-4 py-3 transition-colors hover:bg-muted/10"
      style={{ borderLeft: `2px solid ${accentColor}40` }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3 flex-shrink-0" style={{ color: accentColor }} />
        <span className="text-xs font-semibold" style={{ color: accentColor }}>{label}</span>
      </div>
      <p className={`${TEXT_MICRO} text-muted-foreground/60 mb-2 leading-relaxed`}>{description}</p>
      <div className="flex items-center gap-1.5">
        <AddressDisplay address={address} />
      </div>
    </div>
  );
}

// ── Fee source metadata (per DEX) ────────────────────────────

const FEE_SOURCE_META: Record<string, { name: string; icon: string; color: string; vaultLabel: string; vaultDesc: string; poolLabel: string }> = {
  pumpfun:  { name: "Pump.fun",  icon: "/platforms/pumpfun.png",  color: "#00ff94", vaultLabel: "Creator Fee Vault",   vaultDesc: "SOL accumulates here from bonding curve swaps",     poolLabel: "Bonding Curve" },
  pumpswap: { name: "PumpSwap",  icon: "/platforms/pumpswap.png", color: "#f59e0b", vaultLabel: "Creator Fee Vault",   vaultDesc: "WSOL accumulates here from every swap",            poolLabel: "PumpSwap AMM Pool" },
  raydium:  { name: "Raydium",   icon: "/platforms/raydium.png",  color: "#6366f1", vaultLabel: "Fee Vault",           vaultDesc: "Fees accumulate in the LP position",               poolLabel: "Raydium Pool" },
};

function getSourceMeta(source: string) {
  return FEE_SOURCE_META[source] ?? { name: source, icon: "", color: "#14d4e8", vaultLabel: "Fee Vault", vaultDesc: "Fees accumulate here", poolLabel: "Pool" };
}

function SourceBadge({ source }: { source: string }) {
  const meta = getSourceMeta(source);
  return (
    <Badge variant="outline" className={`${TEXT_MICRO} font-medium gap-1 pr-2`} style={{ borderColor: `${meta.color}40`, color: meta.color }}>
      {meta.icon && <Image src={meta.icon} alt={meta.name} width={12} height={12} className="rounded-sm" />}
      {meta.name}
    </Badge>
  );
}

// ── Mode icon helper ─────────────────────────────────────────

const MODE_ICONS: Record<FeeMode, LucideIcon> = {
  creator:  Coins,
  cashback: Gift,
  mayhem:   Flame,
  agent:    Bot,
};

// ── Mode banner component ────────────────────────────────────

function ModeBanner({ modeInfo }: { modeInfo: FeeModeInfo }) {
  const Icon = MODE_ICONS[modeInfo.mode] ?? Coins;
  const activeColor = "#00ff94"; // Consistent green for all active modes
  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40" style={{ backgroundColor: `${activeColor}08` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: activeColor }} />
        <span className="text-xs font-semibold tracking-wide" style={{ color: `${activeColor}e0` }}>{modeInfo.label} Mode</span>
        <Badge variant="outline" className={`ml-auto ${TEXT_MICRO} py-0`} style={{ borderColor: `${activeColor}30`, color: activeColor }}>active</Badge>
      </div>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground leading-relaxed">{modeInfo.description}</p>
      </CardContent>
    </Card>
  );
}

// ── Main component ───────────────────────────────────────────

export function FeeClaimTab({ address, tokenDecimals = 9 }: FeeClaimTabProps) {
  const { data, isPending } = useFeeClaims(address);

  const fees         = data?.fees || [];
  const unclaimedSol = data?.unclaimedSol ?? 0;
  const vaultInfo    = data?.vaultInfo ?? null;
  const feeMode      = data?.feeMode ?? "creator";
  const modeInfo     = data?.modeInfo ?? null;
  const agentStats   = data?.agentStats ?? null;
  const truncated    = data?.truncated ?? false;
  const isAgent      = feeMode === "agent";

  const totalClaimed    = fees.reduce((sum, f) => sum + (f.amountSol ?? f.amount / Math.pow(10, tokenDecimals)), 0);
  const totalUsdClaimed = fees.reduce((sum, f) => sum + (f.usdValue || 0), 0);

  const feesByDay = fees.reduce<Record<string, number>>((acc, f) => {
    const day = new Date((f.timestamp > 1e12 ? f.timestamp : f.timestamp * 1000)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    acc[day] = (acc[day] || 0) + (f.usdValue || 0);
    return acc;
  }, {});

  const chartData = Object.entries(feesByDay)
    .slice(-API_LIMITS.FEE_HISTORY_DAYS)
    .map(([date, usd]) => ({ date, usd }));

  const sourceBreakdown = fees.reduce<Record<string, number>>((acc, f) => {
    acc[f.source] = (acc[f.source] || 0) + (f.usdValue || f.amount / Math.pow(10, tokenDecimals));
    return acc;
  }, {});

  // ── Determine stat card config based on mode ──
  const modeColor = modeInfo?.color ?? "#f59e0b";
  const ModeIcon  = MODE_ICONS[feeMode] ?? Coins;

  return (
    <div className="space-y-4">
      {/* ── Truncated history notice ── */}
      {truncated && !isPending && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/8 px-4 py-3">
          <Clock className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-yellow-300">Showing most recent history only</p>
            <p className="text-xs text-yellow-200/70 mt-0.5 leading-relaxed">
              This token has extensive on-chain history. Fee claims shown here cover the most recent
              20,000 transactions per address. Older claim records may not appear.
            </p>
          </div>
        </div>
      )}
      {modeInfo && (
        <ModeBanner modeInfo={modeInfo} />
      )}

      {/* ── Agent Buyback Info (agent mode only) ── */}
      {isAgent && agentStats && (
        <Card className="bg-card border-border/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40" style={{ backgroundColor: "#a78bfa08" }}>
            <Bot className="h-3.5 w-3.5 text-[#a78bfa]" />
            <span className="text-xs font-semibold tracking-wide text-[#a78bfae0]">Agent Buyback Configuration</span>
            <Badge variant="outline" className={`ml-auto ${TEXT_MICRO} py-0 border-[#a78bfa]/30 text-[#a78bfa]`}>
              {(agentStats.buybackBps / 100).toFixed(0)}% buyback
            </Badge>
          </div>
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:divide-x divide-border/30">
              <VaultAddressCard
                icon={Bot}
                label="Agent PDA"
                description="Token agent payments account (on-chain config)"
                address={agentStats.agentPda}
                accentColor="#a78bfa"
              />
              <VaultAddressCard
                icon={Wallet}
                label="Agent Authority"
                description="Can withdraw non-buyback revenue and update settings"
                address={agentStats.authority}
                accentColor="#14d4e8"
              />
              <div className="flex-1 min-w-0 rounded-lg px-4 py-3" style={{ borderLeft: "2px solid #f59e0b40" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Percent className="h-3 w-3 flex-shrink-0 text-[#f59e0b]" />
                  <span className="text-xs font-semibold text-[#f59e0b]">Buyback Rate</span>
                </div>
                <p className={`${TEXT_MICRO} text-muted-foreground/60 mb-2 leading-relaxed`}>% of agent revenue used for token buy + burn</p>
                <span className="text-sm font-mono font-bold text-white">{(agentStats.buybackBps / 100).toFixed(1)}%</span>
                <span className={`${TEXT_MICRO} text-muted-foreground ml-1`}>({agentStats.buybackBps} bps)</span>
              </div>
            </div>
            {(agentStats.currencies.length > 0 || agentStats.vaultBalances) && (
              <div className="border-t border-border/30">
                <Tabs defaultValue="agent" className="w-full">
                  <div className="px-4 pt-4 pb-2 border-b border-border/20">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="agent" className="text-xs">
                        <Bot className="h-3.5 w-3.5 mr-1.5" />
                        Agent Revenue
                      </TabsTrigger>
                      <TabsTrigger value="creator" className="text-xs">
                        <Coins className="h-3.5 w-3.5 mr-1.5" />
                        Creator Fees
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Agent Revenue Tab */}
                  <TabsContent value="agent" className="px-4 py-4 mt-0">
                    {/* Section Headers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-3">
                      {agentStats.currencies.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-[#a78bfa]" />
                          <p className="text-xs font-semibold text-muted-foreground tracking-wide">AGENT REVENUE FLOW</p>
                        </div>
                      )}
                      {agentStats.vaultBalances && (
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-[#f59e0b]" />
                          <p className="text-xs font-semibold text-muted-foreground tracking-wide">CURRENT VAULT BALANCES (SOL)</p>
                        </div>
                      )}
                    </div>

                    {/* Unified Grid for All Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Agent Revenue Flow Cards */}
                      {agentStats.currencies.length > 0 && agentStats.currencies.map((c) => {
                        const decimals = c.currencyLabel === "SOL" ? 9 : 6;
                        const divisor = Math.pow(10, decimals);
                        const buybackHuman = c.totalBuyback / divisor;
                        const withdrawHuman = c.totalWithdrawals / divisor;
                        const totalDistributed = buybackHuman + withdrawHuman;
                        return (
                          <div 
                            key={c.currencyMint} 
                            className="rounded-lg bg-muted/20 px-4 py-3 border border-border/30 hover:border-border/50 transition-all hover:bg-muted/30"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-bold text-white">{c.currencyLabel}</span>
                              <div className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
                            </div>
                            <div className={`space-y-2 ${TEXT_MICRO}`}>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Distributed</span>
                                <span className="font-mono font-semibold text-white">{formatNumber(totalDistributed)}</span>
                              </div>
                              <div className="h-px bg-border/20" />
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">→ To Buyback</span>
                                <span className="font-mono font-semibold text-[#a78bfa]">{formatNumber(buybackHuman)}</span>
                              </div>
                              {agentStats.buybackBps < 10000 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">→ To Withdraw</span>
                                  <span className="font-mono font-semibold text-[#14d4e8]">{formatNumber(withdrawHuman)}</span>
                                </div>
                              )}
                              {c.tokensBurnedRaw > 0 && (
                                <>
                                  <div className="h-px bg-border/20" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Tokens Burned</span>
                                    <span className="font-mono font-semibold text-[#ef4444]">{formatNumber(c.tokensBurnedRaw / 1e6)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Vault Balance Cards */}
                      {agentStats.vaultBalances && [
                        { label: "Payment Vault", desc: "Pending distribution", value: agentStats.vaultBalances.paymentVault, address: agentStats.vaultBalances.paymentVaultAddress, color: "#f59e0b" },
                        { label: "Buyback Vault", desc: "Pending swap + burn", value: agentStats.vaultBalances.buybackVault, address: agentStats.vaultBalances.buybackVaultAddress, color: "#a78bfa" },
                        ...(agentStats.buybackBps < 10000 ? [{ label: "Withdraw Vault", desc: "Available for authority", value: agentStats.vaultBalances.withdrawVault, address: agentStats.vaultBalances.withdrawVaultAddress, color: "#14d4e8" }] : []),
                      ].map((v) => (
                        <div 
                          key={v.label} 
                          className="rounded-lg bg-muted/20 px-4 py-3 border border-border/30 hover:border-border/50 transition-all hover:bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className={`text-xs font-bold tracking-wide`} style={{ color: v.color }}>
                              {v.label}
                            </div>
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: v.color }} />
                          </div>
                          <p className={`${TEXT_MICRO} text-muted-foreground/70 mb-3 leading-relaxed`}>{v.desc}</p>
                          <div className="mb-3">
                            <div className="text-lg font-mono font-bold text-white tracking-tight">
                              {(v.value / 1e9).toFixed(6)}
                            </div>
                            <div className={`${TEXT_MICRO} text-muted-foreground mt-0.5`}>SOL</div>
                          </div>
                          <div className="pt-2 border-t border-border/20">
                            <AddressDisplay address={v.address} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Info Note */}
                    <div className="mt-4 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3">
                      <p className="text-xs text-blue-200/80 leading-relaxed">
                        <strong className="text-blue-100">Agent Revenue:</strong> Funds from agent services/products are automatically distributed hourly based on buyback rate ({(agentStats.buybackBps / 100).toFixed(0)}% to buyback, {(100 - agentStats.buybackBps / 100).toFixed(0)}% to withdraw).
                      </p>
                    </div>
                  </TabsContent>

                  {/* Creator Fees Tab */}
                  <TabsContent value="creator" className="px-4 py-4 mt-0">
                    {vaultInfo ? (() => {
                      const primary = fees.length > 0 ? getSourceMeta(fees[0].source) : getSourceMeta("pumpswap");
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-1 w-1 rounded-full" style={{ backgroundColor: primary.color }} />
                            <p className="text-xs font-semibold text-muted-foreground tracking-wide">{primary.name.toUpperCase()} CREATOR FEE ADDRESSES</p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-lg bg-muted/20 px-4 py-3 border border-border/30 hover:border-border/50 transition-all hover:bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <ArrowDownToLine className="h-3 w-3" style={{ color: primary.color }} />
                                  <span className="text-xs font-bold tracking-wide" style={{ color: primary.color }}>{primary.vaultLabel}</span>
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary.color }} />
                              </div>
                              <p className={`${TEXT_MICRO} text-muted-foreground/70 mb-3 leading-relaxed`}>{primary.vaultDesc}</p>
                              <div className="pt-2 border-t border-border/20">
                                <AddressDisplay address={vaultInfo.vaultAta} />
                              </div>
                            </div>

                            <div className="rounded-lg bg-muted/20 px-4 py-3 border border-border/30 hover:border-border/50 transition-all hover:bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <Wallet className="h-3 w-3 text-[#14d4e8]" />
                                  <span className="text-xs font-bold tracking-wide text-[#14d4e8]">Fee Recipient</span>
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full bg-[#14d4e8]" />
                              </div>
                              <p className={`${TEXT_MICRO} text-muted-foreground/70 mb-3 leading-relaxed`}>Only this wallet can withdraw fees from the vault</p>
                              <div className="pt-2 border-t border-border/20">
                                <AddressDisplay address={vaultInfo.coinCreator} />
                              </div>
                            </div>

                            <div className="rounded-lg bg-muted/20 px-4 py-3 border border-border/30 hover:border-border/50 transition-all hover:bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <Layers className="h-3 w-3 text-[#a78bfa]" />
                                  <span className="text-xs font-bold tracking-wide text-[#a78bfa]">{primary.poolLabel}</span>
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
                              </div>
                              <p className={`${TEXT_MICRO} text-muted-foreground/70 mb-3 leading-relaxed`}>{primary.name} pool / bonding curve address</p>
                              <div className="pt-2 border-t border-border/20">
                                <AddressDisplay address={vaultInfo.poolPda} />
                              </div>
                            </div>
                          </div>

                          {/* Info Note */}
                          <div className="mt-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
                            <p className="text-xs text-green-200/80 leading-relaxed">
                              <strong className="text-green-100">Creator Fees:</strong> Trading fees from {primary.name} (0.05% - 0.95% based on market cap) accumulate here. This is separate from agent revenue and must be claimed manually.
                            </p>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Coins className="h-8 w-8 mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No creator fee vault information available</p>
                        <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">Creator fee data will appear here once the token has trading activity.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Creator Fee Vault Info (creator/cashback/mayhem modes) ── */}
      {!isAgent && vaultInfo && (
        <Card className="bg-card border-border/50 overflow-hidden">
          {(() => {
            const primary = fees.length > 0 ? getSourceMeta(fees[0].source) : getSourceMeta("pumpswap");
            return (
              <>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40" style={{ backgroundColor: `${primary.color}08` }}>
                  <Coins className="h-3.5 w-3.5" style={{ color: primary.color }} />
                  <span className="text-xs font-semibold tracking-wide" style={{ color: `${primary.color}e0` }}>
                    {primary.name} Creator Fee Addresses
                  </span>
                  <Badge variant="outline" className={`ml-auto ${TEXT_MICRO} py-0`} style={{ borderColor: `${primary.color}30`, color: primary.color }}>
                    {primary.name.toLowerCase()} pool
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/20 px-4 py-3 border border-border/30 hover:border-border/50 transition-all hover:bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <ArrowDownToLine className="h-3 w-3" style={{ color: primary.color }} />
                          <span className="text-xs font-bold tracking-wide" style={{ color: primary.color }}>{primary.vaultLabel}</span>
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary.color }} />
                      </div>
                      <p className={`${TEXT_MICRO} text-muted-foreground/70 mb-3 leading-relaxed`}>{primary.vaultDesc}</p>
                      <div className="pt-2 border-t border-border/20">
                        <AddressDisplay address={vaultInfo.vaultAta} />
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/20 px-4 py-3 border border-border/30 hover:border-border/50 transition-all hover:bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Wallet className="h-3 w-3 text-[#14d4e8]" />
                          <span className="text-xs font-bold tracking-wide text-[#14d4e8]">Fee Recipient</span>
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-[#14d4e8]" />
                      </div>
                      <p className={`${TEXT_MICRO} text-muted-foreground/70 mb-3 leading-relaxed`}>Only this wallet can withdraw fees from the vault</p>
                      <div className="pt-2 border-t border-border/20">
                        <AddressDisplay address={vaultInfo.coinCreator} />
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/20 px-4 py-3 border border-border/30 hover:border-border/50 transition-all hover:bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3 w-3 text-[#a78bfa]" />
                          <span className="text-xs font-bold tracking-wide text-[#a78bfa]">{primary.poolLabel}</span>
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
                      </div>
                      <p className={`${TEXT_MICRO} text-muted-foreground/70 mb-3 leading-relaxed`}>{primary.name} pool / bonding curve address</p>
                      <div className="pt-2 border-t border-border/20">
                        <AddressDisplay address={vaultInfo.poolPda} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            );
          })()}
        </Card>
      )}

      {/* ── Stat cards (unified for all modes) ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          title="Unclaimed"
          value={unclaimedSol > 0 ? unclaimedSol.toFixed(6) : "0"}
          subValue="SOL"
          icon={ModeIcon}
          isLoading={isPending}
          accentColor={modeColor}
        />
        <StatCard
          title="Total Claimed"
          value={formatNumber(totalClaimed)}
          subValue="SOL"
          icon={Coins}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="Total USD Claimed"
          value={totalUsdClaimed > 0 ? formatUsd(totalUsdClaimed) : "—"}
          icon={DollarSign}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="Claim Events"
          value={String(fees.length)}
          icon={Hash}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="Last Claim"
          value={fees[0] ? formatRelativeTime(fees[0].timestamp) : "—"}
          icon={Clock}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
      </div>

      {/* ── Charts & breakdown ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {chartData.length > 0 && (
          <Card className="lg:col-span-2 bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fee Claims Over Time (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="[&_*]:!outline-none">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14d4e8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14d4e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#666" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatUsd(v)}
                    width={70}
                  />
                  <Tooltip content={<FeeTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="usd"
                    stroke="#14d4e8"
                    strokeWidth={2}
                    fill="url(#feeGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {Object.keys(sourceBreakdown).length > 0 && (
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">By Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(sourceBreakdown).map(([source, amount]) => {
                  const total = Object.values(sourceBreakdown).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? (amount / total) * 100 : 0;
                  const meta = getSourceMeta(source);
                  return (
                    <div key={source}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-white">
                          {meta.icon && <Image src={meta.icon} alt={meta.name} width={12} height={12} className="rounded-sm" />}
                          {meta.name}
                        </span>
                        <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Fee claim table ── */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[#14d4e8]" />
            <CardTitle className="text-sm font-medium">Fee Claim Transactions</CardTitle>
            <Badge variant="secondary" className={`ml-auto ${TEXT_MICRO}`}>
              {fees.length} claims
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: UI.SKELETON_ITEMS }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : fees.length === 0 ? (
            <FeeEmptyState feeMode={feeMode} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Source", "Amount (SOL)", "USD Value", "Claimed By", "Pool", "Date", "TX"].map((h) => (
                      <th key={h} className="pb-2 pr-4 text-left font-medium text-muted-foreground first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr key={fee.signature} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 pr-4">
                        <SourceBadge source={fee.source} />
                      </td>
                      <td className="py-3 pr-4 font-mono font-medium text-white">
                        {fee.amountSol != null ? fee.amountSol.toFixed(6) : formatNumber(fee.amount / Math.pow(10, tokenDecimals))}
                        <span className="text-muted-foreground ml-1">SOL</span>
                      </td>
                      <td className="py-3 pr-4 text-[#14d4e8]">
                        {fee.usdValue ? formatUsd(fee.usdValue) : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <AddressDisplay address={fee.claimedBy} />
                      </td>
                      <td className="py-3 pr-4">
                        <AddressDisplay address={fee.poolAddress} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-white">{formatRelativeTime(fee.timestamp)}</div>
                        <div className={`text-muted-foreground ${TEXT_MICRO}`}>{formatTimestamp(fee.timestamp)}</div>
                      </td>
                      <td className="py-3">
                        <AddressDisplay address={fee.signature} type="tx" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Empty state per mode ─────────────────────────────────────

function FeeEmptyState({ feeMode = "creator" }: { feeMode?: FeeMode }) {
  const configs: Record<FeeMode, { icon: React.ElementType; color: string; title: string; description: string }> = {
    cashback: {
      icon: Gift,
      color: "#00ff94",
      title: "No creator fee claims",
      description: "Fees on this token are redirected to traders as cashback. The cashback distributions table above shows the per-trade fee flow to trader accumulators.",
    },
    mayhem: {
      icon: Flame,
      color: "#ef4444",
      title: "No fee claims found",
      description: "Fees on Mayhem tokens are routed to Mayhem fee recipients. Creator fee claims are not applicable in this mode.",
    },
    agent: {
      icon: Bot,
      color: "#a78bfa",
      title: "No fee claims found",
      description: "Creator fee claims from PumpSwap, Raydium, and other supported pools will appear here. Agent buyback activity is tracked separately.",
    },
    creator: {
      icon: Coins,
      color: "#666",
      title: "No fee claim records found",
      description: "Creator fee claims from PumpSwap, Raydium, and other supported pools will appear here.",
    },
  };

  const cfg = configs[feeMode] ?? configs.creator;
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-8 w-8 mb-3" style={{ color: `${cfg.color}50` }} />
      <p className="text-sm text-muted-foreground">{cfg.title}</p>
      <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">{cfg.description}</p>
    </div>
  );
}
