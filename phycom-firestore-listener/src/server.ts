/**
 * Express HTTP Server with API endpoints
 */

import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { getAll } from './usecase.js';
import { addClient, removeClient, startKeepalive, broadcastDrawUpdate } from './sseManager.js';
import type { DrawItem } from './apiTypes.js';
import type { PhycomDrawDoc } from './types.js';

const PORT = parseInt(process.env.PORT || '4001', 10);

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

/**
 * Convert Firestore doc to DrawItem
 */
function toDrawItem(id: string, data: PhycomDrawDoc): DrawItem | null {
  if (!data.outputPath) return null;
  
  return {
    id,
    outputPath: data.outputPath,
    outputUrl: (data as Record<string, unknown>).outputUrl as string || data.outputPath,
    createdAt: (data as Record<string, unknown>).createdAt as number | undefined,
    updatedAt: data.updatedAt ?? undefined,
    status: (data as Record<string, unknown>).status as string | undefined,
  };
}

/**
 * GET /api/draws - Get all documents with outputPath
 */
app.get('/api/draws', async (_req: Request, res: Response) => {
  try {
    console.log('📥 GET /api/draws');
    const docs = await getAll();
    
    const items: DrawItem[] = docs
      .map(doc => toDrawItem(doc.id, doc.data))
      .filter((item): item is DrawItem => item !== null)
      .sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0));
    
    console.log(`   Returning ${items.length} items`);
    res.json(items);
  } catch (error) {
    console.error('❌ Error in GET /api/draws:', error);
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

/**
 * GET /api/stream - SSE endpoint for real-time updates
 */
app.get('/api/stream', (req: Request, res: Response) => {
  console.log('📡 New SSE connection');
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  
  // Send initial connection event
  res.write('event: connected\ndata: {"status":"connected"}\n\n');
  
  // Add to client list
  addClient(res);
  
  // Handle disconnect
  req.on('close', () => {
    removeClient(res);
  });
});

/**
 * POST /api/rebuild - Re-emit all docs via SSE
 */
app.post('/api/rebuild', async (_req: Request, res: Response) => {
  try {
    console.log('🔄 POST /api/rebuild');
    const docs = await getAll();
    
    let processedCount = 0;
    for (const doc of docs) {
      const item = toDrawItem(doc.id, doc.data);
      if (item) {
        broadcastDrawUpdate(item);
        processedCount++;
      }
    }
    
    console.log(`   Broadcasted ${processedCount} items`);
    res.json({ processedCount });
  } catch (error) {
    console.error('❌ Error in POST /api/rebuild:', error);
    res.status(500).json({ error: 'Failed to rebuild' });
  }
});

/**
 * Start the HTTP server
 */
export function startServer(onDocProcessed?: (item: DrawItem) => void): void {
  // Start keepalive for SSE
  startKeepalive();
  
  app.listen(PORT, () => {
    console.log(`🌐 HTTP API listening on http://localhost:${PORT}`);
    console.log(`   GET  /api/draws  - Fetch all draws`);
    console.log(`   GET  /api/stream - SSE stream`);
    console.log(`   POST /api/rebuild - Trigger rebuild`);
  });
}

// Export toDrawItem for use in listener
export { toDrawItem };
