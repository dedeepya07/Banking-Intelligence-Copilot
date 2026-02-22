import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type AlertType = 'info' | 'warning' | 'error' | 'success';

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message?: string;
  className?: string;
}

export function AlertBanner({ type, title, message, className = '' }: AlertBannerProps) {
  const styles = {
    info: {
      container: 'bg-accent/5 border-accent/30',
      icon: 'text-accent',
      Icon: Info,
    },
    warning: {
      container: 'bg-warning/5 border-warning/30',
      icon: 'text-warning',
      Icon: AlertTriangle,
    },
    error: {
      container: 'bg-destructive/5 border-destructive/30',
      icon: 'text-destructive',
      Icon: AlertCircle,
    },
    success: {
      container: 'bg-success/5 border-success/30',
      icon: 'text-success',
      Icon: CheckCircle,
    },
  };

  const { container, icon, Icon } = styles[type];

  return (
    <div className={`flex items-start gap-3 p-4 border ${container} ${className}`}>
      <Icon className={`w-5 h-5 ${icon} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className="text-[14px] font-medium text-foreground">{title}</p>
        {message && <p className="text-[13px] text-muted-foreground mt-1">{message}</p>}
      </div>
    </div>
  );
}
