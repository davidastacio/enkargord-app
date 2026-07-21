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
  // Support both raw multiline keys and escaped \n strings
  let privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  
  // If the key was written on windows, normalize it to match exact cert formatting
  if (!privateKey.includes('\n') && privateKey.includes(' ')) {
    // If the key is inline but was not escaped correctly, preserve begin/end blocks and replace spaces with newlines
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    if (privateKey.startsWith(header) && privateKey.endsWith(footer)) {
      const core = privateKey.substring(header.length, privateKey.length - footer.length).trim();
      privateKey = `${header}\n${core.replace(/\s+/g, '\n')}\n${footer}`;
    }
  }

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
