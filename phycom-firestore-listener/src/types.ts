/**
 * Type definitions for the Firestore Listener Service
 */

/**
 * Document structure for the phycom_draws collection
 */
export interface PhycomDrawDoc {
  /** Path to the output file (triggers use case when changed) */
  outputPath?: string | null;
  
  /** Path that was last processed (for idempotency) */
  outputProcessedPath?: string | null;
  
  /** Timestamp when the output was processed */
  outputProcessedAt?: number | null;
  
  /** Last update timestamp */
  updatedAt?: number | null;
  
  /** Allow additional fields */
  [key: string]: unknown;
}

/**
 * Parameters for the use case execute function
 */
export interface UseCaseParams {
  /** Firestore document ID */
  docId: string;
  
  /** The outputPath value that triggered this execution */
  outputPath: string;
  
  /** Full document data */
  data: PhycomDrawDoc;
}

/**
 * Configuration for the listener service
 */
export interface ListenerConfig {
  /** Firestore project ID */
  projectId: string;
  
  /** Collection to listen to */
  collectionName: string;
  
  /** Whether to use idempotent mode */
  idempotentMode: boolean;
}
