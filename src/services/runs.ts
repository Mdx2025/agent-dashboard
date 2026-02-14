// src/services/runs.ts

import { apiRequest } from './api';
import { Run } from '../api/types';

export type CreateRunDto = Pick<Run, 'source' | 'label' | 'model'>;
export type UpdateRunDto = Partial<Pick<Run, 'status' | 'duration' | 'contextPct' | 'tokensIn' | 'tokensOut' | 'finishReason'>>;

/**
 * Helper to transform backend Run data.
 * The backend sends an ISO string for `startedAt`, but the frontend's `Run` type expects a number.
 */
function transformRun(data: any): Run {
  return {
    ...data,
    startedAt: data.startedAt ? new Date(data.startedAt).getTime() : 0,
  };
}

/**
 * Fetch all runs.
 */
export async function fetchRuns(): Promise<Run[]> {
  const data = await apiRequest<any[]>('/runs');
  return data.map(transformRun);
}

/**
 * Fetch a single run by ID.
 */
export async function fetchRun(id: string): Promise<Run> {
  const data = await apiRequest<any>(`/runs/${id}`);
  return transformRun(data);
}

/**
 * Create a new run.
 */
export async function createRun(runData: CreateRunDto): Promise<Run> {
  const data = await apiRequest<any, CreateRunDto>('/runs', {
    method: 'POST',
    body: JSON.stringify(runData),
  });
  return transformRun(data);
}

/**
 * Update an existing run.
 */
export async function updateRun(id: string, runData: UpdateRunDto): Promise<Run> {
  const data = await apiRequest<any, UpdateRunDto>(`/runs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(runData),
  });
  return transformRun(data);
}

/**
 * Delete a run.
 */
export async function deleteRun(id: string): Promise<void> {
  await apiRequest<void>(`/runs/${id}`, {
    method: 'DELETE',
  });
}
