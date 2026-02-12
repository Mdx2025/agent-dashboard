import { useState, useEffect } from "react";

const MOCK_SUMMARY = {
  activeSessions: 7,
  totalTokensAllTime: 2847210,
  totalTokens24h: 412850,
  totalCostAllTime: 61.65,
  totalCost24h: 12.45,
  agents: 5,
  mainModel: "anthropic/claude-opus-4",
};

const MOCK_AGENTS = [
  { id: "main-agent", name: "MainAgent", type: "MAIN", status: "active", model: "anthropic/claude-opus-4", lastRun: Date.now() - 120000, runs24h: 67, errors24h: 0 },
  { id: "research-sub", name: "ResearchBot", type: "SUBAGENT", status: "active", model: "anthropic/claude-sonnet-4", lastRun: Date.now() - 300000, runs24h: 34, errors24h: 1 },
  { id: "code-sub", name: "CodeWriter", type: "SUBAGENT", status: "idle", model: "google/gemini-2.5-pro", lastRun: Date.now() - 900000, runs24h: 22, errors24h: 0 },
];

const MOCK_SESSIONS = [
  { id: "sess_a1b2c3", status: "active", started: Date.now() - 3600000, lastSeen: Date.now() - 12000, tokens24h: 89420, model: "claude-opus-4", agent: "MainAgent" },
  { id: "sess_d4e5f6", status: "active", started: Date.now() - 7200000, lastSeen: Date.now() - 45000, tokens24h: 67100, model: "claude-sonnet-4", agent: "ResearchBot" },
  { id: "sess_g7h8i9", status: "active", started: Date.now() - 1800000, lastSeen: Date.now() - 5000, tokens24h: 34200, model: "gemini-2.5-pro", agent: "CodeWriter" },
];

const MOCK_RUNS = [
  { id: "run_001", source: "MAIN", label: "User query: deploy analysis", status: "running", started: Date.now() - 45000, duration: null, model: "claude-opus-4", contextPct: 67, tokensIn: 12400, tokensOut: 3200 },
  { id: "run_002", source: "SUBAGENT", label: "Research: API rate limits", status: "running", started: Date.now() - 30000, duration: null, model: "claude-sonnet-4", contextPct: 42, tokensIn: 8900, tokensOut: 1800 },
  { id: "run_003", source: "CRON", label: "Scheduled: health check", status: "finished", started: Date.now() - 120000, duration: 4200, model: "claude-haiku-4", contextPct: 12, tokensIn: 2100, tokensOut: 890 },
];

const fmt = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return n.toLocaleString();
};

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
};

const durFmt = (ms) => {
  if (!ms) return "-";
  if (ms < 1000) return ms + "ms";
  return (ms / 1000).toFixed(1) + "s";
};

const COLORS = {
  bg: "#0a0e1a",
  bgCard: "rgba(14, 20, 36, 0.7)",
  border: "rgba(56, 78, 135, 0.25)",
  accent: "#3b82f6",
  success: "#22c55e",
  warn: "#f59e0b",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  cyan: "#06b6d4",
};

function StatusPill({ status }) {
  const colors = {
    active: { bg: "#22c55e", dot: "#22c55e" },
    running: { bg: "#3b82f6", dot: "#3b82f6" },
    idle: { bg: "#64748b", dot: "#64748b" },
    finished: { bg: "#22c55e", dot: "#22c55e" },
    failed: { bg: "#ef4444", dot: "#ef4444" },
  };
  const c = colors[status] || colors.idle;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 6px", background: c.bg + "20", border: "1px solid " + c.bg + "40", borderRadius: 4, fontSize: 10, fontWeight: 500, color: c.bg }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.dot }} />
      {status}
    </span>
  );
}

function SourceBadge({ source }) {
  const colors = { MAIN: "#3b82f6", SUBAGENT: "#a78bfa", CRON: "#06b6d4" };
  const c = colors[source] || colors.MAIN;
  return (
    <span style={{ padding: "2px 6px", background: c + "20", border: "1px solid " + c + "40", borderRadius: 4, fontSize: 9, fontWeight: 600, color: c, textTransform: "uppercase" }}>{source}</span>
  );
}

function Card({ children, style, padding = "16px" }) {
  return (
    <div style={{ background: COLORS.bgCard, backdropFilter: "blur(20px)", border: "1px solid " + COLORS.border, borderRadius: 12, padding, ...style }}>
      {children}
    </div>
  );
}

function KPICard({ label, value, sub, icon, children }) {
  return (
    <Card style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 14, opacity: 0.4 }}>{icon}</span>
      </div>
      {children || <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>{value}</div>}
      {sub && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

export default function MDXDashboard() {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionSearch, setSessionSearch] = useState("");

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredSessions = MOCK_SESSIONS.filter(s => 
    s.id.toLowerCase().includes(sessionSearch.toLowerCase()) || 
    s.agent.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", background: "radial-gradient(ellipse at 20% 0%, #0f173c 0%, " + COLORS.bg + " 60%)", color: COLORS.textPrimary, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input::placeholder { color: rgba(148,163,184,0.5); }`}</style>

      <header style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid " + COLORS.border, background: "rgba(10, 14, 26, 0.8)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent, letterSpacing: 2 }}>MDX</span>
          <span style={{ width: 1, height: 20, background: COLORS.border }} />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>Agent Operations</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.success, boxShadow: "0 0 8px " + COLORS.success }} />
          <span style={{ fontSize: 11, color: COLORS.success, fontWeight: 500 }}>Live</span>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>{new Date(currentTime).toLocaleTimeString("en-US", { hour12: false })}</span>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ background: autoRefresh ? COLORS.accent + "25" : "rgba(255,255,255,0.04)", border: "1px solid " + (autoRefresh ? COLORS.accent + "60" : COLORS.border), borderRadius: 6, padding: "3px 10px", color: autoRefresh ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: 10, fontWeight: 500 }}>AUTO</button>
        </div>
      </header>

      <main style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Overview <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 12 }}>Real-time agent operations monitoring</span></h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          <KPICard label="Active Sessions" value={MOCK_SUMMARY.activeSessions} icon="●" sub={MOCK_SESSIONS.filter(s => s.status === "active").length + " connected"} />
          <KPICard label="Total Tokens" value={fmt(MOCK_SUMMARY.totalTokensAllTime)} icon="◇" sub={fmt(MOCK_SUMMARY.totalTokens24h) + " last 24h"} />
          <KPICard label="Cost" value={"$" + MOCK_SUMMARY.totalCostAllTime.toFixed(2)} icon="$" sub={"$" + MOCK_SUMMARY.totalCost24h.toFixed(2) + " last 24h"} />
          <KPICard label="Agents" value={MOCK_SUMMARY.agents} icon="◈" />
          <KPICard label="Main Model" icon="◆"><div style={{ fontSize: 12, fontWeight: 600, color: COLORS.cyan }}>{MOCK_SUMMARY.mainModel}</div></KPICard>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Agents</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {MOCK_AGENTS.map(a => (
              <Card key={a.id} style={{ minWidth: 180, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</span>
                  <StatusPill status={a.status} />
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>{a.model}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: COLORS.textMuted }}><span>{a.runs24h} runs</span><span>{timeAgo(a.lastRun)}</span></div>
              </Card>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
          <Card padding="0">
            <div style={{ padding: "12px 14px", borderBottom: "1px solid " + COLORS.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Active Sessions</span>
              <span style={{ fontSize: 10, color: COLORS.textMuted, background: COLORS.accent + "20", padding: "2px 6px", borderRadius: 4 }}>{filteredSessions.length}</span>
            </div>
            <div style={{ padding: "8px 14px" }}>
              <input type="text" placeholder="Search..." value={sessionSearch} onChange={e => setSessionSearch(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid " + COLORS.border, borderRadius: 6, padding: "6px 10px", color: COLORS.textPrimary, fontSize: 11, outline: "none" }} />
            </div>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {filteredSessions.map(s => (
                <div key={s.id} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent }}>{s.id}</span>
                    <StatusPill status={s.status} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.textMuted }}><span>{s.agent}</span><span>{fmt(s.tokens24h)} tok</span></div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Last seen {timeAgo(s.lastSeen)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="0" style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid " + COLORS.border }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Recent Runs</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid " + COLORS.border }}>
                    {["Source", "Label", "Status", "Started", "Duration", "Model", "Tokens"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 500, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RUNS.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "8px 10px" }}><SourceBadge source={r.source} /></td>
                      <td style={{ padding: "8px 10px", color: COLORS.textPrimary, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</td>
                      <td style={{ padding: "8px 10px" }}><StatusPill status={r.status} /></td>
                      <td style={{ padding: "8px 10px", color: COLORS.textMuted, fontSize: 10 }}>{timeAgo(r.started)}</td>
                      <td style={{ padding: "8px 10px", color: COLORS.textMuted, fontSize: 10 }}>{durFmt(r.duration)}</td>
                      <td style={{ padding: "8px 10px", color: COLORS.textSecondary, fontSize: 10 }}>{r.model}</td>
                      <td style={{ padding: "8px 10px", color: COLORS.textMuted, fontSize: 10 }}>{fmt(r.tokensIn)} → {fmt(r.tokensOut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
