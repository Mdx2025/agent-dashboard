"""
Agent Operations Dashboard - Backend
FastAPI-based API for monitoring OpenClaw agent sessions
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path
import json
from enum import Enum

app = FastAPI(
    title="Agent Operations Dashboard API",
    description="API for monitoring OpenClaw agent sessions and runs",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración
SESSIONS_DIR = Path("/home/clawd/.openclaw/agents/main/sessions")

# Models

class EventType(str, Enum):
    SESSION = "session"
    MESSAGE = "message"
    THINKING_LEVEL_CHANGE = "thinking_level_change"
    CUSTOM = "custom"

class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABORTED = "aborted"

class AgentRun(BaseModel):
    id: str
    session_id: str
    agent_key: str
    label: Optional[str] = None
    status: SessionStatus
    model: Optional[str] = None
    model_provider: Optional[str] = None
    channel: Optional[str] = None
    spawned_by: Optional[str] = None
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    origin_label: Optional[str] = None
    session_file: Optional[str] = None

class SessionEvent(BaseModel):
    type: EventType
    id: str
    parent_id: Optional[str] = None
    timestamp: datetime
    data: Dict[str, Any]

class ToolCall(BaseModel):
    id: str
    tool_name: str
    arguments: Dict[str, Any]
    timestamp: datetime
    duration_ms: Optional[int] = None
    result: Optional[Any] = None
    success: bool = True
    error: Optional[str] = None

class RunDetails(BaseModel):
    run: AgentRun
    events: List[SessionEvent]
    tool_calls: List[ToolCall]
    messages: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]

# Services

class OpenClawService:
    
    @staticmethod
    def parse_timestamp(ts: str) -> datetime:
        try:
            return datetime.fromisoformat(ts.replace('Z', '+00:00'))
        except:
            return datetime.now()
    
    @staticmethod
    def load_sessions_index() -> Dict[str, Any]:
        index_file = SESSIONS_DIR / "sessions.json"
        if index_file.exists():
            with open(index_file, 'r') as f:
                return json.load(f)
        return {}
    
    @staticmethod
    def load_session_file(session_id: str) -> List[Dict[str, Any]]:
        session_file = SESSIONS_DIR / f"{session_id}.jsonl"
        if not session_file.exists():
            session_file = SESSIONS_DIR / session_id
            if not session_file.exists():
                return []
        
        events = []
        with open(session_file, 'r') as f:
            for line in f:
                if line.strip():
                    events.append(json.loads(line))
        return events
    
    @staticmethod
    def load_all_session_files() -> Dict[str, List[Dict[str, Any]]]:
        sessions = {}
        for file_path in SESSIONS_DIR.glob("*.jsonl"):
            if file_path.name == "sessions.json":
                continue
            session_id = file_path.stem
            events = []
            with open(file_path, 'r') as f:
                for line in f:
                    if line.strip():
                        events.append(json.loads(line))
            if events:
                sessions[session_id] = events
        return sessions
    
    @classmethod
    def get_active_sessions(cls) -> List[AgentRun]:
        index = cls.load_sessions_index()
        sessions = []
        
        for agent_key, data in index.items():
            session_file = data.get("sessionFile", "")
            session_id = data.get("sessionId", agent_key)
            
            origin = data.get("origin", {})
            origin_label = origin.get("label", "Unknown")
            
            run = AgentRun(
                id=session_id,
                session_id=session_id,
                agent_key=agent_key,
                label=data.get("label") or agent_key.split(":")[-1] if ":" in agent_key else agent_key,
                status=SessionStatus.ABORTED if data.get("abortedLastRun") else SessionStatus.ACTIVE,
                model=data.get("model"),
                model_provider=data.get("modelProvider"),
                channel=data.get("channel"),
                spawned_by=data.get("spawnedBy"),
                input_tokens=data.get("inputTokens", 0),
                output_tokens=data.get("outputTokens", 0),
                total_tokens=data.get("totalTokens", 0),
                created_at=datetime.fromtimestamp(data.get("createdAt", 0)/1000) if data.get("createdAt") else None,
                updated_at=datetime.fromtimestamp(data.get("updatedAt", 0)/1000) if data.get("updatedAt") else None,
                origin_label=origin_label,
                session_file=session_file
            )
            sessions.append(run)
        
        return sessions
    
    @classmethod
    def get_run_details(cls, session_id: str) -> RunDetails:
        index = cls.load_sessions_index()
        run = None
        
        for agent_key, data in index.items():
            if data.get("sessionId") == session_id or agent_key == session_id:
                origin = data.get("origin", {})
                run = AgentRun(
                    id=session_id,
                    session_id=session_id,
                    agent_key=agent_key,
                    label=data.get("label") or agent_key.split(":")[-1],
                    status=SessionStatus.ABORTED if data.get("abortedLastRun") else SessionStatus.ACTIVE,
                    model=data.get("model"),
                    model_provider=data.get("modelProvider"),
                    channel=data.get("channel"),
                    spawned_by=data.get("spawnedBy"),
                    input_tokens=data.get("inputTokens", 0),
                    output_tokens=data.get("outputTokens", 0),
                    total_tokens=data.get("totalTokens", 0),
                    created_at=datetime.fromtimestamp(data.get("createdAt", 0)/1000) if data.get("createdAt") else None,
                    updated_at=datetime.fromtimestamp(data.get("updatedAt", 0)/1000) if data.get("updatedAt") else None,
                    origin_label=origin.get("label"),
                    session_file=data.get("sessionFile")
                )
                break
        
        events = cls.load_session_file(session_id)
        session_events = []
        tool_calls = []
        messages = []
        timeline = []
        
        for event in events:
            event_type = event.get("type", "unknown")
            timestamp = cls.parse_timestamp(event.get("timestamp", datetime.now().isoformat()))
            
            session_event = SessionEvent(
                type=EventType(event_type) if event_type in [e.value for e in EventType] else EventType.CUSTOM,
                id=event.get("id", ""),
                parent_id=event.get("parentId"),
                timestamp=timestamp,
                data=event
            )
            session_events.append(session_event)
            
            timeline.append({
                "timestamp": timestamp.isoformat(),
                "type": event_type,
                "id": event.get("id"),
                "summary": cls._get_event_summary(event)
            })
            
            if event_type == "message":
                msg = event.get("message", {})
                messages.append({
                    "id": event.get("id"),
                    "role": msg.get("role"),
                    "content": cls._extract_content(msg.get("content", [])),
                    "timestamp": timestamp.isoformat(),
                    "model": msg.get("model"),
                    "usage": msg.get("usage", {})
                })
            
            if event_type == "custom":
                custom_type = event.get("customType", "")
                tool_calls.append(ToolCall(
                    id=event.get("id", ""),
                    tool_name=custom_type or "custom",
                    arguments=event.get("data", {}),
                    timestamp=timestamp,
                    success=True
                ))
        
        if not run and events:
            first_event = events[0]
            run = AgentRun(
                id=session_id,
                session_id=session_id,
                agent_key=first_event.get("cwd", "unknown"),
                status=SessionStatus.COMPLETED,
                created_at=cls.parse_timestamp(first_event.get("timestamp", "")),
                updated_at=cls.parse_timestamp(events[-1].get("timestamp", "")) if events else None
            )
        elif not run:
            run = AgentRun(
                id=session_id,
                session_id=session_id,
                agent_key="unknown",
                status=SessionStatus.COMPLETED
            )
        
        return RunDetails(
            run=run,
            events=session_events,
            tool_calls=tool_calls,
            messages=messages,
            timeline=timeline
        )
    
    @staticmethod
    def _extract_content(content: List[Dict]) -> str:
        if isinstance(content, list):
            texts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    texts.append(item.get("text", ""))
            return "\n".join(texts)
        return str(content)
    
    @staticmethod
    def _get_event_summary(event: Dict) -> str:
        event_type = event.get("type", "")
        
        if event_type == "session":
            return f"Session started in {event.get('cwd', 'unknown')}"
        elif event_type == "message":
            msg = event.get("message", {})
            role = msg.get("role", "unknown")
            content = OpenClawService._extract_content(msg.get("content", []))
            preview = content[:100] + "..." if len(content) > 100 else content
            return f"[{role.upper()}] {preview}"
        elif event_type == "custom":
            custom_type = event.get("customType", "")
            return f"Custom event: {custom_type}"
        elif event_type == "thinking_level_change":
            level = event.get("thinkingLevel", "unknown")
            return f"Thinking level changed to: {level}"
        else:
            return f"{event_type}"

# Dependencies

def get_openclaw_service() -> OpenClawService:
    return OpenClawService()

# API Endpoints

@app.get("/")
async def root():
    return {
        "name": "Agent Operations Dashboard API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/sessions", response_model=List[AgentRun])
async def list_sessions(service: OpenClawService = Depends(get_openclaw_service)):
    return service.get_active_sessions()

@app.get("/api/sessions/{session_id}", response_model=RunDetails)
async def get_session_details(
    session_id: str,
    service: OpenClawService = Depends(get_openclaw_service)
):
    details = service.get_run_details(session_id)
    if not details.run.id:
        raise HTTPException(status_code=404, detail="Session not found")
    return details

@app.get("/api/sessions/{session_id}/events")
async def get_session_events(
    session_id: str,
    limit: int = 100,
    offset: int = 0,
    service: OpenClawService = Depends(get_openclaw_service)
):
    events = service.load_session_file(session_id)
    paginated = events[offset:offset+limit]
    return {
        "total": len(events),
        "limit": limit,
        "offset": offset,
        "events": paginated
    }

@app.get("/api/sessions/{session_id}/timeline")
async def get_session_timeline(
    session_id: str,
    service: OpenClawService = Depends(get_openclaw_service)
):
    details = service.get_run_details(session_id)
    return {
        "session_id": session_id,
        "timeline": details.timeline,
        "total_events": len(details.events)
    }

@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    service: OpenClawService = Depends(get_openclaw_service)
):
    details = service.get_run_details(session_id)
    return {
        "session_id": session_id,
        "messages": details.messages,
        "total": len(details.messages)
    }

@app.get("/api/sessions/{session_id}/tool-calls")
async def get_session_tool_calls(
    session_id: str,
    service: OpenClawService = Depends(get_openclaw_service)
):
    details = service.get_run_details(session_id)
    return {
        "session_id": session_id,
        "tool_calls": details.tool_calls,
        "total": len(details.tool_calls)
    }

@app.get("/api/analytics/overview")
async def get_analytics_overview(
    service: OpenClawService = Depends(get_openclaw_service)
):
    sessions = service.get_active_sessions()
    all_events = service.load_all_session_files()
    
    total_tokens = sum(s.total_tokens for s in sessions)
    total_messages = sum(len(events) for events in all_events.values())
    active_sessions = len([s for s in sessions if s.status == SessionStatus.ACTIVE])
    
    by_channel = {}
    for s in sessions:
        channel = s.channel or "unknown"
        if channel not in by_channel:
            by_channel[channel] = []
        by_channel[channel].append({
            "id": s.id,
            "label": s.label,
            "model": s.model,
            "tokens": s.total_tokens
        })
    
    return {
        "total_sessions": len(sessions),
        "active_sessions": active_sessions,
        "completed_sessions": len(sessions) - active_sessions,
        "total_tokens": total_tokens,
        "total_events": total_messages,
        "by_channel": by_channel,
        "models_used": list(set(s.model for s in sessions if s.model))
    }

@app.get("/api/recent-activity")
async def get_recent_activity(
    limit: int = 20,
    service: OpenClawService = Depends(get_openclaw_service)
):
    all_sessions = service.load_all_session_files()
    activities = []
    
    for session_id, events in all_sessions.items():
        for event in events[-5:]:
            event_type = event.get("type", "unknown")
            timestamp = OpenClawService.parse_timestamp(event.get("timestamp", ""))
            
            activities.append({
                "session_id": session_id,
                "type": event_type,
                "timestamp": timestamp.isoformat(),
                "summary": OpenClawService._get_event_summary(event)
            })
    
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
