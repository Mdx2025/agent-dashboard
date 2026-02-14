// src/services/agents.ts

import { apiRequest } from './api';
import { Agent } from '../api/types';

// Type for creating an agent (subset of Agent fields)
export type CreateAgentDto = Pick<Agent, 'name' | 'type' | 'model' | 'provider' | 'description'>;

// Type for updating an agent (all optional fields)
export type UpdateAgentDto = Partial<Pick<Agent, 'name' | 'type' | 'model' | 'provider' | 'status' | 'description'>>;

/**
 * Helper function to transform backend Agent data to frontend Agent type.
 * The backend sends ISO date strings for timestamps, but the frontend expects numbers.
 */
function transformAgent(data: any): Agent {
  return {
    ...data,
    // The backend returns ISO strings (e.g., "2026-02-14T02:00:00.000Z"),
    // but the frontend expects Unix timestamps in milliseconds.
    // We'll just send the ISO string to the frontend for now and let it handle the conversion in its display logic.
    // For now, we will leave the timestamps as strings from the backend.
    // Ideally, the frontend's types would be updated, but we can't change the frontend's source.
    // However, the frontend types explicitly state `createdAt: string; // ISO 8601`. So my original thought was correct.
    createdAt: data.createdAt,
    // Ensure the 'errors' field is an array
    errors: Array.isArray(data.errors) ? data.errors : [],
  };
}

/**
 * Fetch all agents.
 */
export async function fetchAgents(): Promise<Agent[]> {
  const data = await apiRequest<any[]>('/agents');
  return data.map(transformAgent);
}

/**
 * Fetch a single agent by ID.
 */
export async function fetchAgent(id: string): Promise<Agent> {
  const data = await apiRequest<any>(`/agents/${id}`);
  return transformAgent(data);
}

/**
 * Create a new agent.
 */
export async function createAgent(agentData: CreateAgentDto): Promise<Agent> {
  const data = await apiRequest<any, CreateAgentDto>('/agents', {
    method: 'POST',
    body: JSON.stringify(agentData),
  });
  return transformAgent(data);
}

/**
 * Update an existing agent.
 */
export async function updateAgent(id: string, agentData: UpdateAgentDto): Promise<Agent> {
  const data = await apiRequest<any, UpdateAgentDto>(`/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(agentData),
  });
  return transformAgent(data);
}

/**
 * Delete an agent.
 */
export async function deleteAgent(id: string): Promise<void> {
  await apiRequest<void>(`/agents/${id}`, {
    method: 'DELETE',
  });
}
