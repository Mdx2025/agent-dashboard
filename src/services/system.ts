// src/services/system.ts

import { apiRequest } from './api';
import { HealthCheck, Service } from '../api/types';

/**
 * Fetch the list of all services.
 */
export async function fetchServices(): Promise<Service[]> {
  const data = await apiRequest<any[]>('/services');
  // The backend and frontend `Service` types are compatible.
  return data;
}

/**
 * Fetch the list of health checks.
 */
export async function fetchHealthChecks(): Promise<HealthCheck[]> {
  const data = await apiRequest<any[]>('/health');
  // The backend and frontend `HealthCheck` types are compatible.
  return data;
}
