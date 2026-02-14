// src/services/skills.ts

import { apiRequest } from './api';
import { Skill, ChangelogEntry } from '../api/types';

export type CreateSkillDto = Pick<Skill, 'name' | 'version' | 'category' | 'description'>;
export type UpdateSkillDto = Partial<Pick<Skill, 'version' | 'enabled' | 'description' | 'config' | 'dependencies'>>;

/**
 * Helper to transform backend Skill data.
 * The data structures are mostly the same.
 */
function transformSkill(data: any): Skill {
  return {
    ...data,
    // Ensure fields exist, even if null/undefined
    enabled: data.enabled !== undefined ? data.enabled : true,
    status: data.status || 'ok',
    latencyAvg: data.latencyAvg || 0,
    latencyP95: data.latencyP95 || 0,
    errorRate: data.errorRate || 0,
    config: data.config || {},
    dependencies: data.dependencies || [],
    changelog: data.changelog || [],
  };
}

/**
 * Fetch all skills.
 */
export async function fetchSkills(): Promise<Skill[]> {
  const data = await apiRequest<any[]>('/skills');
  return data.map(transformSkill);
}

/**
 * Fetch a single skill by ID.
 */
export async function fetchSkill(id: string): Promise<Skill> {
  const data = await apiRequest<any>(`/skills/${id}`);
  return transformSkill(data);
}

/**
 * Create a new skill.
 */
export async function createSkill(skillData: CreateSkillDto): Promise<Skill> {
  const data = await apiRequest<any, CreateSkillDto>('/skills', {
    method: 'POST',
    body: JSON.stringify(skillData),
  });
  return transformSkill(data);
}

/**
 * Update an existing skill.
 */
export async function updateSkill(id: string, skillData: UpdateSkillDto): Promise<Skill> {
  const data = await apiRequest<any, UpdateSkillDto>(`/skills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(skillData),
  });
  return transformSkill(data);
}

/**
 * Delete a skill.
 */
export async function deleteSkill(id: string): Promise<void> {
  await apiRequest<void>(`/skills/${id}`, {
    method: 'DELETE',
  });
}
