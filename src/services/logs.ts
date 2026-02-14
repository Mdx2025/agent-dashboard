// src/services/logs.ts

import { apiRequest } from './api';
import { LogEntry } from '../api/types';

export type CreateLogDto = Pick<LogEntry, 'level' | 'source' | 'message' | 'runId' | 'requestId' | 'extra'>;

/**
 * Helper to transform backend LogEntry data.
 * The backend sends an ISO string for `timestamp`, but the frontend's `LogEntry` type expects a number.
 */
function transformLog(data: any): LogEntry {
  return {
    ...data,
    timestamp: data.timestamp ? new Date(data.timestamp).getTime() : 0,
  };
}

/**
 * Fetch all log entries.
 */
export async function fetchLogs(): Promise<LogEntry[]> {
  const data = await apiRequest<any[]>('/logs');
  return data.map(transformLog);
}

/**
 * Create a new log entry.
 */
export async function createLog(logData: CreateLogDto): Promise<LogEntry> {
  const data = await apiRequest<any, CreateLogDto>('/logs', {
    method: 'POST',
    body: JSON.stringify(logData),
  });
  return transformLog(data);
}
