import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, subtitle }: MetricCardProps) {
  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
          <p className="text-[28px] font-semibold text-foreground mb-1">{value}</p>
          {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-[12px] font-medium ${
                  trend.isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-[12px] text-muted-foreground">vs yesterday</span>
            </div>
          )}
        </div>
        <div className="bg-muted p-3">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
