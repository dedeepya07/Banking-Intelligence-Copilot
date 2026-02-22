import React, { useState, useMemo } from 'react';
import { MetricCard } from '../components/MetricCard';
import { AlertTriangle, TrendingUp, Users, DollarSign, ExternalLink, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useHighRiskTransactions } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const riskTrendData = [
  { date: '02/15', low: 8100, medium: 1250, high: 180 },
  { date: '02/16', low: 8350, medium: 1320, high: 195 },
  { date: '02/17', low: 8200, medium: 1400, high: 210 },
  { date: '02/18', low: 8450, medium: 1380, high: 225 },
  { date: '02/19', low: 8300, medium: 1450, high: 240 },
  { date: '02/20', low: 8500, medium: 1420, high: 220 },
  { date: '02/21', low: 8234, medium: 1456, high: 234 },
];

const riskScoreDistribution = [
  { range: '0-20', count: 4521 },
  { range: '21-40', count: 3143 },
  { range: '41-60', count: 1456 },
  { range: '61-80', count: 570 },
  { range: '81-100', count: 234 },
];

export default function FraudIntelligencePage() {
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [showPii, setShowPii] = useState(false);
  const { user } = useAuth();
  const canViewPii = user?.role === 'admin' || user?.role === 'auditor';

  const { highRisk, isLoading, error } = useHighRiskTransactions(0.7);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const maskString = (str: string, type: 'account' | 'name') => {
    if (!str) return 'Unknown';
    if (showPii) return str;

    if (type === 'account') {
      return `****${str.slice(-4)}`;
    } else {
      return `Customer [ID: ${str.length > 5 ? str.substring(0, 5) : 'XXXXX'}]`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground mb-1">Fraud Intelligence</h1>
          <p className="text-[14px] text-muted-foreground">
            Real-time fraud detection and risk monitoring dashboard
          </p>
        </div>
        {canViewPii && (
          <button
            onClick={() => setShowPii(!showPii)}
            className="px-4 py-2 bg-muted text-foreground hover:bg-muted/80 text-[13px] font-medium transition-colors border border-border"
          >
            {showPii ? 'Hide PII' : 'Show PII'}
          </button>
        )}
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="High-Risk Transactions"
          value={isLoading ? "..." : String(highRisk?.length || 0)}
          icon={AlertTriangle}
          subtitle="Last 24 hours"
        />
        <MetricCard
          title="Total Risk Score"
          value="23,456"
          icon={TrendingUp}
          trend={{ value: '15.3%', isPositive: false }}
        />
        <MetricCard
          title="Flagged Accounts"
          value="89"
          icon={Users}
          subtitle="Requiring review"
        />
        <MetricCard
          title="Potential Fraud Value"
          value="$1.2M"
          icon={DollarSign}
          subtitle="Under investigation"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Risk Trend */}
        <div className="bg-card border border-border p-6">
          <h3 className="text-[18px] font-medium text-foreground mb-4">
            Risk Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#5F6B7A" />
              <YAxis tick={{ fontSize: 12 }} stroke="#5F6B7A" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                }}
              />
              <Line
                type="monotone"
                dataKey="high"
                stroke="#C62828"
                strokeWidth={2}
                name="High Risk"
              />
              <Line
                type="monotone"
                dataKey="medium"
                stroke="#ED6C02"
                strokeWidth={2}
                name="Medium Risk"
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="#2E7D32"
                strokeWidth={2}
                name="Low Risk"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Score Distribution */}
        <div className="bg-card border border-border p-6">
          <h3 className="text-[18px] font-medium text-foreground mb-4">
            Risk Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskScoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#5F6B7A" />
              <YAxis tick={{ fontSize: 12 }} stroke="#5F6B7A" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                }}
              />
              <Bar dataKey="count" fill="#1F6F78" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High Risk Transactions */}
      <div className="bg-card border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[18px] font-medium text-foreground">
            High-Risk Transactions Requiring Review
          </h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
              <p className="text-muted-foreground text-[14px]">Loading high-risk transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertTriangle className="w-8 h-8 mb-4" />
              <p className="text-[14px]">{error}</p>
            </div>
          ) : highRisk.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-[14px]">
              No high-risk transactions found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-right text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Risk Flags
                  </th>
                  <th className="px-6 py-3 text-center text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {highRisk.map((txn: any) => (
                  <tr key={txn.transaction_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-mono text-foreground">{txn.transaction_id}</td>
                    <td className="px-6 py-4 text-[13px] text-muted-foreground">
                      {new Date(txn.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-mono text-foreground">
                      {maskString(txn.account_number, 'account')}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-foreground">
                      {maskString(txn.customer_name, 'name')}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-right font-medium text-foreground">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-right">
                      <span className="font-medium text-destructive">
                        {Math.round(txn.risk_score * 100)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {txn.flags?.map((flag: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex px-2 py-0.5 text-[11px] bg-destructive/10 text-destructive border border-destructive/20"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedTransaction(txn)}
                        className="inline-flex items-center gap-1 text-[13px] text-accent hover:text-accent/80 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Explain
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Risk Explanation Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-[18px] font-medium text-foreground">
                Risk Analysis: {selectedTransaction.transaction_id}
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-[14px] font-medium text-foreground mb-2">
                  Risk Score: {Math.round(selectedTransaction.risk_score * 100)}/100
                </h4>
                <div className="w-full bg-muted h-2">
                  <div
                    className="bg-destructive h-2 transition-all duration-500"
                    style={{ width: `${Math.round(selectedTransaction.risk_score * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <h4 className="text-[14px] font-medium text-foreground mb-2">Risk Factors</h4>
                <ul className="space-y-2 text-[13px]">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Large Amount (35 points):</strong>{' '}
                      Transaction amount exceeds $100,000 threshold
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">International Transfer (25 points):</strong>{' '}
                      Wire transfer to high-risk jurisdiction
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Unusual Pattern (27 points):</strong>{' '}
                      Transaction deviates from customer's typical behavior
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[14px] font-medium text-foreground mb-2">Recommended Actions</h4>
                <ul className="space-y-1 text-[13px] text-muted-foreground">
                  <li>• Manual review required by compliance team</li>
                  <li>• Verify customer identity and transaction purpose</li>
                  <li>• Consider temporary hold pending investigation</li>
                  <li>• Document all findings in audit log</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button className="px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-[14px]">
                  Approve Transaction
                </button>
                <button className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-[14px]">
                  Block Transaction
                </button>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="px-4 py-2 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
