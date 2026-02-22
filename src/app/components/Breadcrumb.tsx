import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  breadcrumbs: BreadcrumbItem[];
}

export function Breadcrumb({ breadcrumbs }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-[12px] mb-4">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          {item.path && index < breadcrumbs.length - 1 ? (
            <Link
              to={item.path}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={
                index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
              }
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}