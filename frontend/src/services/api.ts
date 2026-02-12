// API Client for Agent Dashboard Backend
// Base URL configured for production (Railway) and development

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Generic API client with error handling
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('dashboard_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown API error');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Initialize API client
const api = new ApiClient(API_BASE_URL);

// ============================================================================
// Overview API
// ============================================================================

export interface SystemOverview {
  active_agents: number;
  total_tokens_used: number;
  active_skills: number;
  system_status: 'healthy' | 'warning' | 'error';
  uptime_seconds: number;
  last_updated: string;
}

export async function getSystemOverview(): Promise<SystemOverview> {
  return api.get<SystemOverview>('/api/overview');
}

// ============================================================================
// Token Usage API
// ============================================================================

export interface TokenUsage {
  agent_id: string;
  agent_name: string;
  tokens_used: number;
  cost_usd: number;
  timestamp: string;
}

export interface TokenUsageStats {
  total_tokens: number;
  total_cost_usd: number;
  by_agent: Record<string, { tokens: number; cost: number }>;
  by_model: Record<string, { tokens: number; cost: number }>;
  hourly_history: Array<{ hour: string; tokens: number }>;
  daily_history: Array<{ date: string; tokens: number }>;
}

export async function getTokenUsageStats(timeRange: 'hour' | 'day' | 'week' = 'hour'): Promise<TokenUsageStats> {
  return api.get<TokenUsageStats>(`/api/token-usage?time_range=${timeRange}`);
}

// ============================================================================
// Agents API
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  model: string;
  default_model: string;
  status: 'active' | 'inactive' | 'error';
  last_active: string;
  total_tokens: number;
  total_cost: number;
  session_count: number;
}

export interface AgentDetail extends Agent {
  skills: Array<{ id: string; name: string; enabled: boolean }>;
  recent_sessions: Array<{ id: string; start_time: string; tokens: number }>;
}

export async function getAgents(): Promise<Agent[]> {
  return api.get<Agent[]>('/api/agents');
}

export async function getAgentDetail(agentId: string): Promise<AgentDetail> {
  return api.get<AgentDetail>(`/api/agents/${agentId}`);
}

// ============================================================================
// Skills API
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  agents: string[];
  usage_count: number;
  last_used: string | null;
}

export async function getSkills(): Promise<Skill[]> {
  return api.get<Skill[]>('/api/skills');
}

export async function toggleSkill(skillId: string, enabled: boolean): Promise<Skill> {
  return api.put<Skill>(`/api/skills/${skillId}`, { enabled });
}

// ============================================================================
// Health API
// ============================================================================

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold?: { warning: number; critical: number };
}

export interface HealthReport {
  overall_status: 'healthy' | 'warning' | 'critical';
  metrics: {
    cpu: HealthMetric;
    memory: HealthMetric;
    disk: HealthMetric;
    network: HealthMetric;
  };
  agent_health: Array<{
    agent_id: string;
    agent_name: string;
    status: 'healthy' | 'warning' | 'error';
    last_check: string;
  }>;
  last_updated: string;
}

export async function getHealthReport(): Promise<HealthReport> {
  return api.get<HealthReport>('/api/health');
}

// ============================================================================
// Logs API
// ============================================================================

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  agent_id: string | null;
  agent_name: string | null;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  page_size: number;
}

export async function getLogs(params: {
  level?: 'debug' | 'info' | 'warning' | 'error';
  agent_id?: string;
  search?: string;
  start_time?: string;
  end_time?: string;
  page?: number;
  page_size?: number;
}): Promise<LogsResponse> {
  const query = new URLSearchParams(params as Record<string, string>);
  return api.get<LogsResponse>(`/api/logs?${query}`);
}

// ============================================================================
// Export API client
// ============================================================================

export { api };
export default api;
