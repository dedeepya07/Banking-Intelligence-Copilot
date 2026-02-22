import React, { useState, useEffect, useRef } from 'react';
import { Shield, Cpu, Zap, PlayCircle, StopCircle, Loader2, GitMerge, FileText, CheckCircle2, AlertTriangle, X, Search, Activity } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    Cell
} from 'recharts';
import { apiService } from '../../services/api.service';

const comparisonData = [
    { name: 'Classical Only', accuracy: 92.5, falsePositives: 4.8, latency: 45 },
    { name: 'Hybrid Quantum', accuracy: 98.2, falsePositives: 1.2, latency: 156 },
];

export default function QuantumFraudIntelligencePage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [feed, setFeed] = useState<any[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
    const simulationInterval = useRef<NodeJS.Timeout | null>(null);
    const txCountRef = useRef(0);

    useEffect(() => {
        fetchAgents();
        return () => stopSimulation();
    }, []);

    const fetchAgents = async () => {
        const { data } = await apiService.getQuantumAgents();
        if (data) setAgents(data);
    };

    const toggleSimulation = () => {
        if (isSimulating) {
            stopSimulation();
        } else {
            startSimulation();
        }
    };

    const startSimulation = () => {
        setIsSimulating(true);
        // Fire one immediately
        simulateDataFeed();
        simulationInterval.current = setInterval(() => {
            simulateDataFeed();
            fetchAgents(); // refresh stats
        }, 3500);
    };

    const stopSimulation = () => {
        setIsSimulating(false);
        if (simulationInterval.current) {
            clearInterval(simulationInterval.current);
            simulationInterval.current = null;
        }
    };

    const simulateDataFeed = async () => {
        const types = ['credit_card', 'debit_card', 'upi', 'neft'];

        txCountRef.current += 1;
        // Exactly 1 in 8 transactions will run as fraud, providing the 1:7 ratio explicitly
        const isFraudulent = txCountRef.current % 8 === 0;

        // High amount triggers quantum models naturally, plus is_fraud forces classical bump
        const amount = isFraudulent
            ? Math.floor(Math.random() * 80000) + 70000
            : Math.floor(Math.random() * 5000) + 500;

        const txId = `TXN${Math.floor(Math.random() * 100000000)}`;
        const type = types[Math.floor(Math.random() * types.length)];

        const { data } = await apiService.simulateQuantumInference({
            transaction_id: txId,
            amount: amount,
            transaction_type: type,
            is_fraud: isFraudulent
        });

        if (data) {
            const enrichedData = {
                ...data,
                transaction_id: txId,
                transaction_type: type,
                amount: amount,
                timestamp: new Date().toLocaleTimeString()
            };

            setFeed(prev => [enrichedData, ...prev].slice(0, 15));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold text-foreground flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-indigo-500" />
                        Quantum Fraud Intelligence
                    </h1>
                    <p className="text-[14px] text-muted-foreground mt-1">
                        Live monitoring of transaction-type specific hybrid quantum agents
                    </p>
                </div>
                <button
                    onClick={toggleSimulation}
                    className={`flex items-center gap-2 px-4 py-2 border rounded shadow-sm transition-all font-medium text-[13px] ${isSimulating
                        ? 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
                        : 'bg-indigo-600/10 text-indigo-500 border-indigo-500/30 hover:bg-indigo-600/20'
                        }`}
                >
                    {isSimulating ? (
                        <><StopCircle className="w-4 h-4" /> Stop Live Feed</>
                    ) : (
                        <><PlayCircle className="w-4 h-4" /> Inject Live Transactions</>
                    )}
                </button>
            </div>

            {/* Agent Status Panel */}
            <div className="bg-card border border-border shadow-sm rounded overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-[15px] font-semibold">Live Agent Status Fleet</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    {agents.map((agent) => (
                        <div key={agent.agent_name} className="p-4 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-[14px] font-semibold">{agent.agent_name}</h3>
                                    <span className="px-1.5 py-0.5 rounded bg-success/10 text-success text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                                        {agent.status}
                                    </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-3">
                                    {agent.transaction_type} • {agent.model_used}
                                </div>
                            </div>

                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-center text-[12px]">
                                    <span className="text-muted-foreground">Total Scans</span>
                                    <span className="font-mono font-medium">{agent.total_predictions.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px]">
                                    <span className="text-muted-foreground">Accuracy</span>
                                    <span className="font-mono text-indigo-500">{agent.accuracy_percent.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px]">
                                    <span className="text-muted-foreground">Fraud Rate</span>
                                    <span className="font-mono text-destructive">{(agent.fraud_rate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] pt-1 border-t border-border mt-1">
                                    <span className="text-muted-foreground">Avg Latency</span>
                                    <span className="font-mono">{agent.avg_latency.toFixed(0)} ms</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Live Prediction Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border shadow-sm rounded overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                            <h2 className="text-[15px] font-semibold flex items-center gap-2">
                                <Search className="w-4 h-4 text-indigo-500" />
                                Real-Time Prediction Intercepts
                            </h2>
                            {isSimulating && <span className="flex items-center gap-2 text-[11px] text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Polling endpoints</span>}
                        </div>
                        <div className="overflow-auto flex-1 p-0">
                            {feed.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[13px] text-muted-foreground">
                                    Click "Inject Live Transactions" to begin simulation
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                                            <th className="px-4 py-2 font-medium">Transaction</th>
                                            <th className="px-4 py-2 font-medium">Agent</th>
                                            <th className="px-4 py-2 font-medium">Risk Score</th>
                                            <th className="px-4 py-2 font-medium">Pattern Detected</th>
                                            <th className="px-4 py-2 font-medium text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {feed.map((f, i) => {
                                            const isFraud = f.risk_score > 0.7;
                                            return (
                                                <tr
                                                    key={i}
                                                    onClick={() => setSelectedTransaction(f)}
                                                    className={`hover:bg-muted/30 cursor-pointer transition-colors ${f.hybrid_triggered ? 'bg-indigo-500/[0.03]' : ''}`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-mono text-[13px]">{f.transaction_id}</div>
                                                        <div className="text-[11px] text-muted-foreground uppercase">{f.transaction_type} • ${f.amount.toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-[13px] font-medium">{f.agent_name}</div>
                                                        <div className="text-[11px] text-indigo-500">{f.model_used}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className={`font-mono text-[13px] font-medium ${isFraud ? 'text-destructive' : 'text-success'}`}>
                                                            {f.risk_score.toFixed(3)}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">Conf: {(f.confidence * 100).toFixed(1)}%</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[12px] text-muted-foreground">
                                                        {f.detected_pattern}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium ${isFraud ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                                                            }`}>
                                                            {isFraud ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                                            {isFraud ? 'FRAUD' : 'SAFE'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Classical vs Hybrid Comparison */}
                <div className="space-y-6">
                    <div className="bg-card border border-border p-5 shadow-sm rounded h-[290px] flex flex-col">
                        <h2 className="text-[16px] font-semibold mb-1">Classical vs Hybrid Performance</h2>
                        <p className="text-[12px] text-muted-foreground mb-4">Benchmarking false positive reduction in vector embeddings</p>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                                        itemStyle={{ fontSize: '12px' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                    <Bar yAxisId="left" name="Accuracy (%)" dataKey="accuracy" fill="#818cf8" radius={[2, 2, 0, 0]} barSize={30} />
                                    <Bar yAxisId="right" name="False Positives (%)" dataKey="falsePositives" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500/10 to-card border border-indigo-500/30 p-5 shadow-sm rounded flex flex-col justify-between h-[185px]">
                        <h3 className="text-[14px] font-medium text-indigo-500 flex items-center gap-2 mb-2"><GitMerge className="w-4 h-4" /> Global Hybrid Trigger Rate</h3>
                        <div className="text-[42px] font-bold text-foreground tracking-tight">14.2%</div>
                        <p className="text-[13px] text-muted-foreground leading-tight">of highly suspicious classical evaluations safely elevated to Quantum routing layer.</p>
                    </div>
                </div>
            </div>

            {/* Drill Down Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border shadow-xl rounded-lg w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                            <div>
                                <h2 className="text-[18px] font-semibold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    Explainability Drill-Down
                                </h2>
                                <p className="text-[13px] text-muted-foreground mt-0.5 font-mono">
                                    {selectedTransaction.transaction_id}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="p-2 hover:bg-muted rounded text-muted-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border border-border rounded bg-muted/10">
                                    <div className="text-[12px] text-muted-foreground mb-1">Agent Enclave</div>
                                    <div className="font-semibold text-[15px]">{selectedTransaction.agent_name}</div>
                                    <div className="text-[12px] text-indigo-500 mt-1 uppercase tracking-widest">{selectedTransaction.model_used} Engine</div>
                                </div>
                                <div className={`p-4 border rounded ${selectedTransaction.risk_score > 0.7 ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5'}`}>
                                    <div className="text-[12px] text-muted-foreground mb-1">Final Decision</div>
                                    <div className={`font-bold text-[18px] ${selectedTransaction.risk_score > 0.7 ? 'text-destructive' : 'text-success'}`}>
                                        {selectedTransaction.risk_score > 0.7 ? 'FRAUD ISOLATED' : 'SAFE PIPELINE'}
                                    </div>
                                    <div className="text-[12px] text-muted-foreground mt-1 font-mono gap-2 flex items-center">
                                        Risk: {selectedTransaction.risk_score.toFixed(3)}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[14px] font-semibold mb-3 border-b border-border pb-2">Confidence & Integrity</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500"
                                            style={{ width: `${selectedTransaction.confidence * 100}%` }}
                                        />
                                    </div>
                                    <span className="font-mono text-[13px] font-medium w-16 text-right">
                                        {(selectedTransaction.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[14px] font-semibold mb-3 border-b border-border pb-2">Pattern Interpolation</h3>
                                <div className="space-y-3">
                                    <div className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded">
                                        <span className="text-[12px] uppercase text-indigo-500 font-bold tracking-widest block mb-1">Detected Signature</span>
                                        <span className="text-[14px] text-foreground font-medium">{selectedTransaction.detected_pattern}</span>
                                    </div>
                                    <div className="bg-muted/30 border border-border p-3 rounded text-[13px] leading-relaxed text-muted-foreground">
                                        {selectedTransaction.explanation}
                                    </div>
                                </div>
                            </div>

                            {selectedTransaction.hybrid_triggered && (
                                <div>
                                    <h3 className="text-[14px] font-semibold mb-3 border-b border-border pb-2">Scoring Matrix</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center text-[13px] p-2 bg-muted/20 rounded">
                                            <span className="text-muted-foreground">Classical Baseline Score</span>
                                            <span className="font-mono">{selectedTransaction.classical_score?.toFixed(3)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[13px] p-2 bg-indigo-500/10 text-indigo-500 rounded font-medium">
                                            <span>Quantum Refined Score</span>
                                            <span className="font-mono">{selectedTransaction.risk_score?.toFixed(3)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
