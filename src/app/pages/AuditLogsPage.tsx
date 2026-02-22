import React, { useState, useMemo, useEffect } from 'react';
import { RoleBadge } from '../components/RoleBadge';
import { ChevronDown, ChevronUp, Download, Filter as FilterIcon, Loader2 } from 'lucide-react';
import { useAuditLogs } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { logs, fetchLogs, isLoading, error } = useAuditLogs();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('all');
  const [suspiciousFilter, setSuspiciousFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    // Pass 0 to fetch all logs instead of just the current user's logs
    if (user) {
      const isAdmin = user.role === 'admin' || user.role === 'auditor';
      fetchLogs(isAdmin ? 0 : user.user_id!);
    }
  }, [fetchLogs, user]);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleExport = () => {
    alert('Audit log export initiated.');
  };

  const handleClearFilters = () => {
    setActionFilter('all');
    setSearchQuery('');
    setUserFilter('all');
    setSourceTypeFilter('all');
    setSuspiciousFilter('all');
    setDateFilter('');
  };

  // Map API data to component structure
  const allAuditLogs = useMemo(() => {
    return logs.map(l => ({
      id: `AUD-${l.id}`,
      timestamp: new Date(l.timestamp).toLocaleString(),
      dateOnly: new Date(l.timestamp).toISOString().split('T')[0],
      userId: l.user_id,
      user: `User ${l.user_id}`,
      role: l.role || 'analyst',
      action: l.action,
      query: l.query || (l.parameters ? JSON.stringify(l.parameters, null, 2) : 'No details available'),
      executionTime: l.execution_time_ms ? `${l.execution_time_ms}ms` : 'N/A',
      rowsReturned: l.rows_returned || 0,
      sourceType: l.source_type || 'typed',
      suspicious: !!l.suspicious_flag,
      generatedSql: l.generated_sql || '',
      nlQuery: l.nl_query || '',
      status: l.status === 'success' ? 'success' as const : (l.status === 'blocked' ? 'error' as const : 'error' as const)
    }));
  }, [logs]);

  const uniqueUsers = useMemo(() => Array.from(new Set(allAuditLogs.map(l => l.user))), [allAuditLogs]);

  const filteredLogs = useMemo(() => {
    return allAuditLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (userFilter !== 'all' && log.user !== userFilter) return false;
      if (sourceTypeFilter !== 'all' && log.sourceType !== sourceTypeFilter) return false;
      if (suspiciousFilter === 'true' && !log.suspicious) return false;
      if (suspiciousFilter === 'false' && log.suspicious) return false;
      if (dateFilter && log.dateOnly !== dateFilter) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return log.id.toLowerCase().includes(query) || log.user.toLowerCase().includes(query) || log.action.toLowerCase().includes(query);
      }
      return true;
    });
  }, [allAuditLogs, actionFilter, searchQuery, userFilter, sourceTypeFilter, suspiciousFilter, dateFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-foreground mb-1">Audit Logs</h1>
          <p className="text-[14px] text-muted-foreground">Complete audit trail of system activities</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
            <Download className="w-4 h-4" /> Export Audit Log
          </button>
        </div>
      </div>

      <div className="bg-card border border-border p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-input text-[13px]">
            <option value="all">All Actions</option>
            <option value="query_execution">Query Execution</option>
            <option value="voice_transcription">Voice Transcription</option>
            <option value="Data Access">Data Access</option>
            <option value="Authentication">Authentication</option>
          </select>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-input text-[13px]">
            <option value="all">All Users</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={sourceTypeFilter} onChange={(e) => setSourceTypeFilter(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-input text-[13px]">
            <option value="all">All Sources</option>
            <option value="typed">Typed</option>
            <option value="voice">Voice</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <select value={suspiciousFilter} onChange={(e) => setSuspiciousFilter(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-input text-[13px]">
            <option value="all">All Security Levels</option>
            <option value="true">Suspicious Only</option>
            <option value="false">Safe Only</option>
          </select>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-input text-[13px]" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full px-3 py-2 bg-input-background border border-input text-[13px]" />
        </div>
        <button onClick={handleClearFilters} className="text-[12px] text-muted-foreground hover:text-foreground">Clear Filters</button>
      </div>

      <div className="bg-card border border-border">
        {error && <div className="p-4 text-red-500 bg-red-100">Error: {error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-5 py-3 w-8"></th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">ID</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">Timestamp</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">User</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">Action</th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase">Source & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3">
                      <button onClick={() => toggleRow(log.id)}>
                        {expandedRow === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-mono">{log.id}</td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground">{log.timestamp}</td>
                    <td className="px-5 py-3 text-[13px]">{log.user}</td>
                    <td className="px-5 py-3 text-[13px]">{log.action}</td>
                    <td className="px-5 py-3 flex gap-2 items-center flex-wrap">
                      <span className={`px-2 py-0.5 text-[11px] font-medium border ${log.status === 'success' ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'
                        }`}>
                        {log.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-muted/30 text-muted-foreground border border-border">
                        {log.sourceType.charAt(0).toUpperCase() + log.sourceType.slice(1)}
                      </span>
                      {log.suspicious && (
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-orange-500/10 text-orange-500 border border-orange-500/30">
                          Suspicious
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr className="bg-muted/5">
                      <td colSpan={6} className="px-5 py-4 border-t border-border">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[12px] font-medium mb-1">Details:</p>
                            <pre className="text-[12px] font-mono bg-muted/30 p-3 border border-border overflow-x-auto h-32">{log.query}</pre>
                          </div>
                          <div>
                            {log.nlQuery && (
                              <div className="mb-3">
                                <p className="text-[12px] font-medium mb-1">Natural Language Query:</p>
                                <p className="text-[13px] bg-card border border-border p-2">{log.nlQuery}</p>
                              </div>
                            )}
                            {log.generatedSql && (
                              <div className="mb-3">
                                <p className="text-[12px] font-medium mb-1">Generated SQL:</p>
                                <pre className="text-[12px] font-mono bg-card border border-border p-2 overflow-x-auto">{log.generatedSql}</pre>
                              </div>
                            )}
                            <div className="flex gap-4">
                              <div>
                                <p className="text-[12px] font-medium mb-1">Execution Time:</p>
                                <p className="text-[13px]">{log.executionTime}</p>
                              </div>
                              <div>
                                <p className="text-[12px] font-medium mb-1">Rows Returned:</p>
                                <p className="text-[13px]">{log.rowsReturned}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredLogs.length === 0 && !isLoading && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
