import React from 'react';

type Role = 'analyst' | 'auditor' | 'admin';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const styles = {
    analyst: 'bg-accent/10 text-accent border-accent/20',
    auditor: 'bg-primary/10 text-primary border-primary/20',
    admin: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  };

  const labels = {
    analyst: 'Analyst',
    auditor: 'Auditor',
    admin: 'Administrator',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-[13px] font-medium border ${styles[role]} ${className}`}
    >
      {labels[role]}
    </span>
  );
}
