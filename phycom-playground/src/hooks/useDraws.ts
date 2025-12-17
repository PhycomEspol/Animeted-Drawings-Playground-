/**
 * useDraws hook - manages draw state with useReducer and SSE connection
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { DrawItem, DrawsState, DrawsAction, ConnectionStatus } from '../types';

const LISTENER_BASE_URL = import.meta.env.VITE_LISTENER_BASE_URL || 'http://localhost:4001';

/**
 * Get random position within viewport bounds
 */
function getRandomPosition(): { x: number; y: number } {
  const maxX = Math.max(50, window.innerWidth - 250);
  const maxY = Math.max(50, window.innerHeight - 250);
  return {
    x: Math.floor(Math.random() * maxX),
    y: Math.floor(Math.random() * maxY),
  };
}

/**
 * Reducer for draws state
 */
function drawsReducer(state: DrawsState, action: DrawsAction): DrawsState {
  switch (action.type) {
    case 'LOAD_INITIAL': {
      const sorted = [...action.payload]
        .map(draw => ({
          ...draw,
          position: getRandomPosition(),
        }))
        .sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0));
      return { ...state, draws: sorted };
    }
    case 'UPSERT_DRAW': {
      const existingIndex = state.draws.findIndex(d => d.id === action.payload.id);
      const drawWithPosition = {
        ...action.payload,
        position: existingIndex >= 0 
          ? state.draws[existingIndex].position 
          : getRandomPosition(),
      };
      
      let newDraws: DrawItem[];
      if (existingIndex >= 0) {
        newDraws = [...state.draws];
        newDraws[existingIndex] = drawWithPosition;
      } else {
        newDraws = [drawWithPosition, ...state.draws];
      }
      
      // Keep sorted by timestamp
      newDraws.sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0));
      return { ...state, draws: newDraws };
    }
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    default:
      return state;
  }
}

const initialState: DrawsState = {
  draws: [],
  connectionStatus: 'connecting',
};

/**
 * Custom hook for managing draws with SSE
 */
export function useDraws() {
  const [state, dispatch] = useReducer(drawsReducer, initialState);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial draws
  const fetchDraws = useCallback(async () => {
    try {
      const response = await fetch(`${LISTENER_BASE_URL}/api/draws`);
      if (!response.ok) throw new Error('Failed to fetch draws');
      const data: DrawItem[] = await response.json();
      dispatch({ type: 'LOAD_INITIAL', payload: data });
    } catch (error) {
      console.error('Error fetching draws:', error);
    }
  }, []);

  // Set connection status
  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
  }, []);

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    const eventSource = new EventSource(`${LISTENER_BASE_URL}/api/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connected');
      setConnectionStatus('connected');
    };

    eventSource.addEventListener('connected', () => {
      setConnectionStatus('connected');
    });

    eventSource.addEventListener('draw_updated', (event) => {
      try {
        const draw: DrawItem = JSON.parse(event.data);
        console.log('Received draw_updated:', draw.id);
        dispatch({ type: 'UPSERT_DRAW', payload: draw });
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    });

    eventSource.addEventListener('ping', () => {
      // Keepalive ping, no action needed
    });

    eventSource.onerror = () => {
      console.error('SSE error, reconnecting...');
      setConnectionStatus('disconnected');
      eventSource.close();
      // Browser will auto-reconnect for EventSource
      setTimeout(connectSSE, 3000);
    };
  }, [setConnectionStatus]);

  // Trigger rebuild
  const triggerRebuild = useCallback(async () => {
    try {
      await fetch(`${LISTENER_BASE_URL}/api/rebuild`, { method: 'POST' });
      await fetchDraws();
    } catch (error) {
      console.error('Error triggering rebuild:', error);
    }
  }, [fetchDraws]);

  // Initialize on mount
  useEffect(() => {
    fetchDraws();
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchDraws, connectSSE]);

  return {
    draws: state.draws,
    connectionStatus: state.connectionStatus,
    triggerRebuild,
    refreshDraws: fetchDraws,
  };
}
