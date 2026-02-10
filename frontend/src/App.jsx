import React, { useState, useEffect, useCallback } from 'react'

const API_BASE = '/api'

// Hook para API
function useApi() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (endpoint) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}${endpoint}`)
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      const result = await response.json()
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchData }
}

// Componente: Stat Card
function StatCard({ title, value, subtext }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
      {subtext && <div className="subtext">{subtext}</div>}
    </div>
  )
}

// Componente: Session List
function SessionList({ sessions, onSelect, selectedId }) {
  return (
    <div className="session-list">
      {sessions.length === 0 ? (
        <div className="loading">No sessions found</div>
      ) : (
        sessions.map(session => (
          <div 
            key={session.id} 
            className="session-item"
            onClick={() => onSelect(session.id)}
            style={{ background: selectedId === session.id ? 'var(--bg-tertiary)' : undefined }}
          >
            <div className="session-header">
              <span className="session-label">{session.label || session.agent_key}</span>
              <span className={`status-badge ${session.status}`}>{session.status}</span>
            </div>
            <div className="session-meta">
              <span>{session.model || 'N/A'}</span>
              <span>{session.channel || 'N/A'}</span>
              <span>{session.total_tokens?.toLocaleString() || 0} tokens</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Componente: Activity Feed
function ActivityFeed({ activities }) {
  return (
    <div className="activity-list">
      {activities.length === 0 ? (
        <div className="loading">No recent activity</div>
      ) : (
        activities.map((activity, i) => (
          <div key={i} className="activity-item">
            <div className="activity-time">{new Date(activity.timestamp).toLocaleString()}</div>
            <div className="activity-content">{activity.summary}</div>
          </div>
        ))
      )}
    </div>
  )
}

// Componente: Run Details
function RunDetails({ sessionId }) {
  const { data: details, loading, error, fetchData } = useApi()

  useEffect(() => {
    if (sessionId) {
      fetchData(`/sessions/${sessionId}`)
    }
  }, [sessionId, fetchData])

  if (!sessionId) return <div className="card"><div className="card-header"><h2>Select a session</h2></div><div className="loading">Select a session to view details</div></div>
  if (loading) return <div className="card"><div className="card-header"><h2>Session Details</h2></div><div className="loading">Loading...</div></div>
  if (error) return <div className="card"><div className="card-header"><h2>Session Details</h2></div><div className="error">{error}</div></div>
  if (!details) return null

  const { run, messages, timeline } = details

  return (
    <div className="card">
      <div className="card-header">
        <h2>Session Details</h2>
        <span className={`status-badge ${run.status}`}>{run.status}</span>
      </div>
      <div className="run-detail">
        <div className="detail-header">
          <div className="detail-title">{run.label || run.agent_key}</div>
          <div className="detail-meta">
            <span>ID: {run.id.slice(0, 8)}...</span>
            <span>{run.model || 'N/A'}</span>
            <span>{run.channel || 'N/A'}</span>
            <span>{run.total_tokens?.toLocaleString() || 0} tokens</span>
          </div>
        </div>

        <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: 16 }}>Timeline</h3>
        <div className="timeline">
          {timeline?.slice(-10).reverse().map((item, i) => (
            <div key={i} className="timeline-item">
              <div className="time">{new Date(item.timestamp).toLocaleTimeString()}</div>
              <div className="event">{item.summary}</div>
            </div>
          ))}
        </div>

        {messages?.length > 0 && (
          <>
            <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: 16 }}>Messages</h3>
            <div className="messages">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="role">{msg.role.toUpperCase()}</div>
                  <div className="content">{msg.content}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Componente: Analytics Overview
function AnalyticsOverview({ analytics }) {
  if (!analytics) return null

  return (
    <div className="stats-grid">
      <StatCard title="Total Sessions" value={analytics.total_sessions || 0} subtext={`${analytics.active_sessions || 0} active`} />
      <StatCard title="Total Tokens" value={(analytics.total_tokens || 0).toLocaleString()} subtext="Across all sessions" />
      <StatCard title="Total Events" value={analytics.total_events || 0} subtext="Session events" />
      <StatCard title="Models Used" value={analytics.models_used?.length || 0} subtext="Unique models" />
    </div>
  )
}

// Componente Principal
function App() {
  const [selectedSession, setSelectedSession] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const sessionsApi = useApi()
  const analyticsApi = useApi()
  const activityApi = useApi()

  const refreshAll = useCallback(() => {
    sessionsApi.fetchData('/sessions')
    analyticsApi.fetchData('/analytics/overview')
    activityApi.fetchData('/recent-activity')
  }, [sessionsApi, analyticsApi, activityApi])

  useEffect(() => {
    refreshAll()
    const interval = autoRefresh ? setInterval(refreshAll, 10000) : null
    return () => clearInterval(interval)
  }, [refreshAll, autoRefresh])

  return (
    <div className="container">
      <header className="header">
        <h1>🤖 Agent Operations Dashboard</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="status">● Live</span>
          <button className="refresh-btn" onClick={refreshAll}>Refresh</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            <span style={{ fontSize: 14 }}>Auto-refresh</span>
          </label>
        </div>
      </header>

      {analyticsApi.error && <div className="error">Analytics Error: {analyticsApi.error}</div>}
      
      <AnalyticsOverview analytics={analyticsApi.data} />

      <div className="grid">
        <div className="card">
          <div className="card-header">
            <h2>Sessions</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {sessionsApi.data?.length || 0} total
            </span>
          </div>
          {sessionsApi.loading ? (
            <div className="loading">Loading sessions...</div>
          ) : sessionsApi.error ? (
            <div className="error">{sessionsApi.error}</div>
          ) : (
            <SessionList sessions={sessionsApi.data || []} onSelect={setSelectedSession} selectedId={selectedSession} />
          )}
        </div>

        <div>
          <RunDetails sessionId={selectedSession} />
          
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            {activityApi.loading ? (
              <div className="loading">Loading activity...</div>
            ) : activityApi.error ? (
              <div className="error">{activityApi.error}</div>
            ) : (
              <ActivityFeed activities={activityApi.data || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
