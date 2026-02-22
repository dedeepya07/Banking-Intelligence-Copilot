import React, { useState, useMemo, useEffect } from 'react';
import { RiskBadge } from '../components/RiskBadge';
import { Filter, Download, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTransactions } from '../../hooks/useApi';

type SortField = 'date' | 'amount' | 'score' | 'customer';
type SortOrder = 'asc' | 'desc';

export default function TransactionsPage() {
  const { transactions, fetchTransactions, isLoading } = useTransactions();
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [piiMasked, setPiiMasked] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [dateRange, setDateRange] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [amountRange, setAmountRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTransactions(500);
  }, [fetchTransactions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleClearFilters = () => {
    setDateRange('all');
    setTransactionType('all');
    setRiskLevel('all');
    setAmountRange('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    alert('CSV export initiated.');
  };

  // Map API data to component structure
  const allTransactions = useMemo(() => {
    return transactions.map(t => ({
      id: t.transaction_id,
      date: t.timestamp.split('T')[0],
      time: t.timestamp.split('T')[1]?.split('.')[0] || '00:00:00',
      account: '****' + t.transaction_id.slice(-4),
      accountFull: 'ACC-' + t.transaction_id,
      customer: t.customer_name || `Customer ${t.id}`,
      type: t.transaction_type,
      description: `Banking transaction ref ${t.transaction_id}`,
      amount: t.amount,
      currency: 'INR',
      risk: t.risk_level as 'low' | 'medium' | 'high',
      score: Math.round(t.risk_score * 100),
      location: 'India',
      ip: '127.0.0.1'
    }));
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((txn) => {
      // Date range filter (simplified)
      if (dateRange !== 'all') {
        const txnDate = new Date(txn.date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dateRange === 'last-7-days' && diffDays > 7) return false;
        if (dateRange === 'last-30-days' && diffDays > 30) return false;
      }

      if (transactionType !== 'all' && txn.type !== transactionType) return false;
      if (riskLevel !== 'all' && txn.risk !== riskLevel) return false;

      if (amountRange !== 'all') {
        if (amountRange === 'lt-1000' && txn.amount >= 1000) return false;
        if (amountRange === '1000-10000' && (txn.amount < 1000 || txn.amount >= 10000)) return false;
        if (amountRange === 'gt-100000' && txn.amount < 100000) return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          txn.id.toLowerCase().includes(query) ||
          txn.customer.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allTransactions, dateRange, transactionType, riskLevel, amountRange, searchQuery]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'customer':
          comparison = a.customer.localeCompare(b.customer);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUp className="w-3 h-3 opacity-30" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-accent" /> : <ArrowDown className="w-3 h-3 text-accent" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground mb-1">Transactions Explorer</h1>
          <p className="text-[14px] text-muted-foreground">Monitor and analyze real-time transaction data</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          <button onClick={() => setPiiMasked(!piiMasked)} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground hover:bg-muted/50 transition-colors">
            {piiMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {piiMasked ? 'Show' : 'Hide'} PII
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-card border border-border">
        <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-[14px] font-medium text-foreground">Filters & Search</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="px-5 py-4 bg-muted/5">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-input text-[13px] text-foreground">
                <option value="all">All Time</option>
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
              </select>
              <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-input text-[13px] text-foreground">
                <option value="all">All Types</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
              </select>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-input text-[13px] text-foreground">
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical</option>
              </select>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by ID..." className="w-full px-3 py-2 bg-input-background border border-input text-[13px]" />
            </div>
            <div className="flex justify-end">
              <button onClick={handleClearFilters} className="text-[12px] text-muted-foreground hover:text-foreground">Clear All Filters</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-5 py-3 text-left w-8"></th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">ID</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase cursor-pointer" onClick={() => handleSort('date')}>Date <SortIcon field="date" /></th>
                <th className="px-5 py-3 text-left test-[12px] font-semibold uppercase">Customer</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">Account</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">Type</th>
                <th className="px-5 py-3 text-right text-[12px] font-semibold uppercase cursor-pointer" onClick={() => handleSort('amount')}>Amount <SortIcon field="amount" /></th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-3">
                    <button onClick={() => setExpandedRow(expandedRow === txn.id ? null : txn.id)}>
                      {expandedRow === txn.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-[13px] font-mono">{txn.id}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">
                    <div>{txn.date}</div>
                    <div className="text-[11px]">{txn.time}</div>
                  </td>
                  <td className="px-5 py-3 text-[13px]">{piiMasked ? 'User ' + txn.id : txn.customer}</td>
                  <td className="px-5 py-3 text-[13px] font-mono">{piiMasked ? txn.account : txn.accountFull}</td>
                  <td className="px-5 py-3 text-[13px]">{txn.type}</td>
                  <td className="px-5 py-3 text-[14px] text-right font-medium">${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <RiskBadge level={txn.risk} />
                      <span className="text-[12px] text-muted-foreground">{txn.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedTransactions.length === 0 && !isLoading && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {paginatedTransactions.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-[13px] border border-border disabled:opacity-40">Previous</button>
              <span className="text-[12px] text-muted-foreground px-2">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-[13px] border border-border disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
