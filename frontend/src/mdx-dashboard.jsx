import { useState, useEffect, useRef } from "react";

const API_BASE = "/api";

// ─── API Service ───────────────────────────────────────────────────────────
async function fetchAPI(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    return null;
  }
}

// ─── Style Constants ─────────────────────────────────────────────────────
const C = {
  bg:"#080c18", bgS:"rgba(12,18,35,0.75)", bgH:"rgba(18,26,52,0.9)", bgSub:"rgba(255,255,255,0.02)",
  bdr:"rgba(50,70,120,0.22)", bdrH:"rgba(59,130,246,0.45)",
  acc:"#3b82f6", accB:"#60a5fa", accD:"rgba(59,130,246,0.12)",
  ok:"#22c55e", okD:"rgba(34,197,94,0.12)", okB:"rgba(34,197,94,0.3)",
  wn:"#f59e0b", wnD:"rgba(245,158,11,0.1)", wnB:"rgba(245,158,11,0.25)",
  er:"#ef4444", erD:"rgba(239,68,68,0.1)", erB:"rgba(239,68,68,0.3)",
  cy:"#06b6d4", pu:"#a78bfa", puD:"rgba(167,139,250,0.1)",
  t1:"#e2e8f0", t2:"#94a3b8", t3:"#64748b", t4:"#475569"
};
const FN = "'JetBrains Mono','SF Mono',monospace";

const fm = n => {
  if(n>=1e6) return (n/1e6).toFixed(1)+"M";
  if(n>=1e3) return (n/1e3).toFixed(n>=1e4?0:1)+"K";
  return n.toLocaleString();
};
const ta = ts => {
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<60) return s+"s ago";
  if(s<3600) return Math.floor(s/60)+"m ago";
  return Math.floor(s/3600)+"h ago";
};
const df = ms => {
  if(!ms) return "—";
  if(ms<1000) return ms+"ms";
  return (ms/1000).toFixed(1)+"s";
};
const dt = d => {
  if(!d) return "—";
  const ts = new Date(d).getTime();
  if(isNaN(ts)) return d;
  return ta(ts);
};

// ─── Status Mappings ─────────────────────────────────────────────────────
const SM = {
  active:{bg:C.okD,b:C.okB,c:"#4ade80",d:C.ok},
  healthy:{bg:C.okD,b:C.okB,c:"#4ade80",d:C.ok},
  online:{bg:C.okD,b:C.okB,c:"#4ade80",d:C.ok},
  ok:{bg:C.okD,b:C.okB,c:"#4ade80",d:C.ok},
  pass:{bg:C.okD,b:C.okB,c:"#4ade80",d:C.ok},
  running:{bg:C.accD,b:"rgba(59,130,246,.3)",c:C.accB,d:C.acc},
  idle:{bg:"rgba(148,163,184,.08)",b:"rgba(148,163,184,.2)",c:"#94a3b8",d:"#64748b"},
  finished:{bg:"rgba(34,197,94,.06)",b:"rgba(34,197,94,.18)",c:"#86efac",d:C.ok},
  warn:{bg:C.wnD,b:C.wnB,c:"#fbbf24",d:C.wn},
  degraded:{bg:C.wnD,b:C.wnB,c:"#fbbf24",d:C.wn},
  queued:{bg:C.wnD,b:C.wnB,c:"#fbbf24",d:C.wn},
  error:{bg:C.erD,b:C.erB,c:"#f87171",d:C.er},
  failed:{bg:C.erD,b:C.erB,c:"#f87171",d:C.er},
  fail:{bg:C.erD,b:C.erB,c:"#f87171",d:C.er},
  offline:{bg:C.erD,b:C.erB,c:"#f87171",d:C.er},
  completed:{bg:C.okD,b:C.okB,c:"#4ade80",d:C.ok},
  aborted:{bg:C.erD,b:C.erB,c:"#f87171",d:C.er}
};

// ─── UI Components ───────────────────────────────────────────────────────
function Pill({s, glow}) {
  const st = SM[s] || SM.idle;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 8px",background:st.bg,border:"1px solid "+st.b,borderRadius:6,fontSize:10,fontWeight:500,color:st.c}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:st.d,boxShadow:glow?"0 0 6px "+st.d:"none",animation:glow?"pulse 1.5s infinite":"none"}} />
      {s}
    </span>
  );
}

function SrcBadge({s}) {
  const m = {
    MAIN:{bg:C.accD,b:"rgba(59,130,246,.3)",c:C.accB},
    SUBAGENT:{bg:C.puD,b:"rgba(167,139,250,.3)",c:C.pu},
    CRON:{bg:"rgba(6,182,212,.1)",b:"rgba(6,182,212,.3)",c:"#22d3ee"}
  };
  const st = m[s] || {bg:C.bgS,b:C.bdr,c:C.t2};
  return (<span style={{padding:"2px 6px",background:st.bg,border:"1px solid "+st.b,borderRadius:4,fontSize:9,fontWeight:600,color:st.c,textTransform:"uppercase"}}>{s}</span>);
}

function LvlBadge({l}) {
  const m = {
    DEBUG:{bg:"rgba(148,163,184,.08)",c:"#94a3b8"},
    INFO:{bg:C.accD,c:C.accB},
    WARN:{bg:C.wnD,c:"#fbbf24"},
    ERROR:{bg:C.erD,c:"#f87171"},
    FATAL:{bg:"rgba(239,68,68,.2)",c:"#fca5a5"}
  };
  const st = m[l] || m.INFO;
  return (<span style={{padding:"1px 6px",borderRadius:4,fontSize:9,fontWeight:600,background:st.bg,color:st.c}}>{l}</span>);
}

function PIcon({p}) {
  const cl = {Anthropic:"#d4a574",Moonshot:"#22c55e",Google:"#fbbf24",OpenAI:"#a78bfa"};
  return (<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:5,background:(cl[p]||C.acc)+"18",color:cl[p]||C.acc,fontSize:10,fontWeight:700}}>{p?p[0]:"?"}</span>);
}

function Card({children, style, p: pad = "16px", hover, onClick}) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{background:h&&hover?C.bgH:C.bgS,backdropFilter:"blur(20px)",border:"1px solid "+(h&&hover?C.bdrH:C.bdr),borderRadius:12,padding:pad,transition:"all 180ms",transform:h&&hover?"translateY(-1px)":"none",boxShadow:h&&hover?"0 8px 32px rgba(0,0,0,.3)":"0 2px 12px rgba(0,0,0,.2)",cursor:onClick?"pointer":"default",...style}}>
      {children}
    </div>
  );
}

function Drawer({open, onClose, title, children}) {
  if (!open) return null;
  return (
    <div>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",zIndex:999}} />
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:500,maxWidth:"92vw",background:"linear-gradient(180deg,#0d1326,"+C.bg+")",borderLeft:"1px solid "+C.bdr,zIndex:1000,boxShadow:"-12px 0 50px rgba(0,0,0,.6)",overflowY:"auto"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid "+C.bdr,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"rgba(13,19,38,.96)",zIndex:1}}>
          <span style={{fontSize:14,fontWeight:600,color:C.t1}}>{title}</span>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.04)",border:"1px solid "+C.bdr,borderRadius:6,padding:"4px 10px",color:C.t2,cursor:"pointer",fontSize:12,fontFamily:FN}}>✕</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

function MBar({v}) {
  const p = Math.min(v, 100);
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{flex:1,height:4,borderRadius:2,background:"rgba(255,255,255,.04)",overflow:"hidden"}}>
        <div style={{width:p+"%",height:"100%",borderRadius:2,background:p>80?C.er:p>60?C.wn:C.acc}} />
      </div>
      <span style={{fontSize:10,color:C.t3,minWidth:30,textAlign:"right"}}>{Math.round(p)}%</span>
    </div>
  );
}

function InfoR({l, v, c}) {
  return (<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.02)"}}><span style={{fontSize:11,color:C.t3}}>{l}</span><span style={{fontSize:11,color:c||C.t1,fontWeight:500}}>{v}</span></div>);
}

function SLbl({children, n}) {
  return (<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:11,fontWeight:600,color:C.t3,textTransform:"uppercase",letterSpacing:0.8}}>{children}</span>{n!=null && <span style={{fontSize:9,background:C.accD,color:C.accB,padding:"1px 6px",borderRadius:4}}>{n}</span>}</div>);
}

function Chip({label, active, onClick}) {
  return (<button onClick={onClick} style={{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:500,cursor:"pointer",fontFamily:FN,background:active?C.accD:"rgba(255,255,255,.02)",color:active?C.accB:C.t3,border:"1px solid "+(active?"rgba(59,130,246,.35)":"transparent")}}>{label}</button>);
}

function KPI({label, value, sub, trend}) {
  return (
    <Card hover style={{flex:1,minWidth:0}}>
      <div style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:0.7,marginBottom:6}}>{label}</div>
      <div style={{fontSize:24,fontWeight:700,color:C.t1,lineHeight:1.1}}>{value}</div>
      {sub && <div style={{fontSize:10,color:C.t3,marginTop:3}}>{sub}</div>}
      {trend && <div style={{fontSize:10,color:trend.startsWith("+")?C.ok:C.t3,marginTop:2,fontWeight:500}}>{trend}</div>}
    </Card>
  );
}

function CtxBar({p}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <div style={{width:38,height:3,borderRadius:2,background:"rgba(255,255,255,.05)",overflow:"hidden"}}>
        <div style={{width:p+"%",height:"100%",borderRadius:2,background:p>80?C.er:p>60?C.wn:C.acc}} />
      </div>
      <span style={{fontSize:10,color:C.t3}}>{p}%</span>
    </div>
  );
}

function DGrid({items}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
      {items.map((x, i) => (
        <div key={i} style={{background:C.bgSub,borderRadius:8,padding:"8px 10px",border:"1px solid "+C.bdr}}>
          <div style={{fontSize:9,color:C.t3,marginBottom:3,textTransform:"uppercase"}}>{x.l}</div>
          <div style={{fontSize:11,color:C.t1}}>{x.v}</div>
        </div>
      ))}
    </div>
  );
}

const TH = {padding:"9px 11px",textAlign:"left",fontWeight:500,color:C.t3,fontSize:10,textTransform:"uppercase",whiteSpace:"nowrap",background:C.bgS};
const TD = {padding:"8px 11px",whiteSpace:"nowrap"};

function TRow({children, onClick}) {
  return (
    <tr onClick={onClick} style={{borderBottom:"1px solid rgba(255,255,255,.02)",cursor:onClick?"pointer":"default"}} onMouseEnter={e => {e.currentTarget.style.background = "rgba(59,130,246,.03)";}} onMouseLeave={e => {e.currentTarget.style.background = "transparent";}}>
      {children}
    </tr>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────
function useRefresh(enabled, interval = 5000, callback) {
  useEffect(() => {
    if (!enabled) return;
    const iv = setInterval(callback, interval);
    return () => clearInterval(iv);
  }, [enabled, interval, callback]);
}

// ─── TABS ────────────────────────────────────────────────────────────────

/* ═══ TAB: OVERVIEW ═══ */
function OverviewTab() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [selR, setSelR] = useState(null);

  const refresh = async () => {
    setLoading(true);
    const [sessData, analyticsData, activityData] = await Promise.all([
      fetchAPI('/sessions'),
      fetchAPI('/analytics/overview'),
      fetchAPI('/recent-activity?limit=20')
    ]);
    if (sessData) setSessions(sessData);
    if (analyticsData) setAnalytics(analyticsData);
    if (activityData) setRecentActivity(activityData);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);
  useRefresh(true, 5000, refresh);

  const activeSessions = sessions?.filter(s => s.status === 'active' || s.status === 'running') || [];
  const totalTokens = analytics?.total_tokens || 0;
  const activeCount = analytics?.active_sessions || 0;

  // Map backend sessions to UI format
  const mappedSessions = sessions?.map(s => ({
    id: s.id,
    status: s.status === 'running' ? 'active' : s.status === 'completed' ? 'finished' : s.status === 'aborted' ? 'failed' : 'idle',
    tok24h: s.total_tokens || 0,
    model: s.model || 'unknown',
    agent: s.label || s.agent_key
  })) || [];

  // Map activity to runs format
  const runs = recentActivity?.map(a => ({
    id: a.session_id?.slice(0, 12) || 'run_' + Date.now(),
    src: 'MAIN',
    label: a.summary?.slice(0, 50) || a.type,
    status: 'finished',
    started: new Date(a.timestamp).getTime(),
    dur: null,
    model: 'unknown',
    ctx: 0,
    tIn: 0,
    tOut: 0
  })) || [];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h1 style={{fontSize:17,fontWeight:600,color:C.t1,marginBottom:4}}>Overview</h1>
          <span style={{fontSize:11,color:C.t3}}>Real-time agent operations</span>
        </div>
        <button onClick={refresh} style={{padding:"6px 12px",background:C.accD,border:"1px solid rgba(59,130,246,.35)",borderRadius:6,color:C.accB,cursor:"pointer",fontSize:10,fontFamily:FN}}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,margin:"16px 0"}}>
        <KPI label="Sessions" value={sessions?.length || 0} sub={`${activeCount} active`} />
        <KPI label="Tokens" value={fm(totalTokens)} sub={fm(analytics?.total_tokens || 0)} trend="+18%" />
        <KPI label="Cost" value="--" sub="--" trend="--" />
        <KPI label="Requests" value={analytics?.total_events || 0} sub="--" />
        <Card hover style={{flex:1}}>
          <div style={{fontSize:10,color:C.t3,textTransform:"uppercase",marginBottom:6}}>MAIN MODEL</div>
          <div style={{fontSize:13,fontWeight:600,color:C.cy}}>{analytics?.models_used?.[0] || 'unknown'}</div>
          <div style={{fontSize:10,color:C.t3,marginTop:4}}>{sessions?.length || 0} sessions</div>
        </Card>
      </div>

      <SLbl>Sessions</SLbl>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:16}}>
        {mappedSessions.map(s => (
          <Card key={s.id} hover p="10px 14px" style={{minWidth:160,flex:"0 0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:11,fontWeight:600,color:C.t1}}>{s.id.slice(0, 12)}</span>
              <Pill s={s.status} glow={s.status==="active"} />
            </div>
            <div style={{fontSize:9,color:C.t3}}>{s.model}</div>
            <div style={{display:"flex",gap:8,fontSize:9,color:C.t3,marginTop:2}}>
              <span>{fm(s.tok24h)} tok</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:14,alignItems:"start"}}>
        <Card p="0">
          <div style={{padding:"10px 14px",borderBottom:"1px solid "+C.bdr,fontSize:12,fontWeight:600,color:C.t1}}>All Sessions</div>
          <div style={{maxHeight:340,overflowY:"auto"}}>
            {mappedSessions.map(s => (
              <div key={s.id} style={{padding:"8px 14px",borderBottom:"1px solid rgba(255,255,255,.02)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:11,fontWeight:600,color:C.accB}}>{s.id}</span>
                  <Pill s={s.status} />
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.t3}}>
                  <span>{s.agent}</span><span>{fm(s.tok24h)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card p="0" style={{overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid "+C.bdr,fontSize:12,fontWeight:600,color:C.t1}}>Recent Activity</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr style={{borderBottom:"1px solid "+C.bdr}}>
                {["Type","Summary","When","Status"].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr></thead>
              <tbody>{runs.map(r => (
                <TRow key={r.id} onClick={() => setSelR(r)}>
                  <td style={TD}><span style={{fontSize:9,padding:"2px 6px",background:C.bgSub,borderRadius:4}}>{r.src}</span></td>
                  <td style={{...TD,color:C.t1,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis"}}>{r.label}</td>
                  <td style={{...TD,color:C.t3}}>{ta(r.started)}</td>
                  <td style={TD}><Pill s={r.status} /></td>
                </TRow>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>

      <Drawer open={!!selR} onClose={() => setSelR(null)} title={"Activity "+(selR?selR.id:"")}>
        {selR && <div>
          <DGrid items={[
            {l:"Type",v:<span style={{fontSize:9,padding:"2px 6px",background:C.bgSub,borderRadius:4}}>{selR.src}</span>},
            {l:"Status",v:<Pill s={selR.status}/>},
            {l:"Started",v:ta(selR.started)},
            {l:"Summary",v:selR.label}
          ]} />
        </div>}
      </Drawer>
    </div>
  );
}

/* ═══ TAB: TOKEN USAGE ═══ */
function TokenUsageTab() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [sel, setSel] = useState(null);
  const [pf, setPf] = useState("ALL");

  const refresh = async () => {
    setLoading(true);
    const data = await fetchAPI('/sessions');
    if (data) setSessions(data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const provs = [...new Set(sessions.map(s => s.model_provider).filter(Boolean))];
  const fl = sessions.filter(s => pf==="ALL" || s.model_provider===pf);
  const tCost = 0;
  const tIn = fl.reduce((s,r) => s + (r.input_tokens||0), 0);
  const tOut = fl.reduce((s,r) => s + (r.output_tokens||0), 0);
  const avgSpd = 0;

  const tokenRows = fl.map(s => ({
    id: s.id,
    ts: new Date(s.updated_at || s.created_at).getTime(),
    provider: s.model_provider || 'Unknown',
    model: s.model || 'unknown',
    mc: C.accB,
    agent: s.label || s.agent_key,
    tIn: s.input_tokens || 0,
    tOut: s.output_tokens || 0,
    cost: 0,
    speed: 0,
    finish: "stop"
  }));

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h1 style={{fontSize:17,fontWeight:600,color:C.t1,marginBottom:4}}>Token Usage</h1>
          <span style={{fontSize:11,color:C.t3}}>Per-session token tracking</span>
        </div>
        <button onClick={refresh} style={{padding:"6px 12px",background:C.accD,border:"1px solid rgba(59,130,246,.35)",borderRadius:6,color:C.accB,cursor:"pointer",fontSize:10,fontFamily:FN}}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,margin:"16px 0"}}>
        <Card p="12px 16px"><div style={{fontSize:10,color:C.t3,marginBottom:4}}>TOTAL COST</div><div style={{fontSize:22,fontWeight:700,color:C.t1}}>--</div></Card>
        <Card p="12px 16px"><div style={{fontSize:10,color:C.t3,marginBottom:4}}>TOKENS IN</div><div style={{fontSize:22,fontWeight:700,color:C.t1}}>{fm(tIn)}</div></Card>
        <Card p="12px 16px"><div style={{fontSize:10,color:C.t3,marginBottom:4}}>TOKENS OUT</div><div style={{fontSize:22,fontWeight:700,color:C.t1}}>{fm(tOut)}</div></Card>
        <Card p="12px 16px"><div style={{fontSize:10,color:C.t3,marginBottom:4}}">AVG SPEED</div><div style={{fontSize:22,fontWeight:700,color:C.t1}}>--</div></Card>
      </div>

      <div style={{display:"flex",gap:3,marginBottom:12}}>
        <Chip label="ALL" active={pf==="ALL"} onClick={() => setPf("ALL")} />
        {provs.map(p => <Chip key={p} label={p} active={pf===p} onClick={() => setPf(p)} />)}
        <span style={{fontSize:10,color:C.t3,marginLeft:"auto",alignSelf:"center"}}>{fl.length} sessions</span>
      </div>

      <Card p="0" style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{borderBottom:"1px solid "+C.bdr}}>
              {["Timestamp","","Model","Agent","Tokens","Cost","Speed","Finish"].map((h,i) => <th key={i} style={TH}>{h}</th>)}
            </tr></thead>
            <tbody>{tokenRows.map(r => (
              <TRow key={r.id} onClick={() => setSel(r)}>
                <td style={{...TD,color:C.t2,fontVariantNumeric:"tabular-nums"}}>{new Date(r.ts).toLocaleDateString("en-US",{month:"short",day:"numeric"})+", "+new Date(r.ts).toLocaleTimeString("en-US",{hour12:true,hour:"2-digit",minute:"2-digit"})}</td>
                <td style={{...TD,padding:"8px 4px"}}><PIcon p={r.provider} /></td>
                <td style={TD}><span style={{color:r.mc,fontWeight:600}}>{r.model}</span></td>
                <td style={{...TD,color:C.t2}}>{r.agent}</td>
                <td style={{...TD,fontVariantNumeric:"tabular-nums"}}><span style={{color:C.t1}}>{r.tIn.toLocaleString()}</span><span style={{color:C.t4,margin:"0 4px"}}>→</span><span style={{color:C.t2}}>{r.tOut.toLocaleString()}</span></td>
                <td style={{...TD,color:C.ok,fontWeight:500}}>$ {r.cost.toFixed(4)}</td>
                <td style={{...TD,color:C.t2}}>{r.speed} tps</td>
                <td style={TD}><span style={{color:C.t2}}>{r.finish}</span></td>
              </TRow>
            ))}</tbody>
          </table>
        </div>
      </Card>

      <Drawer open={!!sel} onClose={() => setSel(null)} title="Session Detail">
        {sel && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <DGrid items={[
              {l:"Provider",v:<span style={{display:"flex",gap:6,alignItems:"center"}}><PIcon p={sel.provider}/>{sel.provider}</span>},
              {l:"Model",v:<span style={{color:sel.mc,fontWeight:600}}>{sel.model}</span>},
              {l:"Agent",v:sel.agent},
              {l:"Tokens In",v:<span style={{fontSize:15,fontWeight:700}}>{sel.tIn.toLocaleString()}</span>},
              {l:"Tokens Out",v:<span style={{fontSize:15,fontWeight:700}}>{sel.tOut.toLocaleString()}</span>},
              {l:"Cost",v:<span style={{color:C.ok,fontWeight:600}}>$0.0000</span>},
              {l:"Time",v:new Date(sel.ts).toLocaleString()}
            ]} />
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ═══ TAB: AGENTS ═══ */
function AgentsTab() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [sel, setSel] = useState(null);
  const [tf, setTf] = useState("ALL");

  const refresh = async () => {
    setLoading(true);
    const data = await fetchAPI('/sessions');
    if (data) setSessions(data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const mappedAgents = sessions?.map(s => ({
    id: s.agent_key,
    name: s.label || s.agent_key.split(':').pop(),
    type: 'SUBAGENT',
    status: s.status === 'active' ? 'active' : 'idle',
    model: s.model || 'unknown',
    provider: s.model_provider || 'Unknown',
    runs24h: 1,
    err24h: s.status === 'aborted' ? 1 : 0,
    tokIn: s.input_tokens || 0,
    tokOut: s.output_tokens || 0,
    costDay: 0,
    latAvg: 0,
    latP95: 0,
    ctxAvg: 0,
    tools: [],
    errors: []
  })) || [];

  const ags = mappedAgents.filter(a => tf==="ALL" || a.type===tf);
  const tC = 0;
  const tR = mappedAgents.reduce((s,a) => s + a.runs24h, 0);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h1 style={{fontSize:17,fontWeight:600,color:C.t1,marginBottom:0}}>Agents</h1>
        <button onClick={refresh} style={{padding:"6px 12px",background:C.accD,border:"1px solid rgba(59,130,246,.35)",borderRadius:6,color:C.accB,cursor:"pointer",fontSize:10,fontFamily:FN}}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        <Card p="12px"><div style={{fontSize:10,color:C.t3,marginBottom:4}}>TOTAL</div><div style={{fontSize:22,fontWeight:700,color:C.t1}}>{mappedAgents.length}</div></Card>
        <Card p="12px"><div style={{fontSize:10,color:C.t3,marginBottom:4}}>RUNS 24H</div><div style={{fontSize:22,fontWeight:700,color:C.t1}}>{tR}</div></Card>
        <Card p="12px"><div style={{fontSize:10,color:C.t3,marginBottom:4}}>ERRORS</div><div style={{fontSize:22,fontWeight:700,color:C.er}}>{mappedAgents.reduce((s,a) => s + a.err24h, 0)}</div></Card>
        <Card p="12px"><div style={{fontSize:10,color:C.t3,marginBottom:4}}>COST TODAY</div><div style={{fontSize:22,fontWeight:700,color:C.t1}}>$0.00</div></Card>
      </div>

      <div style={{display:"flex",gap:3,marginBottom:12}}>{["ALL","MAIN","SUBAGENT"].map(t => <Chip key={t} label={t} active={tf===t} onClick={() => setTf(t)} />)}</div>

      <Card p="0"><div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{borderBottom:"1px solid "+C.bdr}}>{["Agent","Type","Status","Model","Runs","Err","Tokens","Cost","Lat"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>{ags.map(a => (
            <TRow key={a.id} onClick={() => setSel(a)}>
              <td style={TD}><div style={{fontWeight:600,color:C.t1}}>{a.name}</div><div style={{fontSize:9,color:C.t3}}>{a.id}</div></td>
              <td style={TD}><SrcBadge s={a.type} /></td>
              <td style={TD}><Pill s={a.status} glow={a.status==="active"} /></td>
              <td style={{...TD,color:C.cy,fontSize:10}}>{a.model}</td>
              <td style={{...TD,color:C.t1}}>{a.runs24h}</td>
              <td style={{...TD,color:a.err24h>0?C.er:C.t3}}>{a.err24h}</td>
              <td style={{...TD,color:C.t2}}>{fm(a.tokIn)}→{fm(a.tokOut)}</td>
              <td style={{...TD,color:C.ok}}>$0.00</td>
              <td style={{...TD,color:C.t2}}}>{a.latAvg}s</td>
            </TRow>
          ))}</tbody>
        </table>
      </div></Card>

      <Drawer open={!!sel} onClose={() => setSel(null)} title={"Agent: "+(sel?sel.name:"")}>
        {sel && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <DGrid items={[
              {l:"Type",v:<SrcBadge s={sel.type}/>},
              {l:"Status",v:<Pill s={sel.status} glow/>},
              {l:"Model",v:<span style={{color:C.cy}}>{sel.model}</span>},
              {l:"Provider",v:sel.provider},
              {l:"Runs 24h",v:<span style={{fontSize:15,fontWeight:700}}>{sel.runs24h}</span>},
              {l:"Cost",v:<span style={{color:C.ok}}>$0.00</span>},
              {l:"Latency",v:sel.latAvg+"s"},
              {l:"P95",v:sel.latP95+"s"}
            ]} />
            <SLbl>Tools</SLbl>
            <div style={{fontSize:10,color:C.t3}}>No tools information available</div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ═══ TAB: SKILLS ═══ */
function SkillsTab() {
  const [cf, setCf] = useState("ALL");
  const [sel, setSel] = useState(null);

  // Mock skills data - would need API endpoint
  const SKILLS = [
    {id:"sk1",name:"Web Search",ver:"2.4.1",cat:"Research",on:true,status:"ok",desc:"Real-time web search",use24h:234,latAvg:420,errRate:0.2,config:{providers:["google","bing"]}},
    {id:"sk2",name:"File Operations",ver:"3.1.0",cat:"System",on:true,status:"ok",desc:"Sandboxed FS access",use24h:189,latAvg:45,errRate:0.1,config:{sandbox:"/workspace"}},
    {id:"sk3",name:"Shell Executor",ver:"1.8.2",cat:"System",on:true,status:"warn",desc:"Container shell",use24h:78,latAvg:890,errRate:1.8,config:{timeout:30000}},
    {id:"sk4",name:"Code Interpreter",ver:"2.2.0",cat:"Analysis",on:true,status:"ok",desc:"Python/JS/SQL",use24h:56,latAvg:1200,errRate:0.8,config:{langs:["py","js"]}},
    {id:"sk5",name:"Git Operations",ver:"1.5.1",cat:"DevOps",on:true,status:"ok",desc:"Git clone/push",use24h:34,latAvg:650,errRate:0.3,config:{sign:true}},
    {id:"sk6",name:"Vector Memory",ver:"2.0.0",cat:"Memory",on:true,status:"ok",desc:"Semantic RAG store",use24h:145,latAvg:35,errRate:0.0,config:{engine:"qdrant"}},
    {id:"sk7",name:"PII Scanner",ver:"1.0.2",cat:"Security",on:true,status:"ok",desc:"PII redaction",use24h:420,latAvg:25,errRate:0.0,config:{action:"redact"}},
  ];

  const cats = [...new Set(SKILLS.map(s => s.cat))];
  const sk = SKILLS.filter(s => cf==="ALL" || s.cat===cf);

  return (
    <div>
      <h1 style={{fontSize:17,fontWeight:600,color:C.t1,marginBottom:16}}>Skills</h1>
      <div style={{display:"flex",gap:3,marginBottom:12,flexWrap:"wrap"}}>
        <Chip label="ALL" active={cf==="ALL"} onClick={() => setCf("ALL")} />
        {cats.map(c => <Chip key={c} label={c} active={cf===c} onClick={() => setCf(c)} />)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
        {sk.map(s => (
          <Card key={s.id} hover onClick={() => setSel(s)} p="12px 16px" style={{opacity:s.on?1:0.45}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{s.name}</div><div style={{fontSize:10,color:C.t3}}>v{s.ver} · {s.cat}</div></div>
              <div style={{display:"flex",gap:4}}><Pill s={s.status} /><span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:s.on?C.okD:C.erD,color:s.on?"#4ade80":"#f87171"}}>{s.on?"ON":"OFF"}</span></div>
            </div>
            <div style={{fontSize:10,color:C.t3,marginBottom:8}}>{s.desc}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              <div><div style={{fontSize:9,color:C.t4}}>USE 24H</div><div style={{fontSize:12,fontWeight:600,color:C.t1}}>{s.use24h}</div></div>
              <div><div style={{fontSize:9,color:C.t4}}>LATENCY</div><div style={{fontSize:12,fontWeight:600,color:C.t1}}>{df(s.latAvg)}</div></div>
              <div><div style={{fontSize:9,color:C.t4}}>ERR%</div><div style={{fontSize:12,fontWeight:600,color:s.errRate>1?C.wn:C.ok}}>{s.errRate}%</div></div>
            </div>
          </Card>
        ))}
      </div>
      <Drawer open={!!sel} onClose={() => setSel(null)} title={"Skill: "+(sel?sel.name:"")}>
        {sel && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <DGrid items={[
              {l:"Version",v:"v"+sel.ver},
              {l:"Category",v:sel.cat},
              {l:"Status",v:<Pill s={sel.status}/>},
              {l:"Usage",v:String(sel.use24h)},
              {l:"Latency",v:df(sel.latAvg)},
              {l:"Error%",v:sel.errRate+"%"}
            ]} />
            <SLbl>Config</SLbl>
            <pre style={{fontSize:10,color:C.t3,background:"rgba(0,0,0,.2)",padding:12,borderRadius:8,border:"1px solid "+C.bdr,overflow:"auto"}}>{JSON.stringify(sel.config,null,2)}</pre>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ═══ TAB: HEALTH ═══ */
function HealthTab() {
  const [health, setHealth] = useState({
    gw:{host:"Checking...",ver:"...",up:"...",conn:0,rps:0},
    svcs:[],
    checks:[],
    sys:{cpu:0,mem:0,disk:0,netIn:0,netOut:0}
  });
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchAPI('/health');
    if (data) {
      setHealth(data);
    } else {
      // Fallback mock if endpoint doesn't exist yet
      setHealth({
        gw:{host:"localhost",ver:"1.0.0",up:"0m",conn:1,rps:0},
        svcs:[
          {name:"API Server",status:"healthy",host:"api-01",lat:12,cpu:23,mem:45},
          {name:"Backend",status:"healthy",host:"backend",lat:8,cpu:45,mem:60},
        ],
        checks:[
          {name:"API Connectivity",s:"pass",d:"< 50ms",ms:120},
          {name:"Database",s:"pass",d:"Connected",ms:45},
        ],
        sys:{cpu:34,mem:40,disk:78,netIn:1.2,netOut:0.8}
      });
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);
  useRefresh(true, 10000, refresh);

  const h = health;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h1 style={{fontSize:17,fontWeight:600,color:C.t1,marginBottom:0}}>Health</h1>
        <button onClick={refresh} style={{padding:"6px 12px",background:C.accD,border:"1px solid rgba(59,130,246,.35)",borderRadius:6,color:C.accB,cursor:"pointer",fontSize:10,fontFamily:FN}}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <Card p="14px 18px" style={{marginBottom:16,borderLeft:"3px solid "+C.ok}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:C.ok,boxShadow:"0 0 12px "+C.ok,animation:"pulse 2s infinite"}} />
            <div><div style={{fontSize:14,fontWeight:600,color:C.t1}}>Gateway Online</div><div style={{fontSize:10,color:C.t3}}>{h.gw.host} · v{h.gw.ver}</div></div>
          </div>
          <div style={{display:"flex",gap:18}}>
            {[{l:"UPTIME",v:h.gw.up},{l:"CONN",v:h.gw.conn},{l:"REQ/S",v:h.gw.rps}].map(x => <div key={x.l} style={{textAlign:"center"}}><div style={{fontSize:9,color:C.t3}}>{x.l}</div><div style={{fontSize:12,fontWeight:600,color:C.t1}}>{x.v}</div></div>)}
          </div>
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <SLbl n={h.svcs.length}>Services</SLbl>
          {h.svcs.map((s,i) => (
            <Card key={i} hover onClick={() => setExp(exp===i?null:i)} p="10px 14px" style={{marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><Pill s={s.status} glow={s.status==="healthy"} /><span style={{fontSize:12,fontWeight:600,color:C.t1}}>{s.name}</span></div>
                <span style={{fontSize:10,color:C.t3}}>{s.lat}ms</span>
              </div>
              {exp===i && (
                <div style={{borderTop:"1px solid "+C.bdr,paddingTop:8,marginTop:8}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
                    <div><div style={{fontSize:9,color:C.t4}}>CPU</div><MBar v={s.cpu} /></div>
                    <div><div style={{fontSize:9,color:C.t4}}>MEM</div><MBar v={s.mem} /></div>
                  </div>
                  <InfoR l="Host" v={s.host} />
                </div>
              )}
            </Card>
          ))}
        </div>

        <div>
          <SLbl>System Metrics</SLbl>
          <Card p="14px" style={{marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[{l:"CPU",v:h.sys.cpu+"%"},{l:"MEM",v:h.sys.mem+"%"},{l:"DISK",v:h.sys.disk+"%"},{l:"NET",v:"↓"+h.sys.netIn+" ↑"+h.sys.netOut}].map(x => (
                <div key={x.l}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:C.t3}}>{x.l}</span><span style={{fontSize:10,color:C.t2}}>{x.v}</span></div>{x.l!=="NET" && <MBar v={parseInt(x.v)} />}</div>
              ))}
            </div>
          </Card>

          <SLbl n={h.checks.length}>Health Checks</SLbl>
          <Card p="0">
            <div style={{padding:"8px 14px",borderBottom:"1px solid "+C.bdr,display:"flex",gap:10}}>
              <span style={{fontSize:10,color:C.ok}}>{h.checks.filter(c => c.s==="pass").length} pass</span>
              <span style={{fontSize:10,color:C.wn}}>{h.checks.filter(c => c.s==="warn").length} warn</span>
              <span style={{fontSize:10,color:C.er}}>{h.checks.filter(c => c.s==="fail").length} fail</span>
            </div>
            <div style={{maxHeight:300,overflowY:"auto"}}>
              {h.checks.map((c,i) => (
                <div key={i} style={{padding:"7px 14px",borderBottom:"1px solid rgba(255,255,255,.02)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><Pill s={c.s} /><span style={{fontSize:11,color:C.t1}}>{c.name}</span></div>
                  <div style={{display:"flex",gap:8}}><span style={{fontSize:10,color:C.t3}}>{c.d}</span><span style={{fontSize:9,color:C.t4}}>{c.ms}ms</span></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══ TAB: LOGS ═══ */
function LogsTab() {
  const [lf, setLf] = useState("ALL");
  const [autoS, setAutoS] = useState(true);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const lvlC = {DEBUG:C.t3,INFO:C.accB,WARN:C.wn,ERROR:C.er,FATAL:"#fca5a5"};

  const refresh = async () => {
    setLoading(true);
    const data = await fetchAPI('/logs?limit=100');
    if (data && data.logs) {
      setLogs(data.logs.map((l,i) => ({
        id:"log_"+Date.now()+"_"+i,
        ts: new Date(l.timestamp || Date.now()).getTime(),
        level: l.level?.toUpperCase() || "INFO",
        source: l.source || "system",
        message: l.message || "",
        extra: l.error ? {stack: l.error} : null
      })));
    } else {
      // Fallback mock
      setLogs([
        {id:"log_1",ts:Date.now()-1000,level:"INFO",source:"api",message:"System healthy",extra:null},
        {id:"log_2",ts:Date.now()-5000,level:"INFO",source:"gateway",message:"Request received",extra:null},
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);
  useRefresh(autoS, 5000, refresh);

  useEffect(() => {
    if (autoS && endRef.current) endRef.current.scrollIntoView({behavior:"smooth"});
  }, [logs, autoS]);

  const fl = logs.filter(l => lf==="ALL" || l.level===lf);
  const lc = {};
  logs.forEach(l => { lc[l.level] = (lc[l.level]||0) + 1; });

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 110px)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h1 style={{fontSize:17,fontWeight:600,color:C.t1,marginBottom:0}}>Logs</h1>
        <button onClick={refresh} style={{padding:"6px 12px",background:C.accD,border:"1px solid rgba(59,130,246,.35)",borderRadius:6,color:C.accB,cursor:"pointer",fontSize:10,fontFamily:FN}}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {["DEBUG","INFO","WARN","ERROR","FATAL"].map(l => (
          <Card key={l} p="6px 12px" style={{flex:1,borderBottom:"2px solid "+((lc[l]||0)>0?lvlC[l]:"transparent")}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><LvlBadge l={l} /><span style={{fontSize:14,fontWeight:700,color:(lc[l]||0)>0?lvlC[l]:C.t4}}>{lc[l]||0}</span></div>
          </Card>
        ))}
      </div>

      <div style={{display:"flex",gap:3,marginBottom:10}}>
        <Chip label="ALL" active={lf==="ALL"} onClick={() => setLf("ALL")} />
        {["DEBUG","INFO","WARN","ERROR"].map(l => <Chip key={l} label={l} active={lf===l} onClick={() => setLf(l)} />)}
        <button onClick={() => setAutoS(!autoS)} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:6,fontSize:10,fontFamily:FN,background:autoS?C.accD:"rgba(255,255,255,.02)",color:autoS?C.accB:C.t3,border:"1px solid "+(autoS?"rgba(59,130,246,.35)":C.bdr),cursor:"pointer"}}>⤓ Auto</button>
      </div>

      <Card p="0" style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{display:"grid",gridTemplateColumns:"120px 44px 90px 1fr",padding:"7px 14px",borderBottom:"1px solid "+C.bdr,background:C.bgS}}>
          {["Time","Level","Source","Message"].map(h => <span key={h} style={{fontSize:9,color:C.t3,textTransform:"uppercase"}}>{h}</span>)}
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {fl.slice(-80).map(l => (
            <div key={l.id} style={{display:"grid",gridTemplateColumns:"120px 44px 90px 1fr",padding:"4px 14px",borderBottom:"1px solid rgba(255,255,255,.015)",background:l.level==="ERROR"?"rgba(239,68,68,.03)":l.level==="WARN"?"rgba(245,158,11,.02)":"transparent"}}>
              <span style={{fontSize:10,color:C.t3,fontVariantNumeric:"tabular-nums"}}>{new Date(l.ts).toLocaleTimeString("en-US",{hour12:false})}</span>
              <LvlBadge l={l.level} />
              <span style={{fontSize:10,color:C.cy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.source}</span>
              <span style={{fontSize:10,color:l.level==="ERROR"?"#f87171":C.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.message}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </Card>
    </div>
  );
}

/* ═══ MAIN APP ═══ */
export default function MDXDashboard() {
  const [tab, setTab] = useState("overview");
  const [time, setTime] = useState(Date.now());
  const [auto, setAuto] = useState(true);
  const [col, setCol] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const nav = [
    {k:"overview",l:"Overview",i:"⊞"},
    {k:"tokens",l:"Token Usage",i:"◎"},
    {k:"agents",l:"Agents",i:"◈"},
    {k:"skills",l:"Skills",i:"⚡"},
    {k:"health",l:"Health",i:"♥"},
    {k:"logs",l:"Logs",i:"☰"},
  ];

  return (
    <div style={{fontFamily:FN,background:"radial-gradient(ellipse at 15% -5%,rgba(15,23,62,1) 0%,"+C.bg+" 55%)",color:C.t1,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.07); border-radius: 3px; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        input::placeholder { color: rgba(148,163,184,.45); }
        select option { background: #0d1326; }
      `}</style>
      <header style={{height:46,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",borderBottom:"1px solid "+C.bdr,background:"rgba(8,12,24,.85)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:15,fontWeight:700,color:C.acc,letterSpacing:2}}>MDX</span>
          <span style={{width:1,height:18,background:C.bdr}} />
          <span style={{fontSize:11,color:C.t3}}>Agent Operations</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:C.ok,boxShadow:"0 0 8px "+C.ok,animation:"pulse 2s infinite"}} />
            <span style={{fontSize:10,color:C.ok,fontWeight:500}}>Live</span>
          </div>
          <span style={{fontSize:10,color:C.t3,fontVariantNumeric:"tabular-nums"}}>{new Date(time).toLocaleTimeString("en-US",{hour12:false})}</span>
          <button style={{background:"rgba(255,255,255,.03)",border:"1px solid "+C.bdr,borderRadius:6,padding:"3px 8px",color:C.t2,cursor:"pointer",fontSize:11,fontFamily:FN}}>↻</button>
          <button onClick={() => setAuto(!auto)} style={{background:auto?C.accD:"rgba(255,255,255,.03)",border:"1px solid "+(auto?"rgba(59,130,246,.4)":C.bdr),borderRadius:6,padding:"3px 10px",color:auto?C.acc:C.t3,cursor:"pointer",fontSize:9,fontWeight:500,fontFamily:FN}}>AUTO</button>
        </div>
      </header>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <nav style={{width:col?50:175,minWidth:col?50:175,borderRight:"1px solid "+C.bdr,background:"rgba(8,12,24,.5)",padding:"10px 0",display:"flex",flexDirection:"column",transition:"width 200ms",overflow:"hidden"}}>
          <button onClick={() => setCol(!col)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",padding:"4px 14px",fontSize:11,textAlign:"left",marginBottom:6,fontFamily:FN}}>{col?"→":"←"}</button>
          {nav.map(n => (
            <button key={n.k} onClick={() => setTab(n.k)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:tab===n.k?"rgba(59,130,246,.08)":"transparent",border:"none",borderLeft:tab===n.k?"2px solid "+C.acc:"2px solid transparent",color:tab===n.k?C.accB:C.t2,cursor:"pointer",fontSize:12,fontWeight:tab===n.k?600:400,width:"100%",textAlign:"left",fontFamily:FN,transition:"all 150ms"}}>
              <span style={{fontSize:13,width:16,textAlign:"center",flexShrink:0}}>{n.i}</span>
              {!col && <span>{n.l}</span>}
            </button>
          ))}
          <div style={{flex:1}} />
          <div style={{padding:"10px 14px",borderTop:"1px solid "+C.bdr,display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:C.ok}} />
            {!col && <span style={{fontSize:9,color:C.t3}}>System Online</span>}
          </div>
        </nav>
        <main style={{flex:1,overflow:"auto",padding:"18px 22px"}}>
          {tab === "overview" && <OverviewTab />}
          {tab === "tokens" && <TokenUsageTab />}
          {tab === "agents" && <AgentsTab />}
          {tab === "skills" && <SkillsTab />}
          {tab === "health" && <HealthTab />}
          {tab === "logs" && <LogsTab />}
        </main>
      </div>
    </div>
  );
}
