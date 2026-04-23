import { cert, getApps, initializeApp } from 'firebase-admin/app';

function getFirebasePrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, '\n');
}

export function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getFirebasePrivateKey();

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Fallback: ADC / env GOOGLE_APPLICATION_CREDENTIALS.
  return initializeApp();
}
