// API Service - Handles all backend communication
import {
  API_BASE_URL,
  API_ENDPOINTS,
  ApiResponse,
  ContextChatRequest,
  ContextChatResponse,
  LoginRequest,
  LoginResponse,
  QueryRequest,
  QueryResponse,
  VoiceTranscribeResponse,
  Transaction,
  SystemMetrics,
  HealthStatus,
  ScheduledQuery,
  ScheduledQueryCreate,
  ScheduledResult,
  NearbyBranchResponse
} from './api.config';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const status = response.status;

      if (!response.ok) {
        const errorText = await response.text();

        // Handle expired or invalid tokens globally
        if (status === 401 && !url.includes('/login')) {
          this.setToken(null);
          localStorage.removeItem('auth_user');
          sessionStorage.clear();
          window.location.href = '/';
        }

        return {
          error: errorText || `HTTP ${status} Error`,
          status,
        };
      }

      // Handle empty responses
      if (response.status === 204) {
        return { status, data: undefined as T };
      }

      const data = await response.json();
      return { data, status };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network Error',
        status: 0,
      };
    }
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.access_token) {
      this.setToken(response.data.access_token);
    }

    return response;
  }

  logout() {
    this.setToken(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Health Check
  async getHealth(): Promise<ApiResponse<HealthStatus>> {
    return this.request<HealthStatus>(API_ENDPOINTS.HEALTH);
  }

  // Query
  async query(request: QueryRequest): Promise<ApiResponse<QueryResponse>> {
    return this.request<QueryResponse>(API_ENDPOINTS.QUERY, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async voiceTranscribe(audioBlob: Blob): Promise<ApiResponse<VoiceTranscribeResponse>> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    return this.request<VoiceTranscribeResponse>(API_ENDPOINTS.VOICE_TRANSCRIBE, {
      method: 'POST',
      body: formData,
    });
  }

  async getSchema(): Promise<ApiResponse<{ tables: Record<string, string[]> }>> {
    return this.request<{ tables: Record<string, string[]> }>(API_ENDPOINTS.SCHEMA);
  }

  // Context Chat
  async contextChat(request: ContextChatRequest): Promise<ApiResponse<ContextChatResponse>> {
    return this.request<ContextChatResponse>(API_ENDPOINTS.CONTEXT_CHAT, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getContextHistory(sessionId: string, limit?: number): Promise<ApiResponse<any>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<any>(API_ENDPOINTS.CONTEXT_HISTORY(sessionId) + params);
  }

  async searchContext(sessionId: string, query: string, searchType: string = 'semantic'): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(API_ENDPOINTS.CONTEXT_SEARCH, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, query, search_type: searchType }),
    });
  }

  async getContextStats(sessionId: string): Promise<ApiResponse<any>> {
    return this.request<any>(API_ENDPOINTS.CONTEXT_STATS(sessionId));
  }

  // Transactions
  async getTransactions(limit: number = 100): Promise<ApiResponse<Transaction[]>> {
    return this.request<Transaction[]>(`${API_ENDPOINTS.TRANSACTIONS}?limit=${limit}`);
  }

  async getHighRiskTransactions(threshold: number = 0.7): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`${API_ENDPOINTS.HIGH_RISK}?threshold=${threshold}`);
  }

  // Agents
  async getAgents(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(API_ENDPOINTS.AGENTS);
  }

  async getAgent(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(API_ENDPOINTS.AGENT(id));
  }

  // Metrics
  async getMetrics(): Promise<ApiResponse<SystemMetrics>> {
    return this.request<SystemMetrics>(API_ENDPOINTS.METRICS);
  }

  // Audit
  async getAuditLogs(userId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(API_ENDPOINTS.AUDIT_LOGS(userId));
  }

  // Scheduled Queries
  async getScheduledQueries(): Promise<ApiResponse<ScheduledQuery[]>> {
    return this.request<ScheduledQuery[]>(API_ENDPOINTS.SCHEDULED_QUERIES);
  }

  async createScheduledQuery(data: ScheduledQueryCreate): Promise<ApiResponse<ScheduledQuery>> {
    return this.request<ScheduledQuery>(API_ENDPOINTS.SCHEDULED_QUERIES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScheduledQuery(id: number, data: ScheduledQueryCreate): Promise<ApiResponse<ScheduledQuery>> {
    return this.request<ScheduledQuery>(`${API_ENDPOINTS.SCHEDULED_QUERIES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScheduledQuery(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`${API_ENDPOINTS.SCHEDULED_QUERIES}/${id}`, {
      method: 'DELETE',
    });
  }

  async getScheduledResults(id: number): Promise<ApiResponse<ScheduledResult[]>> {
    return this.request<ScheduledResult[]>(`${API_ENDPOINTS.SCHEDULED_QUERIES}/${id}/results`);
  }

  // Branches
  async getNearbyBranches(lat: number, lng: number, radius: number = 10): Promise<ApiResponse<NearbyBranchResponse>> {
    return this.request<NearbyBranchResponse>(`${API_ENDPOINTS.BRANCHES_NEARBY}?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Quantum Fraud
  async getQuantumMetrics(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(API_ENDPOINTS.QUANTUM_METRICS);
  }

  async getQuantumAgents(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(API_ENDPOINTS.QUANTUM_AGENTS);
  }

  async simulateQuantumInference(data: { transaction_id: string, amount: number, transaction_type?: string, is_fraud?: boolean }): Promise<ApiResponse<any>> {
    return this.request<any>(API_ENDPOINTS.QUANTUM_SIMULATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQueryLogs(params: { suspicious_only?: boolean, user_id?: number, source_type?: string } = {}): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params.suspicious_only) queryParams.append('suspicious_only', 'true');
    if (params.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params.source_type) queryParams.append('source_type', params.source_type);

    return this.request<any[]>(`${API_ENDPOINTS.QUERY_LOGS}?${queryParams.toString()}`);
  }
}

// Create singleton
export const apiService = new ApiService();

// Export class for testing
export { ApiService };
