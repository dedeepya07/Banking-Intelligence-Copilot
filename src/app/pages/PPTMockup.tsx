import React from 'react';

const PPTMockup = () => {
    return (
        <div style={{ background: '#0a0e14', color: '#fff', minHeight: '100vh', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        THE QUANTUM GUARD | Triage Center
                    </h1>
                    <p style={{ opacity: 0.6 }}>Real-time Internal Fraud Early Warning System</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>UNION BANK HUB</div>
                    <div style={{ color: '#00ff88' }}>● SYSTEM ACTIVE</div>
                </div>
            </header>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                {['Total Scanned', 'Active Baselines', 'High Risk Alerts', 'Avg. Response'].map((label, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ opacity: 0.5, fontSize: '12px' }}>{label}</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{i === 2 ? '14' : i === 3 ? '450ms' : '1.2M+'}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '30px' }}>
                {/* Alert Queue */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '15px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ marginBottom: '20px' }}>Critical Investigation Queue</h3>
                    {[
                        { user: 'Admin-05', risk: 89, reason: 'Bulk PII Extraction (Off-hours)', time: '3 mins ago' },
                        { user: 'Teller-12', risk: 74, reason: 'Unauthorized Account Modification', time: '12 mins ago' },
                        { user: 'Manager-02', risk: 68, reason: 'Frequent Cross-Branch Queries', time: '45 mins ago' }
                    ].map((alert, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px', marginBottom: '10px', borderLeft: `4px solid ${alert.risk > 80 ? '#ff3366' : '#ffa500'}` }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{alert.user}</div>
                                <div style={{ fontSize: '13px', opacity: 0.7 }}>{alert.reason}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: '#ff3366', fontWeight: 'bold' }}>{alert.risk}% RISK</div>
                                <div style={{ fontSize: '11px', opacity: 0.4 }}>{alert.time}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quantum Analysis Card */}
                <div style={{ background: 'linear-gradient(135deg, #1a1b3a 0%, #0a0b1e 100%)', padding: '25px', borderRadius: '15px', border: '1px solid #3a3b7a' }}>
                    <h3 style={{ marginBottom: '15px', color: '#8a2be2' }}>Quantum Engine Logs</h3>
                    <div style={{ fontSize: '12px', background: 'black', padding: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ color: '#00ff00' }}>[INIT] Quantum Interference Mapping...</div>
                        <div style={{ color: '#fff' }}>[CALC] Phase shift detected in User:Admin-05</div>
                        <div style={{ color: '#00d2ff' }}>[SHAP] Contribution: Extraction_Size (0.45)</div>
                        <div style={{ color: '#00d2ff' }}>[SHAP] Contribution: Access_Time (0.32)</div>
                        <div style={{ color: '#ff3366', fontWeight: 'bold' }}>[ALERT] HYBRID SCORE: 0.89</div>
                    </div>
                    <div style={{ marginTop: '20px', fontSize: '13px', opacity: 0.8 }}>
                        The model utilizes high-dimensional state vectors to detect non-linear behavioral shifts. 
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PPTMockup;
