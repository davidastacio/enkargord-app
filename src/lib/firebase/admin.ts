import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // Support private key newline formatting from Vercel/Render envs
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const hasCredentials = !!(adminConfig.projectId && adminConfig.clientEmail && adminConfig.privateKey);

let app: any = null;

if (hasCredentials) {
  try {
    app = getApps().length === 0 
      ? initializeApp({ credential: cert(adminConfig) }) 
      : getApp();
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

// Export auth and db safely using modern modular API
const adminAuth = app ? getAuth(app) : null;
const adminDb = app ? getFirestore(app) : null;

export { adminAuth, adminDb };
