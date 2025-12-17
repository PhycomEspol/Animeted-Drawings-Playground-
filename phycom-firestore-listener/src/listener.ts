/**
 * Firestore Listener for phycom_draws collection
 * Listens for changes to outputPath and triggers use case
 */

import { db } from './firestore.js';
import { execute } from './usecase.js';
import type { PhycomDrawDoc, ListenerConfig } from './types.js';

const COLLECTION_NAME = 'phycom_draws';

// Cache for last-seen outputPath values (non-idempotent mode)
const outputPathCache = new Map<string, string | null>();

// Track if this is the first snapshot (to skip initial data)
let isFirstSnapshot = true;

/**
 * Start listening to the phycom_draws collection
 */
export function startListener(config: ListenerConfig): void {
  const { idempotentMode } = config;
  
  console.log('👂 Starting Firestore listener...');
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Query: where outputPath != null`);
  console.log(`   Idempotent Mode: ${idempotentMode ? 'ENABLED' : 'DISABLED'}`);
  
  // Build query for documents where outputPath is set
  const query = db
    .collection(COLLECTION_NAME)
    .where('outputPath', '!=', null);
  
  // Subscribe to real-time updates
  const unsubscribe = query.onSnapshot(
    async (snapshot) => {
      await handleSnapshot(snapshot, idempotentMode);
    },
    (error) => {
      console.error('❌ Firestore listener error:', error);
      // Exit on fatal errors (acceptable for POC)
      process.exit(1);
    }
  );
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down listener...');
    unsubscribe();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down listener...');
    unsubscribe();
    process.exit(0);
  });
  
  console.log('✅ Listener started. Waiting for changes...\n');
}

/**
 * Handle Firestore snapshot updates
 */
async function handleSnapshot(
  snapshot: FirebaseFirestore.QuerySnapshot,
  idempotentMode: boolean
): Promise<void> {
  // On first snapshot, populate cache but don't trigger
  if (isFirstSnapshot) {
    console.log(`📥 Initial snapshot: ${snapshot.size} document(s) with outputPath`);
    
    for (const doc of snapshot.docs) {
      const data = doc.data() as PhycomDrawDoc;
      outputPathCache.set(doc.id, data.outputPath ?? null);
      
      // In idempotent mode, check if any docs need processing on startup
      if (idempotentMode) {
        const needsProcessing = 
          data.outputPath != null && 
          data.outputPath !== data.outputProcessedPath;
        
        if (needsProcessing) {
          console.log(`   🔄 Document ${doc.id} needs processing (unprocessed outputPath)`);
          await processDocument(doc.id, data, idempotentMode);
        } else {
          console.log(`   ✓ Document ${doc.id} already processed`);
        }
      } else {
        console.log(`   ✓ Document ${doc.id} cached (outputPath: ${data.outputPath})`);
      }
    }
    
    isFirstSnapshot = false;
    return;
  }
  
  // Process changes
  for (const change of snapshot.docChanges()) {
    const doc = change.doc;
    const docId = doc.id;
    const data = doc.data() as PhycomDrawDoc;
    const newOutputPath = data.outputPath ?? null;
    
    if (change.type === 'added') {
      // New document with outputPath
      console.log(`📄 New document detected: ${docId}`);
      outputPathCache.set(docId, newOutputPath);
      
      if (newOutputPath) {
        await processDocument(docId, data, idempotentMode);
      }
    } else if (change.type === 'modified') {
      const oldOutputPath = outputPathCache.get(docId);
      
      // Check if outputPath actually changed
      if (oldOutputPath !== newOutputPath) {
        console.log(`📝 Document modified: ${docId}`);
        console.log(`   Old outputPath: ${oldOutputPath}`);
        console.log(`   New outputPath: ${newOutputPath}`);
        
        outputPathCache.set(docId, newOutputPath);
        
        if (newOutputPath) {
          await processDocument(docId, data, idempotentMode);
        }
      }
    } else if (change.type === 'removed') {
      console.log(`🗑️ Document removed from query: ${docId}`);
      outputPathCache.delete(docId);
    }
  }
}

/**
 * Process a document through the use case
 */
async function processDocument(
  docId: string,
  data: PhycomDrawDoc,
  idempotentMode: boolean
): Promise<void> {
  const outputPath = data.outputPath!;
  
  // In idempotent mode, check if already processed
  if (idempotentMode) {
    if (data.outputProcessedPath === outputPath) {
      console.log(`   ⏭️ Skipping ${docId}: already processed this outputPath`);
      return;
    }
  }
  
  try {
    // Execute use case (sequentially to avoid race conditions)
    await execute({
      docId,
      outputPath,
      data,
    });
    
    // In idempotent mode, mark as processed
    if (idempotentMode) {
      await db.collection(COLLECTION_NAME).doc(docId).update({
        outputProcessedPath: outputPath,
        outputProcessedAt: Date.now(),
      });
      console.log(`   📝 Marked ${docId} as processed`);
    }
  } catch (error) {
    console.error(`❌ Error processing document ${docId}:`, error);
    // Keep process alive, don't crash on individual errors
  }
}
