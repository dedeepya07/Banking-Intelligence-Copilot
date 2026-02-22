import React, { useEffect } from 'react';
import { MetricCard } from '../components/MetricCard';
import { RiskBadge } from '../components/RiskBadge';
import { DollarSign, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useMetrics, useTransactions } from '../../hooks/useApi';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function DashboardPage() {
  const { metrics, fetchMetrics, isLoading: metricsLoading } = useMetrics();
  const { transactions, fetchTransactions, isLoading: transactionsLoading } = useTransactions();

  useEffect(() => {
    // Refresh data on mount
    fetchMetrics();
    fetchTransactions(5);
  }, [fetchMetrics, fetchTransactions]);

  // Derived data for charts
  const riskDistribution = metrics ? [
    { name: 'Fraud/Critical', value: Math.round(metrics.total_transactions * metrics.fraud_detection_rate / 100), color: '#C62828' },
    { name: 'Normal', value: metrics.total_transactions - Math.round(metrics.total_transactions * metrics.fraud_detection_rate / 100), color: '#2E7D32' },
  ] : [
    { name: 'Low Risk', value: 8234, color: '#2E7D32' },
    { name: 'Medium Risk', value: 1456, color: '#ED6C02' },
    { name: 'High Risk', value: 234, color: '#C62828' },
  ];

  const activityTimeline = [
    { time: '00:00', transactions: 45 },
    { time: '04:00', transactions: 32 },
    { time: '08:00', transactions: 156 },
    { time: '12:00', transactions: 234 },
    { time: '16:00', transactions: 189 },
    { time: '20:00', transactions: 98 },
  ];

  const isLoading = metricsLoading || transactionsLoading;

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground mb-1">Dashboard Overview</h1>
          <p className="text-[14px] text-muted-foreground">
            Real-time monitoring and analytics for banking operations
          </p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-5">
        <MetricCard
          title="Total Transactions"
          value={metrics?.total_transactions.toLocaleString() || "9,924"}
          icon={DollarSign}
          trend={metrics ? undefined : { value: '12.5%', isPositive: true }}
        />
        <MetricCard
          title="Avg Query Time"
          value={`${metrics?.avg_query_time_ms.toFixed(1) || "120"}ms`}
          icon={AlertTriangle}
          subtitle="NL-to-SQL performance"
        />
        <MetricCard
          title="Fraud Rate"
          value={`${metrics?.fraud_detection_rate.toFixed(1) || "2.3"}%`}
          icon={TrendingUp}
          trend={metrics ? undefined : { value: '8.2%', isPositive: true }}
        />
        <MetricCard
          title="Active Agents"
          value={metrics?.active_agents.toString() || "3"}
          icon={TrendingDown}
          subtitle="AI models online"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-card border border-border p-6">
          <h3 className="text-[18px] font-medium text-foreground mb-4">
            Transaction Risk Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Timeline */}
        <div className="bg-card border border-border p-6">
          <h3 className="text-[18px] font-medium text-foreground mb-4">
            Transaction Activity (Last 24h)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={activityTimeline}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#5F6B7A" />
              <YAxis tick={{ fontSize: 12 }} stroke="#5F6B7A" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                }}
              />
              <Bar dataKey="transactions" fill="#1F6F78" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Flagged Transactions */}
      <div className="bg-card border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[18px] font-medium text-foreground">
            Recent Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
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
                  Type
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
              {(transactions.length > 0 ? transactions : []).map((txn) => (
                <tr key={txn.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-[14px] font-mono text-foreground">{txn.transaction_id}</td>
                  <td className="px-6 py-4 text-[14px] text-muted-foreground">
                    {new Date(txn.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-foreground">{txn.transaction_type}</td>
                  <td className="px-6 py-4 text-[14px] text-right font-medium text-foreground">
                    ${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={txn.risk_level as any} />
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}