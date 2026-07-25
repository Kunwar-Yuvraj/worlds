import 'server-only';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!getApps().length) {
  initializeApp(serviceAccount
    ? { credential: cert(JSON.parse(serviceAccount)) }
    : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}
export const db = getFirestore();
