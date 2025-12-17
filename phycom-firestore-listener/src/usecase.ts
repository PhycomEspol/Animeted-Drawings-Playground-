/**
 * Use Case module for processing phycom_draws documents
 */

import { db } from './firestore.js';
import type { UseCaseParams, PhycomDrawDoc } from './types.js';

const COLLECTION_NAME = 'phycom_draws';

/**
 * Execute the use case when outputPath changes
 * For POC: logs processing and simulates an API call
 */
export async function execute(params: UseCaseParams): Promise<void> {
  const { docId, outputPath, data } = params;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 USE CASE TRIGGERED');
  console.log(`   Document ID: ${docId}`);
  console.log(`   Output Path: ${outputPath}`);
  console.log(`   Document Data:`, JSON.stringify(data, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Simulate async API call (e.g., triggering an animation render)
  await simulateApiCall(docId, outputPath);
  
  console.log(`✅ Use case completed for document: ${docId}`);
}

/**
 * Get all documents from the phycom_draws collection
 */
export async function getAll(): Promise<Array<{ id: string; data: PhycomDrawDoc }>> {
  console.log('📋 Fetching all documents from phycom_draws...');
  
  const snapshot = await db.collection(COLLECTION_NAME).get();
  
  const documents = snapshot.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as PhycomDrawDoc,
  }));
  
  console.log(`📋 Found ${documents.length} document(s) in phycom_draws`);
  
  return documents;
}

/**
 * Simulate an external API call (stubbed for POC)
 */
async function simulateApiCall(docId: string, outputPath: string): Promise<void> {
  console.log(`   📡 Simulating API call for ${docId}...`);
  
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  console.log(`   📡 API call completed (simulated)`);
}
