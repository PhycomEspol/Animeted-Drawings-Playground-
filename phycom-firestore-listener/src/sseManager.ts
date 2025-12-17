/**
 * SSE Manager - handles Server-Sent Events connections
 */

import type { Response } from 'express';
import type { DrawItem } from './apiTypes.js';

// Connected SSE clients
const clients = new Set<Response>();

// Keepalive interval reference
let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Add a new SSE client
 */
export function addClient(res: Response): void {
  clients.add(res);
  console.log(`📡 SSE client connected. Total clients: ${clients.size}`);
}

/**
 * Remove an SSE client
 */
export function removeClient(res: Response): void {
  clients.delete(res);
  console.log(`📡 SSE client disconnected. Total clients: ${clients.size}`);
}

/**
 * Get the number of connected clients
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcast(event: string, data: DrawItem | { t: number }): void {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  for (const client of clients) {
    try {
      client.write(message);
    } catch (error) {
      console.error('❌ Error writing to SSE client:', error);
      clients.delete(client);
    }
  }
}

/**
 * Broadcast a draw_updated event
 */
export function broadcastDrawUpdate(drawItem: DrawItem): void {
  console.log(`📤 Broadcasting draw_updated for ${drawItem.id}`);
  broadcast('draw_updated', drawItem);
}

/**
 * Start the keepalive ping interval (every 25 seconds)
 */
export function startKeepalive(): void {
  if (keepaliveInterval) return;
  
  keepaliveInterval = setInterval(() => {
    if (clients.size > 0) {
      broadcast('ping', { t: Date.now() });
    }
  }, 25000);
  
  console.log('💓 SSE keepalive started (25s interval)');
}

/**
 * Stop the keepalive ping interval
 */
export function stopKeepalive(): void {
  if (keepaliveInterval) {
    clearInterval(keepaliveInterval);
    keepaliveInterval = null;
    console.log('💔 SSE keepalive stopped');
  }
}
