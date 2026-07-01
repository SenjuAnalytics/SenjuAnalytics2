"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { CreationModeBadge } from "@/components/icons/CreationModeBadge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { LiquidityTab } from "@/components/dashboard/LiquidityTab";
import { LockTab } from "@/components/dashboard/LockTab";
import { FeeClaimTab } from "@/components/dashboard/FeeClaimTab";
import { BurnBuybackTab } from "@/components/dashboard/BurnBuybackTab";
import { useTokenPage } from "@/hooks/useTokenData";
import { formatUsd, formatPercent } from "@/lib/formatters";
import { TEXT_DETAIL } from "@/lib/text";

export default function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const [activeTab, setActiveTab] = useState("overview");

  const { isPending, refetch, isRefetching, token, pairs } = useTokenPage(address);
  const bestPair = [...pairs].sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
  const priceChange = token?.priceChange24h ?? bestPair?.priceChange?.h24;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">

      {/* ── back nav ── */}
      <div className="pt-5 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to search
        </Link>
      </div>

      {/* ── token header ── */}
      <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

        {/* left — identity */}
        {isPending ? (
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted/20 animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-muted/20 rounded animate-pulse" />
              <div className="h-3.5 w-56 bg-muted/20 rounded animate-pulse" />
            </div>
          </div>
        ) : token ? (
          <div className="flex items-center gap-4">
            {/* logo */}
            {token.logoURI ? (
              <Image
                src={token.logoURI}
                alt={token.symbol}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-white/10 object-cover shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#14d4e8]/15 text-base font-bold text-[#14d4e8]">
                {token.symbol?.slice(0, 2)}
              </div>
            )}

            {/* name + address */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl font-bold text-white leading-none">{token.name}</h1>
                <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                  {token.symbol}
                </Badge>
                {/* Launch platform badge */}
                {token.launchPlatform && (
                  <a
                    href={token.launchPlatform.tokenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${TEXT_DETAIL} font-semibold transition-opacity hover:opacity-80 cursor-pointer`}
                    style={{
                      borderColor: `${token.launchPlatform.color}40`,
                      backgroundColor: `${token.launchPlatform.color}12`,
                      color: token.launchPlatform.color,
                    }}
                    title={`Launched on ${token.launchPlatform.name}`}
                  >
                    <Image
                      src={token.launchPlatform.iconPath}
                      alt={token.launchPlatform.name}
                      width={14}
                      height={14}
                      className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    {token.launchPlatform.name}
                    {token.launchPlatform.mode && (
                      <>
                        <span className="opacity-40">·</span>
                        {token.launchPlatform.modeIconPath && (
                          <Image
                            src={token.launchPlatform.modeIconPath}
                            alt={token.launchPlatform.mode}
                            width={14}
                            height={14}
                            className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <span className="opacity-80 font-medium">{token.launchPlatform.mode}</span>
                      </>
                    )}
                  </a>
                )}
                {/* Creation mode badge — separate from platform badge */}
                {token.launchPlatform?.creationMode && (
                  <CreationModeBadge mode={token.launchPlatform.creationMode} />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="font-mono">{address.slice(0, 10)}…{address.slice(-8)}</span>
                <a
                  href={`https://solscan.io/token/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#14d4e8] transition-colors"
                  title="View on Solscan"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30 text-xs font-mono">
              ?
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-mono">{address.slice(0, 16)}…</h1>
              <p className="text-xs text-white/40 mt-1">Token not found or invalid address</p>
            </div>
          </div>
        )}

        {/* right — price + refresh */}
        <div className="flex items-center gap-4 sm:shrink-0">
          {token?.price && (
            <div className="flex flex-col items-start sm:items-end gap-0.5">
              <p className="text-2xl font-bold tabular-nums text-white leading-none">
                {formatUsd(token.price)}
              </p>
              {priceChange !== undefined && (
                <p className={`text-xs font-medium ${priceChange >= 0 ? "text-[#14d4e8]" : "text-red-400"}`}>
                  {priceChange >= 0 ? "" : ""}{formatPercent(priceChange)} (24h)
                </p>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 border-white/10 text-xs text-white/60 hover:border-[#14d4e8]/40 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* custom tab nav */}
        <div className="mb-6 border-b border-white/[0.07]">
          <div className="flex items-end gap-1 overflow-x-auto scrollbar-none">
            {[
              { value: "overview",  label: "Overview"       },
              { value: "liquidity", label: "Liquidity"      },
              { value: "lock",      label: "Token Lock"     },
              { value: "fees",      label: "Fee Claims"     },
              { value: "burn",      label: "Burn & Buyback" },
            ].map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`relative cursor-pointer whitespace-nowrap px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150 outline-none
                    ${isActive ? "text-white" : "text-white/40 hover:text-white/70"}`}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                      style={{ background: "linear-gradient(90deg, #14d4e8, #14F195)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab address={address} />
        </TabsContent>

        <TabsContent value="liquidity" className="mt-0">
          <LiquidityTab address={address} />
        </TabsContent>

        <TabsContent value="lock" className="mt-0">
          <LockTab address={address} tokenDecimals={token?.decimals ?? 9} tokenSupply={token?.supply} tokenPriceUsd={token?.price} tokenSymbol={token?.symbol} />
        </TabsContent>

        <TabsContent value="fees" className="mt-0">
          <FeeClaimTab address={address} tokenDecimals={token?.decimals ?? 9} tokenSymbol={token?.symbol ?? "TOKEN"} />
        </TabsContent>

        <TabsContent value="burn" className="mt-0">
          <BurnBuybackTab address={address} tokenDecimals={token?.decimals ?? 9} tokenSymbol={token?.symbol ?? "TOKEN"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

