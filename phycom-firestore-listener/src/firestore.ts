/**
 * Firestore initialization for the listener service
 * Connects to Firestore Emulator only (no cloud credentials required)
 */

import admin from 'firebase-admin';

// Get project ID from environment or use default
const projectId = process.env.GCLOUD_PROJECT || 'meta-automation-poc';

// Check if already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
  });
}

// Export Firestore instance
export const db = admin.firestore();

// Export project ID for logging
export { projectId };

/**
 * Log Firestore configuration on startup
 */
export function logFirestoreConfig(): void {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || 'not set';
  
  console.log('🔥 Firestore Configuration:');
  console.log(`   Project ID: ${projectId}`);
  console.log(`   Emulator Host: ${emulatorHost}`);
  
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn('⚠️  FIRESTORE_EMULATOR_HOST not set. Make sure the emulator is running!');
  }
}
