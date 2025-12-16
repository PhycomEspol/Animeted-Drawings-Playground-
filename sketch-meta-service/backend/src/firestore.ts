import * as admin from 'firebase-admin';

// POC: Force usage of local emulator
// This prevents the SDK from looking for Google Cloud credentials
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'meta-automation-poc'
  });
}

export const db = admin.firestore();
