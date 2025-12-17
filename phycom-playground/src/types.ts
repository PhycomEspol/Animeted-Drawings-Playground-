/**
 * Type definitions for PhyCom Playground
 */

export interface DrawItem {
  id: string;
  outputPath: string;
  outputUrl: string;
  createdAt?: number;
  updatedAt?: number;
  status?: string;
  // For random board position
  position?: {
    x: number;
    y: number;
  };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface DrawsState {
  draws: DrawItem[];
  connectionStatus: ConnectionStatus;
}

export type DrawsAction =
  | { type: 'LOAD_INITIAL'; payload: DrawItem[] }
  | { type: 'UPSERT_DRAW'; payload: DrawItem }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus };
