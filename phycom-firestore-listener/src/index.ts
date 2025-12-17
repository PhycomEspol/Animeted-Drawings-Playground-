/**
 * Phycom Firestore Listener Service
 * Entry point - loads environment and starts the listener
 */

import 'dotenv/config';
import { logFirestoreConfig, projectId } from './firestore.js';
import { startListener } from './listener.js';
import type { ListenerConfig } from './types.js';

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
  
  // Build listener config
  const config: ListenerConfig = {
    projectId,
    collectionName: COLLECTION_NAME,
    idempotentMode: IDEMPOTENT_MODE,
  };
  
  // Start the listener (runs indefinitely)
  startListener(config);
}

// Run
main().catch((error) => {
  console.error('💥 Fatal error during initialization:', error);
  process.exit(1);
});
