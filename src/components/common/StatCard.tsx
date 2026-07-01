import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { THEME } from "@/lib/theme";
import { getAriaLabel, getLoadingAriaAttrs } from "@/lib/accessibility";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  trend?: number;
  isLoading?: boolean;
  accentColor?: string;
}

export function StatCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  isLoading, 
  accentColor = THEME.colors.primary.cyan 
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card 
        className="bg-card border-border/50"
        {...getLoadingAriaAttrs(true)}
        aria-label={`Loading ${title}`}
      >
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const trendPositive = trend !== undefined && trend >= 0;
  const trendColor = trendPositive ? THEME.colors.primary.cyan : THEME.colors.status.error;

  return (
    <Card 
      className="bg-card border-border/50 hover:border-border transition-colors"
      role="article"
      aria-label={getAriaLabel(title, value)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {title}
          </p>
          {Icon && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md opacity-80"
              style={{ backgroundColor: `${accentColor}20` }}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
            </div>
          )}
        </div>
        
        <p 
          className="text-xl font-bold text-white tabular-nums"
          aria-label={`${title}: ${value}`}
        >
          {value}
        </p>
        
        <div className="mt-1 flex items-center gap-2">
          {trend !== undefined && (
            <span
              className="text-xs font-medium"
              style={{ color: trendColor }}
              aria-label={`Trend: ${trendPositive ? "up" : "down"} ${Math.abs(trend).toFixed(2)}%`}
            >
              {trendPositive ? "▲" : "▼"} {Math.abs(trend).toFixed(2)}%
            </span>
          )}
          {subValue && (
            <span className="text-xs text-muted-foreground">
              {subValue}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
