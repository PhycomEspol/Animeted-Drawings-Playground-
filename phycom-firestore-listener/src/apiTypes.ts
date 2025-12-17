/**
 * API Types for the HTTP server
 */

/**
 * DrawItem - represents a processed draw for API responses
 */
export interface DrawItem {
  id: string;
  outputPath: string;
  outputUrl: string;
  createdAt?: number;
  updatedAt?: number;
  status?: string;
}

/**
 * SSE Event types
 */
export type SSEEventType = 'draw_updated' | 'ping';

export interface SSEEvent {
  event: SSEEventType;
  data: DrawItem | { t: number };
}
