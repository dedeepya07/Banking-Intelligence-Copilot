import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CollapsibleSQLPanel } from '../components/CollapsibleSQLPanel';
import { Play, Table2, BarChart3, Loader2, AlertCircle, Mic, Square, MapPin, X, Lightbulb, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Fingerprint, Activity, Info, Lock, ShieldAlert, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '../../hooks/useApi';
import { apiService } from '../../services/api.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type QueryState = 'empty' | 'loading' | 'results' | 'error';

export default function QueryAssistantPage() {
  const { executeQuery, result: queryResult, isLoading, error } = useQuery();
  const [query, setQuery] = useState('Show me total transactions for each branch');
  const [sqlOpen, setSqlOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [explainEnabled, setExplainEnabled] = useState(false);
  const sessionId = useMemo(() => uuidv4(), []);
  const [explainOpen, setExplainOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Geo-intelligence feature
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [geoFilter, setGeoFilter] = useState<{ lat: number, lng: number, radius: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!showMap) return;

    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${(import.meta as any).env.VITE_MAPS_API_KEY || ''}`;
      script.async = true;
      script.defer = true;

      const initMapWrapper = () => {
        if (!mapInstance && (window as any).google) {
          initMap();
        }
      };

      (window as any).initMap = initMapWrapper;
      script.onload = initMapWrapper;
      document.head.appendChild(script);
    } else if ((window as any).google && mapRef.current && !mapInstance) {
      initMap();
    }

    function initMap() {
      if (mapRef.current && (window as any).google && !mapInstance) {
        const map = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: 39.8283, lng: -98.5795 },
          zoom: 4,
          mapTypeControl: false,
          streetViewControl: false
        });

        map.addListener('click', async (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const radius = 50; // default 50km

          setGeoFilter({ lat, lng, radius });

          // clear old markers
          markersRef.current.forEach(m => m.setMap(null));
          markersRef.current = [];

          // add center marker
          const centerMarker = new (window as any).google.maps.Marker({
            position: { lat, lng },
            map,
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
            }
          });
          markersRef.current.push(centerMarker);

          // fetch branches
          try {
            const res = await apiService.getNearbyBranches(lat, lng, radius);
            if (res.data?.branches) {
              res.data.branches.forEach(branch => {
                const marker = new (window as any).google.maps.Marker({
                  position: { lat: branch.latitude, lng: branch.longitude },
                  map,
                  title: branch.bank_name
                });
                markersRef.current.push(marker);
              });
            }
          } catch (e) { }
        });

        setMapInstance(map);
      }
    }
  }, [showMap, mapInstance]);

  const handleRunQuery = async () => {
    setCurrentPage(1);
    const finalQuery = geoFilter
      ? `${query} [GEO-FILTERED] branches within ${geoFilter.radius}km of ${geoFilter.lat.toFixed(4)}, ${geoFilter.lng.toFixed(4)}`
      : query;
    await executeQuery({
      natural_language: finalQuery,
      source_type: 'typed',
      session_id: sessionId,
      explain_query: explainEnabled
    });
    setSqlOpen(true);
    setExplainOpen(explainEnabled);
  };

  const startRecording = async () => {
    try {
      setTranscriptionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsTranscribing(true);
        const { data, error: apiError } = await apiService.voiceTranscribe(audioBlob);
        setIsTranscribing(false);

        if (apiError) {
          setTranscriptionError(typeof apiError === 'string' ? apiError : JSON.stringify(apiError));
        } else if (data?.transcribed_text && data.transcribed_text.trim().length > 0) {
          setQuery(data.transcribed_text);
          setCurrentPage(1);
          await executeQuery({ natural_language: data.transcribed_text, source_type: 'voice' });
          setSqlOpen(true);
        } else {
          setTranscriptionError("We couldn't hear you clearly. Please try speaking again.");
        }
      };

      recorder.start();
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorder.current?.state === 'recording') {
          stopRecording();
        }
      }, 30000); // 30 second limit
    } catch (err) {
      setTranscriptionError("Microphone permission denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.onstop = () => {
        mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const queryState: QueryState = isLoading ? 'loading' : error ? 'error' : queryResult ? 'results' : 'empty';

  const results = queryResult?.results || [];
  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  const paginatedResults = useMemo(() => {
    return results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [results, currentPage]);

  const totalPages = Math.ceil(results.length / itemsPerPage);

  const chartData = useMemo(() => {
    if (results.length === 0) return [];

    const labelCol = columns.find(c => typeof results[0][c] === 'string') || columns[0];
    const valueCol = columns.find(c => typeof results[0][c] === 'number') || columns[1];

    if (!labelCol || !valueCol) return [];

    return results.slice(0, 10).map(r => ({
      name: String(r[labelCol]).substring(0, 15),
      value: Number(r[valueCol])
    }));
  }, [results, columns]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-semibold text-foreground mb-1">Query Assistant</h1>
        <p className="text-[14px] text-muted-foreground">Natural language interface for banking data queries</p>
      </div>

      <div className="bg-card border border-border p-5 space-y-4">
        <div className="relative">
          <label className="flex justify-between items-center text-[13px] font-medium text-foreground mb-2">
            <span>Enter your query in natural language</span>
            {isRecording && (
              <span className="text-destructive flex items-center gap-1.5 animate-pulse text-[12px]">
                <span className="w-2 h-2 rounded-full bg-destructive"></span> Listening...
              </span>
            )}
          </label>
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Example: How many transactions were made yesterday?"
              className={`w-full h-28 px-4 py-3 bg-input-background border ${transcriptionError ? 'border-destructive' : 'border-input'} text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none disabled:opacity-50 pr-16`}
              disabled={isLoading || isRecording || isTranscribing}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {isTranscribing ? (
                <div className="p-2 text-muted-foreground" title="Transcribing...">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : isRecording ? (
                <>
                  <button
                    onClick={cancelRecording}
                    className="px-2 py-1.5 text-[12px] bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
                    title="Cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={stopRecording}
                    className="p-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
                    title="Stop & Submit"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={isLoading}
                  className="p-1.5 bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors disabled:opacity-50"
                  aria-label="Speak your query"
                  title="Speak your query"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {transcriptionError && (
            <p className="mt-2 text-[13px] text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {transcriptionError}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Total transactions by branch",
              "High risk transactions today",
              "Average account balance",
              "Top 5 customers by volume",
              "Fraud alerts last 7 days",
              "UPI transactions > 50,000"
            ].map((suggested, i) => (
              <button
                key={i}
                onClick={() => setQuery(suggested)}
                className="px-2 py-1 bg-muted/50 hover:bg-muted border border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {suggested}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] border rounded transition-colors ${showMap ? 'bg-accent text-accent-foreground border-accent' : 'bg-card text-muted-foreground hover:text-foreground hover:border-input'}`}
            >
              <MapPin className="w-4 h-4" /> Geo-Filter
            </button>
            {geoFilter && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 border border-accent text-accent-foreground text-[13px] rounded-full">
                <MapPin className="w-3 h-3" />
                <span>Region Active</span>
                <button onClick={() => setGeoFilter(null)} className="hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <button
              onClick={() => setExplainEnabled(!explainEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] border rounded transition-colors ${explainEnabled ? 'bg-accent/10 border-accent text-accent' : 'bg-card text-muted-foreground hover:text-foreground hover:border-input'}`}
              title="Show detailed reasoning for SQL generation"
            >
              <Fingerprint className="w-4 h-4" /> Explain Query
            </button>
          </div>
          <button
            onClick={handleRunQuery}
            disabled={isLoading || isRecording || isTranscribing || !query.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isLoading || isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isLoading ? 'Processing...' : isTranscribing ? 'Transcribing...' : 'Run Query'}
          </button>
        </div>

        {showMap && (
          <div className="mt-4 border border-border p-3 bg-card rounded animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-medium text-foreground">Select Region</span>
              <span className="text-[12px] text-muted-foreground">Click on the map to filter queries geographically</span>
            </div>
            <div ref={mapRef} className="w-full h-[300px] rounded border border-input overflow-hidden bg-muted" />
          </div>
        )}
      </div>

      {queryResult && (
        <div className="space-y-3">
          <CollapsibleSQLPanel
            sql={queryResult.sql}
            isOpen={sqlOpen}
            onToggle={() => setSqlOpen(!sqlOpen)}
          />

          {queryResult.explanation_details && (
            <div className="bg-card border border-border overflow-hidden">
              <button
                onClick={() => setExplainOpen(!explainOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                  <Fingerprint className="w-4 h-4 text-accent" />
                  <span>Explainable Intelligence Reasoning</span>
                </div>
                {explainOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {explainOpen && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border animate-in slide-in-from-top-1">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Extracted Intent</h4>
                      <p className="text-[13px] text-foreground">{queryResult.explanation_details.parsed_intent}</p>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Entity Resolution</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(queryResult.explanation_details.entity_mapping).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-[11px] rounded">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Policy Reasoning</h4>
                      <ul className="text-[12px] space-y-1 list-disc list-inside text-muted-foreground">
                        {queryResult.explanation_details.join_reasoning.map((r, i) => <li key={i}>{r}</li>)}
                        {queryResult.explanation_details.filter_interpretation.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Aggregation Applied</h4>
                      <p className="text-[12px] font-mono text-accent">{queryResult.explanation_details.aggregation_logic}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {queryResult?.clarification_required && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 space-y-3">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-semibold">Ambiguity Detected - Clarification Required</h4>
          </div>
          <p className="text-[14px] text-foreground">{queryResult.clarification}</p>
          <div className="flex gap-2">
            <button onClick={() => setQuery(query + " ")} className="px-3 py-1.5 bg-amber-500 text-white text-[13px]">Refine Query</button>
          </div>
        </div>
      )}

      {queryState === 'error' && (
        <div className="bg-destructive/10 border border-destructive/30 p-4 flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p className="text-[14px]">{error}</p>
        </div>
      )}

      {queryState === 'results' && queryResult && (
        <div className="bg-card border border-border">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-4">
              <h3 className="text-[16px] font-medium text-foreground">Query Results</h3>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase transition-all
                ${queryResult.query_risk_level === 'high' ? 'bg-destructive/10 text-destructive border-destructive/30 animate-pulse' :
                  queryResult.query_risk_level === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                    'bg-success/10 text-success border-success/30'}`}>
                <ShieldAlert className="w-3 h-3" />
                {queryResult.query_risk_level} risk (Sc: {queryResult.query_risk_score})
              </div>
              {queryResult.is_truncated && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-full text-[11px] font-medium">
                  <AlertCircle className="w-3 h-3" /> Result sets truncated for safety
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-1.5 text-[13px] border ${viewMode === 'table' ? 'bg-accent text-accent-foreground' : 'bg-card'}`}
              >
                <Table2 className="w-4 h-4" /> Table
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-2 px-3 py-1.5 text-[13px] border ${viewMode === 'chart' ? 'bg-accent text-accent-foreground' : 'bg-card'}`}
              >
                <BarChart3 className="w-4 h-4" /> Chart
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {columns.map(col => (
                      <th key={col} className="px-5 py-3 text-left text-[12px] font-semibold uppercase">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedResults.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      {columns.map(col => (
                        <td key={col} className="px-5 py-3 text-[13px]">
                          {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, results.length)} of {results.length}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-[13px] border disabled:opacity-40">Previous</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-[13px] border disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1F6F78" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No chartable data found in results</p>
              )}
            </div>
          )}
        </div>
      )}

      {queryState === 'results' && queryResult?.insights && (
        <div className="bg-card border border-border overflow-hidden">
          <button
            onClick={() => setInsightsOpen(!insightsOpen)}
            className="w-full flex items-center justify-between px-5 py-3 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors border-b border-border"
          >
            <div className="flex items-center gap-2 text-indigo-500">
              <Lightbulb className="w-5 h-5" />
              <h3 className="text-[16px] font-semibold uppercase tracking-tight">Autonomous AI Insights</h3>
            </div>
            {insightsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {insightsOpen && queryResult?.insights && (
            <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div>
                <p className="text-[14px] text-foreground leading-relaxed">
                  {queryResult.insights.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded">
                    <span className="block text-[10px] text-muted-foreground uppercase font-bold">Absolute Change</span>
                    <span className="text-[16px] font-semibold text-indigo-600 font-mono">{queryResult.insights.absolute_change}</span>
                  </div>
                  <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded">
                    <span className="block text-[10px] text-muted-foreground uppercase font-bold">Relative Delta</span>
                    <span className="text-[16px] font-semibold text-indigo-600 font-mono">{queryResult.insights.percentage_change}</span>
                  </div>
                  <div className="px-4 py-2 bg-slate-500/10 border border-slate-500/20 rounded">
                    <span className="block text-[10px] text-muted-foreground uppercase font-bold">7-Day Benchmark</span>
                    <span className="text-[16px] font-semibold text-foreground font-mono">{queryResult.insights.seven_day_avg}</span>
                  </div>
                  <div className="px-4 py-2 bg-success/10 border border-success/20 rounded ml-auto">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-success" />
                      <span className="text-[16px] font-bold text-success">{((queryResult.insights.confidence_level || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <span className="block text-[10px] text-muted-foreground uppercase font-bold">Confidence</span>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground uppercase font-mono flex items-center gap-2">
                  <History className="w-3 h-3" /> Generated at: {queryResult.insights.generated_at ? new Date(queryResult.insights.generated_at).toLocaleTimeString() : 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    Critical Risk Alerts
                  </h4>
                  <div className="space-y-2">
                    {queryResult.insights.risk_alerts && queryResult.insights.risk_alerts.length > 0 ? (
                      queryResult.insights.risk_alerts.map((alert: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/10 rounded">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                          <p className="text-[13px] text-foreground leading-tight">{alert}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] text-muted-foreground italic">No immediate high-risk anomalies detected.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                    Behavioral Trends
                  </h4>
                  <div className="space-y-2">
                    {queryResult.insights.behavioral_trends && queryResult.insights.behavioral_trends.length > 0 ? (
                      queryResult.insights.behavioral_trends.map((trend: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-success/5 border border-success/10 rounded">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                          <p className="text-[13px] text-foreground leading-tight">{trend}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] text-muted-foreground italic">Insufficient volume for behavioral trend mapping.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {queryState === 'empty' && (
        <div className="bg-card border border-border p-12 text-center text-muted-foreground">
          <Play className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-[16px] font-medium text-foreground">No Query Executed</h3>
          <p className="text-[13px] mt-1">Enter a query above to analyze banking data</p>
        </div>
      )}
    </div>
  );
}