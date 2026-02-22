import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api.service';
import { ScheduledQuery, ScheduledQueryCreate, ScheduledResult } from '../../services/api.config';
import { Activity, Clock, Plus, Settings2, Trash2, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';

export default function ScheduledReportsPage() {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<ScheduledQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [results, setResults] = useState<Record<number, ScheduledResult[]>>({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<ScheduledQueryCreate>({
        nl_query: '', frequency: 'daily', delivery_method: 'dashboard', webhook_url: '', is_active: true
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchSchedules = async () => {
        setLoading(true);
        const { data } = await apiService.getScheduledQueries();
        if (data) setSchedules(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const loadResults = async (id: number) => {
        const { data } = await apiService.getScheduledResults(id);
        if (data) {
            setResults(prev => ({ ...prev, [id]: data }));
        }
    };

    const toggleExpand = (id: number) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            if (!results[id]) {
                loadResults(id);
            }
        }
    };

    const handleSave = async () => {
        if (editingId) {
            await apiService.updateScheduledQuery(editingId, formData);
        } else {
            await apiService.createScheduledQuery(formData);
        }
        setIsModalOpen(false);
        fetchSchedules();
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure?")) {
            await apiService.deleteScheduledQuery(id);
            fetchSchedules();
        }
    };

    const toggleActive = async (s: ScheduledQuery) => {
        const payload: ScheduledQueryCreate = {
            nl_query: s.nl_query, frequency: s.frequency, delivery_method: s.delivery_method,
            webhook_url: s.webhook_url, is_active: !s.is_active
        };
        await apiService.updateScheduledQuery(s.id, payload);
        fetchSchedules();
    };

    const openNew = () => {
        setEditingId(null);
        setFormData({ nl_query: '', frequency: 'daily', delivery_method: 'dashboard', webhook_url: '', is_active: true });
        setIsModalOpen(true);
    };

    const openEdit = (s: ScheduledQuery) => {
        setEditingId(s.id);
        setFormData({ nl_query: s.nl_query, frequency: s.frequency, delivery_method: s.delivery_method, webhook_url: s.webhook_url || '', is_active: s.is_active });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold text-foreground mb-1">Scheduled Reports</h1>
                    <p className="text-[14px] text-muted-foreground">Automate and monitor recurring intelligence queries</p>
                </div>
                <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> New Schedule
                </button>
            </div>

            <div className="bg-card border border-border">
                <table className="w-full text-left bg-card">
                    <thead className="bg-muted/40 border-b border-border">
                        <tr>
                            <th className="px-5 py-3 w-8"></th>
                            <th className="px-4 py-3 text-[12px] font-semibold uppercase">Query</th>
                            <th className="px-4 py-3 text-[12px] font-semibold uppercase">Frequency</th>
                            <th className="px-4 py-3 text-[12px] font-semibold uppercase">Status</th>
                            <th className="px-4 py-3 text-[12px] font-semibold uppercase">Last Run</th>
                            <th className="px-4 py-3 text-[12px] font-semibold uppercase">Next Run</th>
                            <th className="px-4 py-3 text-[12px] font-semibold uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {schedules.map(s => (
                            <React.Fragment key={s.id}>
                                <tr className="hover:bg-muted/10">
                                    <td className="px-5 py-3">
                                        <button onClick={() => toggleExpand(s.id)}>
                                            {expandedId === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-[13px] max-w-sm truncate" title={s.nl_query}>{s.nl_query}</td>
                                    <td className="px-4 py-4 text-[13px] capitalize">{s.frequency}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-0.5 text-[11px] font-medium border ${s.is_active ? 'bg-success/10 text-success border-success/30' : 'bg-muted/30 text-muted-foreground border-border'}`}>
                                            {s.is_active ? 'Active' : 'Paused'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-[13px] text-muted-foreground">{s.last_run ? new Date(s.last_run + 'Z').toLocaleString() : 'Never'}</td>
                                    <td className="px-4 py-4 text-[13px]">{s.next_run ? new Date(s.next_run + 'Z').toLocaleString() : '-'}</td>
                                    <td className="px-4 py-4 flex gap-2 justify-end">
                                        <button onClick={() => toggleActive(s)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
                                            {s.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
                                            <Settings2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                                {expandedId === s.id && (
                                    <tr className="bg-muted/5">
                                        <td colSpan={7} className="px-5 py-4 border-t border-border">
                                            <p className="text-[12px] font-medium mb-3">Recent Runs for Schedule #{s.id}</p>
                                            {!results[s.id] ? <p className="text-[12px] text-muted-foreground">Loading...</p> :
                                                results[s.id].length === 0 ? <p className="text-[12px] text-muted-foreground">No runs yet.</p> : (
                                                    <div className="space-y-3">
                                                        {results[s.id].map(r => (
                                                            <div key={r.id} className="bg-card p-3 border border-border">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-[12px] font-semibold text-muted-foreground">{new Date(r.executed_at + 'Z').toLocaleString()}</span>
                                                                    <span className="text-[11px] bg-muted/30 px-2 py-0.5 border border-border">{r.rows_returned} rows</span>
                                                                </div>
                                                                <pre className="text-[11px] font-mono whitespace-pre-wrap">{r.result_snapshot}</pre>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {schedules.length === 0 && !loading && (
                            <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No scheduled queries configured.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg shadow-2xl border border-border p-6 flex flex-col gap-6">
                        <h2 className="text-[20px] font-semibold">{editingId ? 'Edit Schedule' : 'New Scheduled Report'}</h2>

                        <div className="space-y-4 text-[13px]">
                            <div>
                                <label className="block text-muted-foreground mb-1 font-medium">Natural Language Query</label>
                                <textarea
                                    className="w-full bg-input-background border border-input p-2 min-h-[80px]"
                                    value={formData.nl_query}
                                    onChange={e => setFormData({ ...formData, nl_query: e.target.value })}
                                    placeholder="e.g. show me high risk transactions from today"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-muted-foreground mb-1 font-medium">Frequency</label>
                                    <select className="w-full bg-input-background border border-input p-2" value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })}>
                                        <option value="minute">Every Minute (Dev)</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-muted-foreground mb-1 font-medium">Delivery Method</label>
                                    <select className="w-full bg-input-background border border-input p-2" value={formData.delivery_method} onChange={e => setFormData({ ...formData, delivery_method: e.target.value })}>
                                        <option value="dashboard">Dashboard Only</option>
                                        <option value="webhook">Webhook Post</option>
                                    </select>
                                </div>
                            </div>

                            {formData.delivery_method === 'webhook' && (
                                <div>
                                    <label className="block text-muted-foreground mb-1 font-medium">Webhook URL</label>
                                    <input
                                        type="url"
                                        className="w-full bg-input-background border border-input p-2"
                                        value={formData.webhook_url || ''}
                                        onChange={e => setFormData({ ...formData, webhook_url: e.target.value })}
                                        placeholder="https://example.com/hook"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 shadow-sm transition-colors">Save Schedule</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
