import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { TrendingUp, AlertCircle, Activity, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

const portfolioRisk = [
  { month: 'Aug', score: 45 },
  { month: 'Sep', score: 48 },
  { month: 'Oct', score: 52 },
  { month: 'Nov', score: 47 },
  { month: 'Dec', score: 51 },
  { month: 'Jan', score: 55 },
  { month: 'Feb', score: 58 },
];

const riskBySegment = [
  { segment: 'Commercial', exposure: 45.2, risk: 52 },
  { segment: 'Retail', exposure: 28.5, risk: 34 },
  { segment: 'Investment', exposure: 15.8, risk: 68 },
  { segment: 'Treasury', exposure: 10.5, risk: 22 },
];

const riskCorrelation = [
  { amount: 10000, velocity: 5, risk: 15 },
  { amount: 25000, velocity: 8, risk: 28 },
  { amount: 50000, velocity: 12, risk: 45 },
  { amount: 75000, velocity: 15, risk: 62 },
  { amount: 125000, velocity: 25, risk: 87 },
  { amount: 200000, velocity: 35, risk: 92 },
  { amount: 90000, velocity: 18, risk: 71 },
  { amount: 45000, velocity: 10, risk: 38 },
];

export default function RiskAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-[28px] font-semibold text-foreground mb-1">Risk Analytics</h1>
        <p className="text-[14px] text-muted-foreground">
          Advanced risk modeling and portfolio analysis
        </p>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Portfolio Risk Score"
          value="58"
          icon={TrendingUp}
          trend={{ value: '5.5%', isPositive: false }}
        />
        <MetricCard
          title="High-Risk Exposure"
          value="$127M"
          icon={AlertCircle}
          subtitle="15.8% of total"
        />
        <MetricCard
          title="Risk Events (30d)"
          value="1,245"
          icon={Activity}
          trend={{ value: '18.2%', isPositive: false }}
        />
        <MetricCard
          title="Compliance Score"
          value="94.2%"
          icon={Target}
          trend={{ value: '2.1%', isPositive: true }}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Portfolio Risk Trend */}
        <div className="bg-card border border-border p-6">
          <h3 className="text-[18px] font-medium text-foreground mb-4">
            Portfolio Risk Trend (6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={portfolioRisk}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#5F6B7A" />
              <YAxis tick={{ fontSize: 12 }} stroke="#5F6B7A" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#1F6F78"
                fill="#1F6F78"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk by Business Segment */}
        <div className="bg-card border border-border p-6">
          <h3 className="text-[18px] font-medium text-foreground mb-4">
            Risk by Business Segment
          </h3>
          <div className="space-y-4 mt-6">
            {riskBySegment.map((segment) => (
              <div key={segment.segment}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] text-foreground">{segment.segment}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-muted-foreground">
                      ${segment.exposure}M
                    </span>
                    <span className="text-[13px] font-medium text-foreground w-12 text-right">
                      {segment.risk}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted h-2">
                  <div
                    className={`h-2 ${
                      segment.risk > 60
                        ? 'bg-destructive'
                        : segment.risk > 40
                        ? 'bg-warning'
                        : 'bg-success'
                    }`}
                    style={{ width: `${segment.risk}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Correlation Analysis */}
      <div className="bg-card border border-border p-6">
        <h3 className="text-[18px] font-medium text-foreground mb-4">
          Risk Correlation Analysis
        </h3>
        <p className="text-[13px] text-muted-foreground mb-4">
          Transaction Amount vs. Velocity vs. Risk Score
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="amount"
              name="Amount"
              tick={{ fontSize: 12 }}
              stroke="#5F6B7A"
              label={{ value: 'Transaction Amount ($)', position: 'bottom', fontSize: 12 }}
            />
            <YAxis
              dataKey="velocity"
              name="Velocity"
              tick={{ fontSize: 12 }}
              stroke="#5F6B7A"
              label={{
                value: 'Transaction Velocity',
                angle: -90,
                position: 'insideLeft',
                fontSize: 12,
              }}
            />
            <ZAxis dataKey="risk" range={[50, 400]} name="Risk Score" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
              }}
            />
            <Scatter name="Transactions" data={riskCorrelation} fill="#1F6F78" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Indicators */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6">
          <h4 className="text-[16px] font-medium text-foreground mb-4">
            Value at Risk (VaR)
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">95% Confidence</span>
              <span className="text-[14px] font-medium text-foreground">$8.5M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">99% Confidence</span>
              <span className="text-[14px] font-medium text-foreground">$12.3M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Time Horizon</span>
              <span className="text-[14px] font-medium text-foreground">30 days</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6">
          <h4 className="text-[16px] font-medium text-foreground mb-4">
            Stress Test Results
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Market Shock</span>
              <span className="text-[14px] font-medium text-destructive">-18.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Credit Event</span>
              <span className="text-[14px] font-medium text-destructive">-12.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Liquidity Crisis</span>
              <span className="text-[14px] font-medium text-destructive">-22.8%</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6">
          <h4 className="text-[16px] font-medium text-foreground mb-4">
            Key Risk Indicators
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Concentration Risk</span>
              <span className="text-[14px] font-medium text-warning">Medium</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Operational Risk</span>
              <span className="text-[14px] font-medium text-success">Low</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Market Risk</span>
              <span className="text-[14px] font-medium text-destructive">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
