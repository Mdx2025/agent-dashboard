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
  { id: "main-agent", name: "MainAgent", type: "MAIN", status: "active", model: "anthropic/claude-opus-4", lastRun: Date.now() - 120000, runs24h: 67, errors24h: 0, tools: ["search", "memory", "code"], workflows: 3 },
  { id: "research-sub", name: "ResearchBot", type: "SUBAGENT", status: "active", model: "anthropic/claude-sonnet-4", lastRun: Date.now() - 300000, runs24h: 34, errors24h: 1, tools: ["web_fetch", "search"], workflows: 2 },
  { id: "code-sub", name: "CodeWriter", type: "SUBAGENT", status: "idle", model: "google/gemini-2.5-pro", lastRun: Date.now() - 900000, runs24h: 22, errors24h: 0, tools: ["code", "file_read"], workflows: 1 },
  { id: "writer-sub", name: "ContentBot", type: "SUBAGENT", status: "active", model: "anthropic/claude-haiku-4", lastRun: Date.now() - 600000, runs24h: 45, errors24h: 2, tools: ["write", "edit"], workflows: 2 },
  { id: "reviewer", name: "Reviewer", type: "SUBAGENT", status: "idle", model: "anthropic/claude-sonnet-4", lastRun: Date.now() - 7200000, runs24h: 12, errors24h: 0, tools: ["analyze"], workflows: 1 },
];

const MOCK_SESSIONS = [
  { id: "sess_a1b2c3", status: "active", started: Date.now() - 3600000, lastSeen: Date.now() - 12000, tokens24h: 89420, model: "claude-opus-4", agent: "MainAgent", user: "user_123", messages: 45, tools_used: 23 },
  { id: "sess_d4e5f6", status: "active", started: Date.now() - 7200000, lastSeen: Date.now() - 45000, tokens24h: 67100, model: "claude-sonnet-4", agent: "ResearchBot", user: "user_456", messages: 32, tools_used: 18 },
  { id: "sess_g7h8i9", status: "active", started: Date.now() - 1800000, lastSeen: Date.now() - 5000, tokens24h: 34200, model: "gemini-2.5-pro", agent: "CodeWriter", user: "user_789", messages: 28, tools_used: 15 },
  { id: "sess_h0j1k2", status: "idle", started: Date.now() - 14400000, lastSeen: Date.now() - 1200000, tokens24h: 15600, model: "claude-haiku-4", agent: "ContentBot", user: "user_321", messages: 12, tools_used: 5 },
];

const MOCK_RUNS = [
  { id: "run_001", source: "MAIN", label: "User query: deploy analysis", status: "running", started: Date.now() - 45000, duration: null, model: "claude-opus-4", contextPct: 67, tokensIn: 12400, tokensOut: 3200, tools: ["search", "memory"], transcript: [{role: "user", content: "Analyze the deployment pipeline"}, {role: "assistant", content: "Let me check the deployment status..."}] },
  { id: "run_002", source: "SUBAGENT", label: "Research: API rate limits", status: "running", started: Date.now() - 30000, duration: null, model: "claude-sonnet-4", contextPct: 42, tokensIn: 8900, tokensOut: 1800, tools: ["web_fetch"], agent: "ResearchBot", transcript: [{role: "user", content: "Research API limits"}, {role: "assistant", content: "Looking up rate limit documentation..."}] },
  { id: "run_003", source: "CRON", label: "Scheduled: health check", status: "finished", started: Date.now() - 120000, duration: 4200, model: "claude-haiku-4", contextPct: 12, tokensIn: 2100, tokensOut: 890, tools: [], transcript: [{role: "system", content: "Running scheduled health check..."}, {role: "system", content: "All services healthy"}] },
  { id: "run_004", source: "MAIN", label: "User query: generate report", status: "finished", started: Date.now() - 600000, duration: 12500, model: "claude-opus-4", contextPct: 78, tokensIn: 45000, tokensOut: 12000, tools: ["write", "memory"], transcript: [] },
  { id: "run_005", source: "SUBAGENT", label: "Code review task", status: "failed", started: Date.now() - 900000, duration: 8500, model: "claude-sonnet-4", contextPct: 55, tokensIn: 6700, tokensOut: 2100, error: "Timeout waiting for file response", agent: "CodeWriter", transcript: [] },
];

const MODEL_USAGE = [
  { model: "anthropic/claude-opus-4", provider: "Anthropic", requests: 14520, tokens: 2840000, cost: 42.50, pct: 45 },
  { model: "anthropic/claude-sonnet-4", provider: "Anthropic", requests: 8920, tokens: 1250000, cost: 12.30, pct: 28 },
  { model: "google/gemini-2.5-pro", provider: "Google", requests: 3200, tokens: 890000, cost: 4.20, pct: 15 },
  { model: "anthropic/claude-haiku-4", provider: "Anthropic", requests: 4500, tokens: 320000, cost: 2.65, pct: 12 },
];

const MOCK_WORKFLOWS = [
  { id: "wf_001", name: "Research → Write → Review", steps: ["ResearchBot", "ContentBot", "Reviewer"], status: "active", lastRun: Date.now() - 300000, totalRuns: 45 },
  { id: "wf_002", name: "Code → Test → Deploy", steps: ["CodeWriter", "Reviewer"], status: "idle", lastRun: Date.now() - 7200000, totalRuns: 23 },
  { id: "wf_003", name: "Multi-source Research", steps: ["ResearchBot", "ResearchBot"], status: "active", lastRun: Date.now() - 1800000, totalRuns: 67 },
];

const MOCK_TOOLS = [
  { id: "search", name: "Web Search", provider: "Brave", invocations: 4520, avgTime: 120, errors: 12 },
  { id: "memory", name: "Memory Store", provider: "Internal", invocations: 12500, avgTime: 45, errors: 0 },
  { id: "code", name: "Code Execution", provider: "Internal", invocations: 890, avgTime: 2500, errors: 23 },
  { id: "web_fetch", name: "Web Fetch", provider: "Internal", invocations: 2100, avgTime: 180, errors: 45 },
];

const MOCK_ALERTS = [
  { id: "alert_001", type: "warning", message: "API rate limit approaching (80%)", source: "claude-opus-4", time: Date.now() - 600000 },
  { id: "alert_002", type: "error", message: "Tool timeout: code execution > 30s", source: "CodeWriter", time: Date.now() - 900000 },
  { id: "alert_003", type: "info", message: "New deployment detected", source: "System", time: Date.now() - 3600000 },
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
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  return Math.floor(ms / 60000) + "m " + ((ms % 60000) / 1000).toFixed(0) + "s";
};

const COLORS = {
  bg: "#0a0e1a",
  bgCard: "rgba(14, 20, 36, 0.7)",
  border: "rgba(56, 78, 135, 0.25)",
  accent: "#3b82f6",
  success: "#22c55e",
  warn: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  cyan: "#06b6d4",
  purple: "#a78bfa",
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
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.dot, animation: status === "running" ? "pulse 1.5s infinite" : "none" }} />
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

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ 
      background: active ? COLORS.accent + "25" : "transparent", 
      border: "1px solid " + (active ? COLORS.accent : COLORS.border), 
      borderRadius: 6, 
      padding: "6px 12px", 
      color: active ? COLORS.accent : COLORS.textMuted, 
      cursor: "pointer", 
      fontSize: 11, 
      fontWeight: 500,
      marginRight: 8,
      transition: "all 0.2s"
    }}>
      {children}
    </button>
  );
}

function Drawer({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: COLORS.bg, borderLeft: "1px solid " + COLORS.border, zIndex: 200, display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease-out" }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid " + COLORS.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {children}
      </div>
    </div>
  );
}

export default function MDXDashboard() {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionSearch, setSessionSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredSessions = MOCK_SESSIONS.filter(s => 
    s.id.toLowerCase().includes(sessionSearch.toLowerCase()) || 
    s.agent.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const renderOverview = () => (
    <>
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
            <Card key={a.id} style={{ minWidth: 180, padding: "10px 14px", cursor: "pointer" }} onClick={() => setSelectedAgent(a)}>
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

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, marginBottom: 24 }}>
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
              <div key={s.id} onClick={() => setSelectedSession(s)} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}>
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
                  {["Source", "Label", "Status", "Started", "Ctx%", "Duration", "Model", "Tokens"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 500, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_RUNS.map(r => (
                  <tr key={r.id} onClick={() => setSelectedRun(r)} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", cursor: "pointer" }}>
                    <td style={{ padding: "8px 10px" }}><SourceBadge source={r.source} /></td>
                    <td style={{ padding: "8px 10px", color: COLORS.textPrimary, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</td>
                    <td style={{ padding: "8px 10px" }}><StatusPill status={r.status} /></td>
                    <td style={{ padding: "8px 10px", color: COLORS.textMuted, fontSize: 10 }}>{timeAgo(r.started)}</td>
                    <td style={{ padding: "8px 10px", color: COLORS.textMuted, fontSize: 10 }}>{r.contextPct}%</td>
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

      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Model Usage Breakdown</div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
          {MODEL_USAGE.map(m => (
            <Card key={m.model} style={{ minWidth: 200, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.cyan }}>{m.provider}</span>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{m.pct}%</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.model}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>Requests</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{fmt(m.requests)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>Cost</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.success }}>${m.cost.toFixed(2)}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, height: 4, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: m.pct + "%", height: "100%", background: COLORS.accent }} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );

  const renderWorkflows = () => (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Workflow Pipelines</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {MOCK_WORKFLOWS.map(wf => (
          <Card key={wf.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{wf.name}</span>
              <StatusPill status={wf.status} />
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {wf.steps.map((step, i) => (
                <span key={i} style={{ padding: "2px 8px", background: COLORS.accent + "20", borderRadius: 4, fontSize: 10, color: COLORS.accent }}>{step}</span>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.textMuted }}>
              <span>{wf.totalRuns} total runs</span>
              <span>Last run {timeAgo(wf.lastRun)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTools = () => (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>MCP Tools Registry</h3>
      <Card padding="0" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + COLORS.border }}>
              {["Tool", "Provider", "Invocations", "Avg Time", "Errors"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_TOOLS.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.accent }}>{t.name}</td>
                <td style={{ padding: "10px 12px", color: COLORS.textSecondary }}>{t.provider}</td>
                <td style={{ padding: "10px 12px" }}>{fmt(t.invocations)}</td>
                <td style={{ padding: "10px 12px", color: COLORS.textMuted }}>{t.avgTime}ms</td>
                <td style={{ padding: "10px 12px", color: t.errors > 0 ? COLORS.error : COLORS.success }}>{t.errors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const renderMemory = () => (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Vector Store & Memory</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Total Embeddings</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>1.2M</div>
        </Card>
        <Card>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Storage Used</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.cyan }}>4.8GB</div>
        </Card>
        <Card>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Retrievals/24h</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>12.4K</div>
        </Card>
      </div>
      <Card>
        <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Recent Memory Operations</h4>
        {[
          { op: "STORE", content: "Session sess_a1b2c3 context", time: "2m ago" },
          { op: "RETRIEVE", content: "User preferences for user_123", time: "5m ago" },
          { op: "UPDATE", content: "Agent config for ResearchBot", time: "12m ago" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <span><span style={{ padding: "2px 6px", background: COLORS.purple + "20", borderRadius: 4, fontSize: 9, color: COLORS.purple, marginRight: 8 }}>{item.op}</span>{item.content}</span>
            <span style={{ color: COLORS.textMuted, fontSize: 10 }}>{item.time}</span>
          </div>
        ))}
      </Card>
    </div>
  );

  const renderAlerts = () => (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Alerts & Notifications</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {MOCK_ALERTS.map(alert => (
          <Card key={alert.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ 
                  padding: "2px 8px", 
                  borderRadius: 4, 
                  fontSize: 9, 
                  fontWeight: 600,
                  marginRight: 8,
                  background: alert.type === "error" ? COLORS.error + "20" : alert.type === "warning" ? COLORS.warn + "20" : COLORS.accent + "20",
                  color: alert.type === "error" ? COLORS.error : alert.type === "warning" ? COLORS.warn : COLORS.accent
                }}>{alert.type.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: COLORS.textPrimary }}>{alert.message}</span>
              </div>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>{timeAgo(alert.time)}</span>
            </div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6 }}>Source: {alert.source}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPlayground = () => (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Agent Playground</h3>
      <Card>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>Select Agent</label>
          <select style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid " + COLORS.border, borderRadius: 6, padding: "8px 12px", color: COLORS.textPrimary, fontSize: 12, outline: "none" }}>
            {MOCK_AGENTS.map(a => <option key={a.id} value={a.id}>{a.name} ({a.model})</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>Your Message</label>
          <textarea placeholder="Enter your prompt here..." style={{ width: "100%", height: 100, background: "rgba(255,255,255,0.03)", border: "1px solid " + COLORS.border, borderRadius: 6, padding: "10px 12px", color: COLORS.textPrimary, fontSize: 12, outline: "none", resize: "vertical" }} />
        </div>
        <button style={{ width: "100%", background: COLORS.accent, border: "none", borderRadius: 6, padding: "10px 20px", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Run Agent</button>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "workflows": return renderWorkflows();
      case "tools": return renderTools();
      case "memory": return renderMemory();
      case "alerts": return renderAlerts();
      case "playground": return renderPlayground();
      default: return renderOverview();
    }
  };

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", background: "radial-gradient(ellipseat 20% 0%, #0f173c 0%, " + COLORS.bg + " 60%)", color: COLORS.textPrimary, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { margin: 0; font-family: 'JetBrains Mono', monospace; background: ` + COLORS.bg + `; color: ` + COLORS.textPrimary + `; } input::placeholder { color: ` + COLORS.textMuted + `; } button:hover { opacity: 0.9; } tr:hover { background: rgba(255,255,255,0.02); }`}</style>
      
      <header style={{ padding: "16px 24px", borderBottom: "1px solid " + COLORS.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height:  "linear-gradient(135deg, "32, background: + COLORS.accent + ", " + COLORS.cyan + ")", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>◈</div>
          <div>
            <h1 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>MDX Agent Operations</h1>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>Real-time monitoring dashboard</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: autoRefresh ? COLORS.success : COLORS.textMuted, animation: autoRefresh ? "pulse 2s infinite" : "none" }} />
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Auto-refresh</span>
          </div>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{ accentColor: COLORS.accent, marginRight: 8 }} />
          </label>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{new Date(currentTime).toLocaleTimeString()}</span>
        </div>
      </header>

      <nav style={{ padding: "12px 24px", borderBottom: "1px solid " + COLORS.border, display: "flex", gap: 4, overflowX: "auto" }}>
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</TabButton>
        <TabButton active={activeTab === "workflows"} onClick={() => setActiveTab("workflows")}>Workflows</TabButton>
        <TabButton active={activeTab === "tools"} onClick={() => setActiveTab("tools")}>Tools</TabButton>
        <TabButton active={activeTab === "memory"} onClick={() => setActiveTab("memory")}>Memory</TabButton>
        <TabButton active={activeTab === "alerts"} onClick={() => setActiveTab("alerts")}>Alerts</TabButton>
        <TabButton active={activeTab === "playground"} onClick={() => setActiveTab("playground")}>Playground</TabButton>
      </nav>

      <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        {renderTabContent()}
      </main>

      {selectedSession && (
        <Drawer title="Session Details" onClose={() => setSelectedSession(null)}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Session ID</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>{selectedSession.id}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Agent</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{selectedSession.agent}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Status</div>
              <StatusPill status={selectedSession.status} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>User</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{selectedSession.user}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Model</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{selectedSession.model}</div>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>Activity</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <Card style={{ padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedSession.messages}</div>
                <div style={{ fontSize: 9, color: COLORS.textMuted }}>Messages</div>
              </Card>
              <Card style={{ padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedSession.tools_used}</div>
                <div style={{ fontSize: 9, color: COLORS.textMuted }}>Tools</div>
              </Card>
              <Card style={{ padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.cyan }}>{fmt(selectedSession.tokens24h)}</div>
                <div style={{ fontSize: 9, color: COLORS.textMuted }}>Tokens</div>
              </Card>
            </div>
          </div>
        </Drawer>
      )}

      {selectedRun && (
        <Drawer title="Run Details" onClose={() => setSelectedRun(null)}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Run ID</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>{selectedRun.id}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Status</div>
              <StatusPill status={selectedRun.status} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Source</div>
              <SourceBadge source={selectedRun.source} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Model</div>
              <div style={{ fontSize: 11 }}>{selectedRun.model}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Duration</div>
              <div style={{ fontSize: 11 }}>{durFmt(selectedRun.duration)}</div>
            </div>
          </div>
          {selectedRun.transcript && selectedRun.transcript.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>Transcript</div>
              <Card padding="12px">
                {selectedRun.transcript.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 9, color: msg.role === "user" ? COLORS.accent : msg.role === "system" ? COLORS.warn : COLORS.textSecondary, marginBottom: 4, display: "block", textTransform: "uppercase" }}>{msg.role}</span>
                    <span style={{ fontSize: 11 }}>{msg.content}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </Drawer>
      )}

      {selectedAgent && (
        <Drawer title="Agent Details" onClose={() => setSelectedAgent(null)}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Agent Name</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedAgent.name}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Model</div>
            <div style={{ fontSize: 12, color: COLORS.cyan }}>{selectedAgent.model}</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>Capabilities</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {selectedAgent.tools.map(t => (
                <span key={t} style={{ padding: "4px 8px", background: COLORS.accent + "20", borderRadius: 4, fontSize: 10, color: COLORS.accent }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>Statistics</div>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>Runs (24h)</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{selectedAgent.runs24h}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>Errors (24h)</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: selectedAgent.errors24h > 0 ? COLORS.error : COLORS.success }}>{selectedAgent.errors24h}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>Active Workflows</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{selectedAgent.workflows}</span>
              </div>
            </Card>
          </div>
        </Drawer>
      )}
    </div>
  );
}
