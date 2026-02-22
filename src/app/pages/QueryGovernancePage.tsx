import React, { useState, useEffect } from 'react';
import {
    Activity,
    ShieldAlert,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    User,
    Clock,
    Database,
    AlertTriangle,
    Eye
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

export default function QueryGovernancePage() {
    const { user: currentUser } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [filterSuspicious, setFilterSuspicious] = useState(false);
    const [filterSource, setFilterSource] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, [filterSuspicious, filterSource]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data } = await apiService.getQueryLogs({
                suspicious_only: filterSuspicious,
                source_type: filterSource === 'all' ? undefined : filterSource
            });
            if (data) setLogs(data);
        } catch (error) {
            console.error('Failed to fetch query logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRow = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold text-foreground flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-500" />
                        Query Governance & Logs
                    </h1>
                    <p className="text-[14px] text-muted-foreground mt-1">
                        Enterprise monitoring and suspicious activity detection for natural language queries
                    </p>
                </div>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-muted-foreground">Filters:</span>
                            <div
                                onClick={() => setFilterSuspicious(!filterSuspicious)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] cursor-pointer transition-all border ${filterSuspicious
                                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                    : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Suspicious Only
                            </div>
                        </div>

                        <select
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                            className="bg-muted border-none text-[12px] rounded-md px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">All Sources</option>
                            <option value="typed">Typed</option>
                            <option value="voice">Voice</option>
                            <option value="scheduled">Scheduled</option>
                        </select>
                    </div>

                    <p className="text-[12px] text-muted-foreground font-mono">
                        Showing {logs.length} entries
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-6 py-3 font-medium">Timestamp</th>
                                <th className="px-6 py-3 font-medium">User / Role</th>
                                <th className="px-6 py-3 font-medium">Query</th>
                                <th className="px-6 py-3 font-medium">Rows</th>
                                <th className="px-6 py-3 font-medium">Time</th>
                                <th className="px-6 py-3 font-medium text-center">Risk</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground text-[13px]">
                                        Loading governance logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground text-[13px]">
                                        No logs found matching selected filters.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            className={`hover:bg-muted/30 transition-colors ${log.suspicious_flag ? 'bg-destructive/[0.03]' : ''}`}
                                        >
                                            <td className="px-6 py-4 text-[13px] font-mono whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                                                        U{log.user_id}
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-medium">Analyst_{log.user_id}</div>
                                                        <div className="text-[11px] text-muted-foreground uppercase">{log.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] max-w-xs truncate">
                                                {log.nl_query}
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-mono">
                                                {log.rows_returned}
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-mono">
                                                {log.execution_time_ms}ms
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all
                                                  ${log.query_risk_level === 'high' ? 'bg-destructive/10 text-destructive border-destructive/30' :
                                                        log.query_risk_level === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                                                            'bg-success/10 text-success border-success/30'}`}>
                                                    {log.query_risk_level}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5">{log.query_risk_score}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.suspicious_flag ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-destructive/10 text-destructive text-[11px] font-bold">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        BLOCKED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-success/10 text-success text-[11px] font-bold">
                                                        OK
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => toggleRow(log.id)}
                                                    className="p-1.5 hover:bg-muted rounded transition-colors"
                                                >
                                                    {expandedRow === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === log.id && (
                                            <tr className="bg-muted/50 border-t border-border/50">
                                                <td colSpan={7} className="px-8 py-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2 flex items-center gap-2">
                                                                    <Database className="w-3.5 h-3.5" />
                                                                    Generated SQL Pipeline
                                                                </h4>
                                                                <pre className="bg-background border border-border p-4 rounded text-[12px] font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                                                                    {log.generated_sql || '-- SQL Execution Prevented --'}
                                                                </pre>
                                                            </div>
                                                            <div className="flex gap-6">
                                                                <div>
                                                                    <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Source Type</h4>
                                                                    <span className="text-[13px] font-mono">{log.source_type}</span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">IP Address</h4>
                                                                    <span className="text-[13px] font-mono">{log.ip_address}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {log.suspicious_flag && (
                                                                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                                                                    <h4 className="text-[13px] font-bold text-destructive flex items-center gap-2 mb-2">
                                                                        <AlertTriangle className="w-4 h-4" />
                                                                        Security Policy Violation
                                                                    </h4>
                                                                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                                                                        {log.block_reason}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                                                                <h4 className="text-[13px] font-bold text-indigo-500 flex items-center gap-2 mb-2">
                                                                    <Eye className="w-4 h-4" />
                                                                    Observability Meta
                                                                </h4>
                                                                <ul className="text-[12px] space-y-2 text-muted-foreground font-mono">
                                                                    <li>User ID: {log.user_id}</li>
                                                                    <li>Role Access: {log.role}</li>
                                                                    <li>Exec Latency: {log.execution_time_ms}ms</li>
                                                                    <li>Risk Magnitude: {log.query_risk_score}</li>
                                                                    <li>Governance Level: {log.query_risk_level?.toUpperCase()}</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
