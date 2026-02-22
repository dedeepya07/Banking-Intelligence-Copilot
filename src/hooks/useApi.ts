// React hooks for backend integration
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import {
  QueryRequest,
  QueryResponse,
  ContextChatRequest,
  ContextChatResponse,
  Transaction,
  SystemMetrics,
  HealthStatus
} from '../services/api.config';

// Hook for querying the database
export function useQuery() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);

  const executeQuery = useCallback(async (request: QueryRequest) => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.query(request);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setResult(response.data);
    }

    setIsLoading(false);
    return response.data;
  }, []);

  return { executeQuery, result, isLoading, error };
}

// Hook for context chat
export function useContextChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const sendMessage = useCallback(async (request: ContextChatRequest) => {
    setIsLoading(true);
    setError(null);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: request.user_input }]);

    const response = await apiService.contextChat(request);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: response.data!.response }]);
    }

    setIsLoading(false);
    return response.data;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { sendMessage, messages, isLoading, error, clearMessages };
}

// Hook for transactions
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (limit: number = 100) => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.getTransactions(limit);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setTransactions(response.data);
    }

    setIsLoading(false);
  }, []);

  return { transactions, fetchTransactions, isLoading, error };
}

// Hook for system metrics
export function useMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.getMetrics();

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setMetrics(response.data);
    }

    setIsLoading(false);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, fetchMetrics, isLoading, error };
}

// Hook for health status
export function useHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.getHealth();

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setHealth(response.data);
    }

    setIsLoading(false);
  }, []);

  // Auto-check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { health, checkHealth, isLoading, error };
}

// Hook for agents
export function useAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.getAgents();

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setAgents(response.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, fetchAgents, isLoading, error };
}// Hook for audit logs
export function useAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (userId: number) => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.getAuditLogs(userId);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setLogs(response.data);
    }

    setIsLoading(false);
  }, []);

  return { logs, fetchLogs, isLoading, error };
}
export function useHighRiskTransactions(threshold: number = 0.7) {
  const [highRisk, setHighRisk] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHighRisk = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.getHighRiskTransactions(threshold);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setHighRisk(response.data);
    }

    setIsLoading(false);
  }, [threshold]);

  useEffect(() => {
    fetchHighRisk();
  }, [fetchHighRisk]);

  return { highRisk, fetchHighRisk, isLoading, error };
}
