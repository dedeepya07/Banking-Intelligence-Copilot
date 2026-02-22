import React from 'react';
import { MetricCard } from './MetricCard';
import { RiskBadge } from './RiskBadge';
import { RoleBadge } from './RoleBadge';
import { AlertBanner } from './AlertBanner';
import { CollapsibleSQLPanel } from './CollapsibleSQLPanel';
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

export default function ComponentShowcase() {
  const [sqlOpen, setSqlOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-[32px] font-semibold text-foreground">
            Banking Intelligence Design System
          </h1>
          <p className="text-[16px] text-muted-foreground">
            Enterprise-grade component library for financial institutions
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Color System</h2>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <div className="h-24 bg-primary border border-border mb-2"></div>
              <p className="text-[12px] font-mono text-muted-foreground">#0F1E2E</p>
              <p className="text-[13px] text-foreground">Primary Navy</p>
            </div>
            <div>
              <div className="h-24 bg-accent border border-border mb-2"></div>
              <p className="text-[12px] font-mono text-muted-foreground">#1F6F78</p>
              <p className="text-[13px] text-foreground">Accent Teal</p>
            </div>
            <div>
              <div className="h-24 bg-success border border-border mb-2"></div>
              <p className="text-[12px] font-mono text-muted-foreground">#2E7D32</p>
              <p className="text-[13px] text-foreground">Success Green</p>
            </div>
            <div>
              <div className="h-24 bg-warning border border-border mb-2"></div>
              <p className="text-[12px] font-mono text-muted-foreground">#ED6C02</p>
              <p className="text-[13px] text-foreground">Warning Amber</p>
            </div>
            <div>
              <div className="h-24 bg-destructive border border-border mb-2"></div>
              <p className="text-[12px] font-mono text-muted-foreground">#C62828</p>
              <p className="text-[13px] text-foreground">Error Red</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Typography</h2>
          <div className="bg-card border border-border p-6 space-y-3">
            <div className="text-[28px] font-semibold text-foreground">
              Page Title (28px, Semibold)
            </div>
            <div className="text-[18px] font-medium text-foreground">
              Section Title (18px, Medium)
            </div>
            <div className="text-[16px] font-medium text-foreground">
              Card Heading (16px, Medium)
            </div>
            <div className="text-[14px] text-foreground">Body Text (14px, Regular)</div>
            <div className="text-[13px] text-foreground">Table Data (13px, Regular)</div>
            <div className="text-[12px] text-muted-foreground">Small Meta Text (12px, Regular)</div>
          </div>
        </section>

        {/* Metric Cards */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Metric Cards</h2>
          <div className="grid grid-cols-4 gap-6">
            <MetricCard
              title="Total Transactions"
              value="9,924"
              icon={DollarSign}
              trend={{ value: '12.5%', isPositive: true }}
            />
            <MetricCard
              title="High-Risk Alerts"
              value="234"
              icon={AlertTriangle}
              subtitle="Requires review"
            />
            <MetricCard
              title="Total Credits"
              value="$24.8M"
              icon={TrendingUp}
            />
            <MetricCard
              title="Compliance Score"
              value="94.2%"
              icon={CheckCircle}
              trend={{ value: '2.1%', isPositive: true }}
            />
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Badges</h2>
          <div className="bg-card border border-border p-6">
            <div className="space-y-4">
              <div>
                <p className="text-[14px] font-medium text-foreground mb-2">Risk Badges</p>
                <div className="flex items-center gap-3">
                  <RiskBadge level="low" />
                  <RiskBadge level="medium" />
                  <RiskBadge level="high" />
                </div>
              </div>
              <div>
                <p className="text-[14px] font-medium text-foreground mb-2">Role Badges</p>
                <div className="flex items-center gap-3">
                  <RoleBadge role="analyst" />
                  <RoleBadge role="auditor" />
                  <RoleBadge role="admin" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Alert Banners */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Alert Banners</h2>
          <div className="space-y-4">
            <AlertBanner
              type="info"
              title="Information"
              message="This is an informational message for the user."
            />
            <AlertBanner
              type="warning"
              title="Warning"
              message="Please review the following items before proceeding."
            />
            <AlertBanner
              type="error"
              title="Error"
              message="An error occurred while processing your request."
            />
            <AlertBanner
              type="success"
              title="Success"
              message="Your changes have been saved successfully."
            />
          </div>
        </section>

        {/* Collapsible SQL Panel */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Collapsible SQL Panel</h2>
          <CollapsibleSQLPanel
            sql={`SELECT 
  account_id,
  customer_name,
  COUNT(transaction_id) as total_txns,
  SUM(amount) as total_amount
FROM transactions
WHERE date >= CURRENT_DATE - 30
GROUP BY account_id, customer_name
ORDER BY total_amount DESC;`}
            isOpen={sqlOpen}
            onToggle={() => setSqlOpen(!sqlOpen)}
          />
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Buttons</h2>
          <div className="bg-card border border-border p-6">
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-[14px]">
                Primary Action
              </button>
              <button className="px-4 py-2 bg-card border border-border text-foreground hover:bg-muted/50 transition-colors text-[14px]">
                Secondary Action
              </button>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-[14px]">
                Destructive Action
              </button>
              <button className="px-4 py-2 text-[14px] text-muted-foreground hover:text-foreground transition-colors">
                Text Button
              </button>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Form Elements</h2>
          <div className="bg-card border border-border p-6 space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-2">
                Text Input
              </label>
              <input
                type="text"
                placeholder="Enter text..."
                className="w-full px-3 py-2 bg-input-background border border-input text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-2">
                Select Dropdown
              </label>
              <select className="w-full px-3 py-2 bg-input-background border border-input text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-2">
                Textarea
              </label>
              <textarea
                placeholder="Enter description..."
                rows={4}
                className="w-full px-3 py-2 bg-input-background border border-input text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          </div>
        </section>

        {/* Data Table Example */}
        <section className="space-y-4">
          <h2 className="text-[24px] font-semibold text-foreground">Data Table</h2>
          <div className="bg-card border border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Account
                  </th>
                  <th className="px-6 py-3 text-right text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-[13px] font-mono text-foreground">
                    TXN-2026-001234
                  </td>
                  <td className="px-6 py-4 text-[13px] font-mono text-foreground">****7823</td>
                  <td className="px-6 py-4 text-[14px] text-right font-medium text-foreground">
                    $125,000.00
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level="high" />
                  </td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-[13px] font-mono text-foreground">
                    TXN-2026-001235
                  </td>
                  <td className="px-6 py-4 text-[13px] font-mono text-foreground">****3421</td>
                  <td className="px-6 py-4 text-[14px] text-right font-medium text-foreground">
                    $2,450.00
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level="medium" />
                  </td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-[13px] font-mono text-foreground">
                    TXN-2026-001236
                  </td>
                  <td className="px-6 py-4 text-[13px] font-mono text-foreground">****9876</td>
                  <td className="px-6 py-4 text-[14px] text-right font-medium text-foreground">
                    $850.00
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level="low" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
