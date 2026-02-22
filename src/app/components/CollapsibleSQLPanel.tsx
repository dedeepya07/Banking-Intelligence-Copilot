import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSQLPanelProps {
  sql: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function CollapsibleSQLPanel({ sql, isOpen, onToggle }: CollapsibleSQLPanelProps) {
  return (
    <div className="border border-border bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <span className="text-[14px] font-medium text-foreground">Generated SQL Query</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-border bg-muted/30 p-4">
          <pre className="text-[13px] text-foreground font-mono overflow-x-auto">
            <code>{sql}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
