import React from 'react';

type RiskLevel = 'low' | 'medium' | 'high';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className = '' }: RiskBadgeProps) {
  const styles = {
    low: 'bg-success/10 text-success border-success/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[12px] font-medium border ${styles[level]} ${className}`}
    >
      {labels[level]}
    </span>
  );
}
