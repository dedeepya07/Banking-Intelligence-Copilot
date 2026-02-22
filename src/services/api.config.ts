// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',

  // Query
  QUERY: '/api/query',
  SCHEMA: '/api/schema',
  VOICE_TRANSCRIBE: '/api/voice-transcribe',
  SCHEDULED_QUERIES: '/api/scheduled',

  // Context Chat
  CONTEXT_CHAT: '/api/context/chat',
  CONTEXT_HISTORY: (sessionId: string) => `/api/context/history/${sessionId}`,
  CONTEXT_SEARCH: '/api/context/search',
  CONTEXT_STATS: (sessionId: string) => `/api/context/stats/${sessionId}`,
  CONTEXT_DELETE: '/api/context/delete',

  // Transactions
  TRANSACTIONS: '/api/transactions',
  HIGH_RISK: '/api/fraud/high-risk',
  QUANTUM_METRICS: '/api/quantum/metrics',
  QUANTUM_SIMULATE: '/api/quantum/simulate',
  QUANTUM_AGENTS: '/api/quantum/agents/status',

  // Agents
  AGENTS: '/api/agents',
  AGENT: (id: number) => `/api/agents/${id}`,
  AGENT_STATUS: (id: string) => `/api/agents/${id}/status`,
  QUERY_LOGS: '/api/query-logs',

  // System
  METRICS: '/api/metrics',
  HEALTH: '/api/health',
  BRANCHES_NEARBY: '/api/branches/nearby',

  // Audit
  AUDIT_LOGS: (userId: number) => `/api/audit/${userId}`,
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ContextChatRequest {
  user_input: string;
  session_id: string;
  context_type?: string;
  metadata?: Record<string, any>;
}

export interface ContextChatResponse {
  response: string;
  context_id: string;
  session_id: string;
  context_used: boolean;
  context_length: number;
  processing_time_ms: number;
  context_summary: string;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  role: string;
}

export interface QueryRequest {
  natural_language: string;
  source_type?: string;
  session_id?: string;
  explain_query?: boolean;
}

export interface InsightAlert {
  summary: string;
  risk_alerts: string[];
  behavioral_trends: string[];
  absolute_change?: string;
  percentage_change?: string;
  seven_day_avg?: string;
  comparison_window?: string;
  confidence_level: number;
  generated_at: string;
}

export interface QueryExplanation {
  parsed_intent: string;
  entity_mapping: Record<string, any>;
  join_reasoning: string[];
  filter_interpretation: string[];
  aggregation_logic: string;
}

export interface QueryResponse {
  sql: string;
  params: Record<string, any>;
  explanation: string;
  confidence: number;
  clarification?: string;
  clarification_required?: boolean;
  results: any[];
  execution_time_ms: number;
  insights?: InsightAlert;
  explanation_details?: QueryExplanation;
  query_risk_level?: 'low' | 'medium' | 'high';
  query_risk_score?: number;
  is_truncated?: boolean;
}

export interface VoiceTranscribeResponse {
  transcribed_text: string;
  detected_language: string;
  latency_ms: number;
}

export interface AuditLogEntry {
  id: number;
  user_id?: number;
  action: string;
  resource?: string;
  query?: string;
  execution_time_ms?: number;
  error_message?: string;
  timestamp: string;
  role?: string;
  nl_query?: string;
  generated_sql?: string;
  rows_returned?: number;
  source_type?: string;
  suspicious_flag?: boolean;
  ip_address?: string;
  status: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  customer_name?: string;
  amount: number;
  transaction_type: string;
  timestamp: string;
  risk_score: number;
  risk_level: string;
  model_used?: string;
  fraud_flag: boolean;
}

export interface SystemMetrics {
  total_queries: number;
  avg_query_time_ms: number;
  total_transactions: number;
  fraud_detection_rate: number;
  active_agents: number;
  uptime_seconds: number;
  total_voice_requests: number;
  voice_success_count: number;
  voice_failure_count: number;
  avg_transcription_latency_ms: number;
  total_audit_entries: number;
  suspicious_query_count: number;
  total_scheduled_jobs: number;
  scheduled_success_count: number;
  scheduled_failure_count: number;
  average_scheduled_execution_time_ms: number;
  geo_filtered_queries_count: number;
  total_quantum_inferences: number;
  hybrid_trigger_rate: number;
  classical_vs_quantum_accuracy: number;
  avg_quantum_latency_ms: number;
  total_agent_predictions?: number;
  hybrid_agent_usage_rate?: number;
  total_queries_logged?: number;
  blocked_query_rate: number;
  total_insights_generated: number;
  average_query_execution_time: number;
  avg_llm_latency: number;
  avg_sql_validation_time: number;
  clarification_rate: number;
  policy_block_rate: number;
  query_success_rate: number;
}

export interface ScheduledQueryCreate {
  nl_query: string;
  frequency: string;
  delivery_method: string;
  webhook_url?: string;
  is_active: boolean;
}

export interface ScheduledQuery extends ScheduledQueryCreate {
  id: number;
  user_id: number;
  last_run?: string;
  next_run?: string;
  created_at: string;
}

export interface ScheduledResult {
  id: number;
  scheduled_query_id: number;
  generated_sql: string;
  rows_returned: number;
  execution_time_ms: number;
  result_snapshot: string;
  executed_at: string;
}

export interface HealthStatus {
  status: string;
  timestamp: number;
  version: string;
  llm_status: {
    llm_available: boolean;
    service: string;
    openai_configured: boolean;
    ollama_configured: boolean;
  };
}

export interface BankBranch {
  id: number;
  branch_id: string;
  bank_name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  address?: string;
  is_active: boolean;
  distance_km?: number;
}

export interface NearbyBranchResponse {
  branches: BankBranch[];
  count: number;
}
