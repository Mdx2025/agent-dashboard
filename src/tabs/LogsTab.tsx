// src/tabs/LogsTab.tsx

import React, { useState, useEffect } from 'react';
import { fetchLogs, createLog, CreateLogDto } from '../services';
import { LogEntry } from '../api/types';

export function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating a log
  const [newLog, setNewLog] = useState<CreateLogDto>({
    level: 'INFO',
    source: 'dashboard',
    message: '',
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.message) return;

    try {
      await createLog(newLog);
      setNewLog({ ...newLog, message: '' }); // Reset message field
      loadLogs(); // Refresh logs
    } catch (err: any) {
      setError(err.message || 'Failed to create log');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'FATAL':
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800';
      case 'INFO':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) return <div className="p-4">Loading logs...</div>;
  if (error) return <div className="p-4" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Logs</h1>
      <p className="mb-6 text-gray-600">System event logs and messages.</p>
      
      {/* Create Log Form */}
      <div className="mb-6 border rounded p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Create New Log Entry</h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <div className="flex space-x-3">
            <select 
              value={newLog.level} 
              onChange={(e) => setNewLog({ ...newLog, level: e.target.value as any })}
              className="border rounded px-3 py-2"
            >
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="FATAL">FATAL</option>
            </select>
            <input 
              type="text" 
              placeholder="Source (e.g., 'gateway', 'api')" 
              value={newLog.source}
              onChange={(e) => setNewLog({ ...newLog, source: e.target.value })}
              className="border rounded px-3 py-2 flex-1"
            />
          </div>
          <div>
            <input 
              type="text" 
              placeholder="Log message..." 
              value={newLog.message}
              onChange={(e) => setNewLog({ ...newLog, message: e.target.value })}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto">
            Add Log Entry
          </button>
        </form>
      </div>

      {/* Logs List */}
      <div className="border rounded overflow-hidden shadow-md">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No logs found.</div>
        ) : (
          <ul className="divide-y">
            {logs.map((log) => (
              <li key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="font-medium">{log.source}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-800">{log.message}</p>
                {(log.runId || log.requestId) && (
                  <div className="mt-1 flex space-x-4 text-xs text-gray-500">
                    {log.runId && <span>Run: {log.runId}</span>}
                    {log.requestId && <span>Req: {log.requestId}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
