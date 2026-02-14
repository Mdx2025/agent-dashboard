// src/tabs/UsageTab.tsx

import React, { useState, useEffect } from 'react';
import { fetchAgents, fetchSessions, fetchRuns } from '../services';
import { Agent, Session, Run } from '../api/types';

export function UsageTab() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
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
      setError(err.message || 'Failed to fetch usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading usage data...</div>;
  if (error) return <div className="p-4" style={{ color: 'red' }}>Error: {error}</div>;

  // Calculate some basic metrics
  const totalTokensIn = runs.reduce((sum, run) => sum + (run.tokensIn || 0), 0);
  const totalTokensOut = runs.reduce((sum, run) => sum + (run.tokensOut || 0), 0);
  const avgContextPct = runs.length > 0 
    ? Math.round(runs.reduce((sum, run) => sum + (run.contextPct || 0), 0) / runs.length) 
    : 0;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Usage & Metrics</h1>
      <p className="mb-6 text-gray-600">Detailed metrics on agent usage and system performance.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Tokens In */}
        <div className="border rounded p-4 shadow-md text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Total Tokens In</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totalTokensIn.toLocaleString()}</p>
        </div>

        {/* Total Tokens Out */}
        <div className="border rounded p-4 shadow-md text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Total Tokens Out</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{totalTokensOut.toLocaleString()}</p>
        </div>

        {/* Avg Context Usage */}
        <div className="border rounded p-4 shadow-md text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Avg Context Usage</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{avgContextPct}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agents by Runs */}
        <div className="border rounded p-4 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Agents (24h Runs)</h2>
          {agents.length === 0 ? (
            <p>No agents found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-right py-2">Runs</th>
                  <th className="text-right py-2">Errors</th>
                  <th className="text-right py-2">Cost ($)</th>
                </tr>
              </thead>
              <tbody>
                {agents
                  .sort((a, b) => b.runs24h - a.runs24h)
                  .slice(0, 10)
                  .map((agent) => (
                    <tr key={agent.id} className="border-b last:border-0">
                      <td className="py-2">{agent.name}</td>
                      <td className="text-right py-2">{agent.runs24h}</td>
                      <td className="text-right py-2">{agent.err24h}</td>
                      <td className="text-right py-2">{agent.costDay.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Runs by Status */}
        <div className="border rounded p-4 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Runs by Status</h2>
          {runs.length === 0 ? (
            <p>No runs found.</p>
          ) : (
            <ul className="space-y-3">
              {['running', 'finished', 'failed', 'queued'].map((status) => {
                const count = runs.filter(r => r.status === status).length;
                return (
                  <li key={status} className="flex justify-between items-center">
                    <span className="capitalize font-medium">{status}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            status === 'finished' ? 'bg-green-500' : 
                            status === 'failed' ? 'bg-red-500' : 
                            status === 'running' ? 'bg-blue-500' : 
                            'bg-gray-400'
                          }`}
                          style={{ width: `${(count / runs.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="mt-6 border rounded p-4 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <p>No sessions found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Agent</th>
                <th className="text-left py-2">Tokens (24h)</th>
                <th className="text-left py-2">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {sessions
                .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
                .slice(0, 10)
                .map((session) => (
                  <tr key={session.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{session.id}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        session.status === 'active' ? 'bg-green-100 text-green-800' : 
                        session.status === 'idle' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="py-2">{session.agent}</td>
                    <td className="py-2">{session.tokens24h.toLocaleString()}</td>
                    <td className="py-2 text-xs">{new Date(session.lastSeenAt).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
