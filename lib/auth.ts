import 'server-only';
import '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
export async function requireUser(request: Request) {
  const token =
    request.headers.get('x-firebase-auth') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Error('Sign in anonymously before making a request.');
  }

  return (await getAuth().verifyIdToken(token)).uid;
}
