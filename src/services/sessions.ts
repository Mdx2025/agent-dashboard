// src/services/sessions.ts

import { apiRequest } from './api';
import { Session } from '../api/types';

export type CreateSessionDto = Pick<Session, 'model' | 'agent'>;
export type UpdateSessionDto = Partial<Pick<Session, 'status'>>;

/**
 * Helper to transform backend Session data.
 * Backend sends ISO strings for timestamps. The frontend's `Session` type expects numbers.
 * The frontend type definition shows `startedAt: number; // Unix ms`.
 * I will convert the ISO strings from the backend to Unix timestamps in milliseconds here.
 */
function transformSession(data: any): Session {
  return {
    ...data,
    startedAt: data.startedAt ? new Date(data.startedAt).getTime() : 0,
    lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt).getTime() : 0,
    agent: data.agentName || '', // Backend uses 'agentName', frontend expects 'agent'
  };
}

/**
 * Fetch all sessions.
 */
export async function fetchSessions(): Promise<Session[]> {
  const data = await apiRequest<any[]>('/sessions');
  return data.map(transformSession);
}

/**
 * Fetch a single session by ID.
 */
export async function fetchSession(id: string): Promise<Session> {
  const data = await apiRequest<any>(`/sessions/${id}`);
  return transformSession(data);
}

/**
 * Create a new session.
 */
export async function createSession(sessionData: CreateSessionDto): Promise<Session> {
  const data = await apiRequest<any, any>('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      model: sessionData.model,
      agentName: sessionData.agent, // Map 'agent' to 'agentName' for the backend
    }),
  });
  return transformSession(data);
}

/**
 * Update an existing session.
 */
export async function updateSession(id: string, sessionData: UpdateSessionDto): Promise<Session> {
  const data = await apiRequest<any, UpdateSessionDto>(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  });
  return transformSession(data);
}

/**
 * Delete a session.
 */
export async function deleteSession(id: string): Promise<void> {
  await apiRequest<void>(`/sessions/${id}`, {
    method: 'DELETE',
  });
}
