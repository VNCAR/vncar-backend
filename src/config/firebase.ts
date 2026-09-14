import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
  try {
    const serviceAccount = JSON.parse(fileContent);
    // Only initialize if there is an actual project_id (prevent crash on placeholder)
    if (serviceAccount.project_id && serviceAccount.project_id !== 'REPLACE_WITH_YOUR_PROJECT_ID') {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized successfully.');
      }
    } else {
      console.warn('firebase-service-account.json contains placeholder values. Firebase Admin NOT initialized.');
    }
  } catch (e) {
    console.error('Failed to parse firebase-service-account.json:', e);
  }
} else {
  console.warn('firebase-service-account.json not found! Firebase Admin NOT initialized.');
}

export const firebaseAdmin = admin;
