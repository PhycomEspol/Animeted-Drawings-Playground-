/**
 * Phycom Firestore Listener Service
 * Entry point - loads environment and starts the listener
 */

import 'dotenv/config';
import { logFirestoreConfig, projectId } from './firestore.js';
import { startListener } from './listener.js';
import { startServer } from './server.js';
import { broadcastDrawUpdate } from './sseManager.js';
import type { ListenerConfig, PhycomDrawDoc } from './types.js';
import type { DrawItem } from './apiTypes.js';

// Configuration
const COLLECTION_NAME = 'phycom_draws';
const IDEMPOTENT_MODE = process.env.IDEMPOTENT_MODE !== 'false'; // default true

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════');
  console.log('   PHYCOM FIRESTORE LISTENER SERVICE');
  console.log('═══════════════════════════════════════════════════');
  console.log();
  
  // Log configuration
  logFirestoreConfig();
  console.log();
  
  // Start HTTP server
  startServer();
  console.log();
  
  // Build listener config with SSE callback
  const config: ListenerConfig = {
    projectId,
    collectionName: COLLECTION_NAME,
    idempotentMode: IDEMPOTENT_MODE,
    onDocProcessed: (docId: string, outputPath: string, outputUrl: string | undefined, data: PhycomDrawDoc) => {
      const drawItem: DrawItem = {
        id: docId,
        outputPath,
        outputUrl: outputUrl || outputPath,
        createdAt: (data as Record<string, unknown>).createdAt as number | undefined,
        updatedAt: data.updatedAt ?? undefined,
        status: (data as Record<string, unknown>).status as string | undefined,
      };
      broadcastDrawUpdate(drawItem);
    },
  };
  
  // Start the listener (runs indefinitely)
  startListener(config);
}

// Run
main().catch((error) => {
  console.error('💥 Fatal error during initialization:', error);
  process.exit(1);
});
