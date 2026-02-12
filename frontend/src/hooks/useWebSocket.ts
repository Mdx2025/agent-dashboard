// WebSocket Hook for Real-Time Dashboard Updates
// Handles connection, reconnection, and subscription management

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000';

interface WebSocketConfig {
  enabled: boolean;
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

interface UseWebSocketReturn {
  connected: boolean;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(
  onConnect?: () => void,
  onDisconnect?: () => void,
  onError?: (error: Error) => void,
  config: Partial<WebSocketConfig> = {}
): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reconnectAttemptsRef = useRef(0);

  const defaultConfig: WebSocketConfig = {
    enabled: true,
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    ...config,
  };

  const connect = useCallback(() => {
    if (!defaultConfig.enabled) {
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    try {
      const token = localStorage.getItem('dashboard_token');

      socketRef.current = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: defaultConfig.autoReconnect,
        reconnectionDelay: defaultConfig.reconnectInterval,
        reconnectionAttempts: defaultConfig.reconnectAttempts,
        auth: token ? { token } : undefined,
        timeout: 10000,
      });

      socketRef.current.on('connect', () => {
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      });

      socketRef.current.on('disconnect', (reason) => {
        setConnected(false);
        onDisconnect?.();

        if (reason === 'io server disconnect') {
          // Server disconnected us, don't auto-reconnect
          socketRef.current?.disconnect();
        }
      });

      socketRef.current.on('connect_error', (err) => {
        setError(err);
        onError?.(err);

        if (defaultConfig.autoReconnect) {
          reconnectAttemptsRef.current++;
        }
      });

      socketRef.current.on('error', (err) => {
        setError(err);
        onError?.(err);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create WebSocket');
      setError(error);
      onError?.(error);
    }
  }, [defaultConfig, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    error,
    reconnect,
    disconnect,
  };
}

// ============================================================================
// Event Subscription Hooks
// ============================================================================

export function useTokenUsageUpdate(
  callback: (data: { agent_id: string; tokens_used: number; cost_usd: number }) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', { event: 'token_usage' });
    });

    socket.on('token_usage:update', callback);

    return () => {
      socket.off('token_usage:update');
      socket.disconnect();
    };
  }, [callback]);
}

export function useAgentStatusUpdate(
  callback: (data: { agent_id: string; status: 'active' | 'inactive' | 'error' }) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', { event: 'agent_status' });
    });

    socket.on('agent_status:update', callback);

    return () => {
      socket.off('agent_status:update');
      socket.disconnect();
    };
  }, [callback]);
}

export function useHealthMetricUpdate(
  callback: (data: { metric: string; value: number; status: 'healthy' | 'warning' | 'critical' }) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', { event: 'health_metrics' });
    });

    socket.on('health_metrics:update', callback);

    return () => {
      socket.off('health_metrics:update');
      socket.disconnect();
    };
  }, [callback]);
}

export function useNewLogEntry(
  callback: (data: { id: string; timestamp: string; level: string; agent_id: string | null; message: string }) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', { event: 'new_logs' });
    });

    socket.on('logs:new', callback);

    return () => {
      socket.off('logs:new');
      socket.disconnect();
    };
  }, [callback]);
}

// ============================================================================
// Reusable Data Hook with WebSocket Updates
// ============================================================================

export function useDataWithWebSocket<T>(
  fetchFn: () => Promise<T>,
  updateEvent: string,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { connected } = useWebSocket(
    () => {
      // Refetch data on reconnection
      fetchData();
    },
    undefined,
    (err) => {
      setError(err);
    },
    { enabled }
  );

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!connected) return;

    const token = localStorage.getItem('dashboard_token');
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });

    socket.on('connect', () => {
      socket.emit('subscribe', { event: updateEvent });
    });

    socket.on(updateEvent, async () => {
      await fetchData();
    });

    return () => {
      socket.off(updateEvent);
      socket.disconnect();
    };
  }, [connected, updateEvent, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
