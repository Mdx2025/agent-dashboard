// src/tabs/OverviewTab.tsx

import React, { useState, useEffect } from 'react';
import { fetchAgents, fetchSessions, fetchRuns } from '../services';
import { Agent, Session, Run } from '../api/types';

export function OverviewTab() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      const [agentsData, sessionsData, runsData] = await Promise.all([
        fetchAgents(),
        fetchSessions(),
        fetchRuns()
      ]);
      setAgents(agentsData);
      setSessions(sessionsData);
      setRuns(runsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading overview...</div>;
  if (error) return <div className="p-4" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Overview</h1>
      <p className="mb-6 text-gray-600">Real-time agent operations monitoring</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Agents Summary */}
        <div className="p-4 border rounded shadow-md">
          <h2 className="text-xl font-semibold mb-2">Agents</h2>
          <p className="text-4xl font-bold mb-2">{agents.length}</p>
          <p className="text-sm text-gray-500">Total registered agents</p>
        </div>

        {/* Sessions Summary */}
        <div className="p-4 border rounded shadow-md">
          <h2 className="text-xl font-semibold mb-2">Active Sessions</h2>
          <p className="text-4xl font-bold mb-2">{sessions.filter(s => s.status === 'active').length}</p>
          <p className="text-sm text-gray-500">Currently active sessions</p>
        </div>

        {/* Runs Summary */}
        <div className="p-4 border rounded shadow-md">
          <h2 className="text-xl font-semibold mb-2">Runs (24h)</h2>
          <p className="text-4xl font-bold mb-2">{runs.length}</p>
          <p className="text-sm text-gray-500">Total runs tracked</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Agents */}
        <div className="border rounded p-4 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Agents</h2>
          {agents.length === 0 ? (
            <p>No agents found.</p>
          ) : (
            <ul className="space-y-2">
              {agents.slice(0, 5).map((agent) => (
                <li key={agent.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.model} ({agent.provider})</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {agent.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Runs */}
        <div className="border rounded p-4 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Runs</h2>
          {runs.length === 0 ? (
            <p>No runs found.</p>
          ) : (
            <ul className="space-y-2">
              {runs.slice(0, 5).map((run) => (
                <li key={run.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{run.label}</p>
                    <p className="text-sm text-gray-500">{run.model} - {new Date(run.startedAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    run.status === 'finished' ? 'bg-green-100 text-green-800' : 
                    run.status === 'failed' ? 'bg-red-100 text-red-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {run.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
