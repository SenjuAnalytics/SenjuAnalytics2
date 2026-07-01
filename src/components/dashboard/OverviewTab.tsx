"use client";

import Image from "next/image";
import { DollarSign, BarChart2, TrendingUp, Coins, Activity, Flame } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceTooltip } from "@/components/charts/ChartTooltip";
import { useTokenPage } from "@/hooks/useTokenData";
import { getDexIconPath } from "@/lib/dex-icons";
import { formatUsd, formatNumber, formatPercent } from "@/lib/formatters";
import { TEXT_MICRO } from "@/lib/text";
import { API_LIMITS, UI } from "@/lib/constants";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface OverviewTabProps {
  address: string;
}

export function OverviewTab({ address }: OverviewTabProps) {
  const { isPending, token, pairs } = useTokenPage(address);
  const bestPair = [...pairs].sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

  const chartData = pairs.slice(0, 1).flatMap((p) =>
    Array.from({ length: API_LIMITS.CHART_DATA_POINTS }, (_, i) => ({
      time: `${i}:00`,
      price: Number(p.priceUsd || 0) * (1 + (Math.random() - 0.5) * 0.05),
    }))
  );

  const priceChange = token?.priceChange24h ?? bestPair?.priceChange?.h24;

  return (
    <div className="space-y-4">
      {token?.bondingCurveProgress !== undefined && (
        <div className="rounded-xl border border-[#00ff94]/20 bg-[#00ff94]/5 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-[#00ff94]" />
              <span className="text-xs font-semibold text-[#00ff94]">Bonding Curve Progress</span>
            </div>
            <span className="text-xs font-bold text-white tabular-nums">
              {token.bondingCurveProgress.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${token.bondingCurveProgress}%`,
                background: "linear-gradient(90deg, #00ff94, #14d4e8)",
              }}
            />
          </div>
          <p className={`mt-1.5 ${TEXT_MICRO} text-white/40`}>
            {token.bondingCurveProgress >= 100
              ? "All tokens sold — ready to graduate to PumpSwap"
              : token.bondingCurveRealSol !== undefined
                ? `${token.bondingCurveRealSol < 1 ? token.bondingCurveRealSol.toFixed(4) : token.bondingCurveRealSol.toFixed(2)} SOL collected — graduates when all tokens are sold`
                : `${token.bondingCurveProgress.toFixed(1)}% of bonding curve tokens sold`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Price"
          value={token?.price ? formatUsd(token.price) : "—"}
          trend={priceChange}
          icon={DollarSign}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="Market Cap"
          value={token?.marketCap ? formatUsd(token.marketCap) : token?.fdv ? formatUsd(token.fdv) : "—"}
          subValue={token?.fdv && !token?.marketCap ? "FDV" : undefined}
          icon={TrendingUp}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="24h Volume"
          value={token?.volume24h ? formatUsd(token.volume24h) : "—"}
          icon={BarChart2}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
        <StatCard
          title="Total Supply"
          value={token?.supply ? formatNumber(token.supply) : "—"}
          icon={Coins}
          isLoading={isPending}
          accentColor="#14d4e8"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Price Chart (24h — indicative)</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="h-48 w-full bg-muted/20 rounded animate-pulse" />
            ) : chartData.length > 0 ? (
              <div className="[&_*]:!outline-none">
                <ResponsiveContainer width="100%" height={192}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14d4e8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14d4e8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={false} interval={5} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#666" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatUsd(v)}
                      width={70}
                    />
                    <Tooltip content={<PriceTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#14d4e8"
                      strokeWidth={2}
                      fill="url(#priceGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={BarChart2}
                title="No price data available"
                description="Price chart will appear when trading data is available"
                iconColor="#14d4e8"
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Token Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending ? (
              Array.from({ length: UI.SKELETON_ITEMS }).map((_, i) => (
                <div key={i} className="h-5 w-full bg-muted/20 rounded animate-pulse" />
              ))
            ) : token ? (
              <>
                <InfoRow label="Name" value={token.name} />
                <InfoRow label="Symbol">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {token.symbol}
                  </Badge>
                </InfoRow>
                <InfoRow label="Decimals" value={String(token.decimals)} />
                <InfoRow label="Address">
                  <AddressDisplay address={token.address} type="token" />
                </InfoRow>
                <InfoRow label="24h Change">
                  <span className={`text-xs font-medium ${(priceChange ?? 0) >= 0 ? "text-[#14d4e8]" : "text-red-400"}`}>
                    {priceChange !== undefined ? formatPercent(priceChange) : "—"}
                  </span>
                </InfoRow>
                {token.description && (
                  <p className="text-xs text-muted-foreground border-t border-border/50 pt-2 leading-relaxed">
                    {token.description.slice(0, UI.MAX_DESCRIPTION_LENGTH)}{token.description.length > UI.MAX_DESCRIPTION_LENGTH ? "…" : ""}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Token not found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {pairs.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#14d4e8]" />
              <CardTitle className="text-sm font-medium">Active Trading Pairs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    {["DEX", "Pair", "Price", "24h Vol", "Liquidity", "24h Buys/Sells", "24h %"].map((h) => (
                      <th key={h} className="pb-2 text-left font-medium text-muted-foreground first:pl-0 px-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pairs.slice(0, API_LIMITS.DEFAULT_PAIRS_LIMIT).map((pair) => (
                    <tr key={pair.pairAddress} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-2 pl-0 pr-2">
                        <Badge variant="outline" className={`${TEXT_MICRO} font-medium capitalize inline-flex items-center gap-1`}>
                          <Image
                            src={getDexIconPath(pair.dexId)}
                            alt={pair.dexId}
                            width={12}
                            height={12}
                            className="shrink-0 rounded-full object-cover"
                          />
                          {pair.dexId}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 font-mono text-white">
                        {pair.baseToken.symbol}/{pair.quoteToken.symbol}
                      </td>
                      <td className="py-2 px-2 text-white">{pair.priceUsd ? formatUsd(Number(pair.priceUsd)) : "—"}</td>
                      <td className="py-2 px-2">{pair.volume?.h24 ? formatUsd(pair.volume.h24) : "—"}</td>
                      <td className="py-2 px-2">{pair.liquidity?.usd ? formatUsd(pair.liquidity.usd) : "—"}</td>
                      <td className="py-2 px-2">
                        <span className="text-[#14d4e8]">{pair.txns?.h24?.buys ?? 0}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-red-400">{pair.txns?.h24?.sells ?? 0}</span>
                      </td>
                      <td className={`py-2 px-2 font-medium ${(pair.priceChange?.h24 ?? 0) >= 0 ? "text-[#14d4e8]" : "text-red-400"}`}>
                        {pair.priceChange?.h24 !== undefined ? formatPercent(pair.priceChange.h24) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      {children ?? <span className="text-xs text-white text-right truncate max-w-[60%]">{value ?? "—"}</span>}
    </div>
  );
}
