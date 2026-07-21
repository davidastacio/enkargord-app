import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getFirebaseAdminApp() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('FIREBASE_ADMIN_ENV_MISSING');
  }

  // Handle newlines securely
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

// Keep legacy exports for backward compatibility, wrapped safely so they don't break at import time
export const adminAuth = typeof window === 'undefined' ? (() => {
  try {
    return getAdminAuth();
  } catch (e) {
    return null;
  }
})() : null;

export const adminDb = typeof window === 'undefined' ? (() => {
  try {
    return getAdminDb();
  } catch (e) {
    return null;
  }
})() : null;
