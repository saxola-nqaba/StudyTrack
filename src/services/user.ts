import { auth } from './firebaseAuth';

// ─────────────────────────────────────────────────────────────
// The ONE place that decides whose data we read and write.
//
// Every Firestore path starts with users/{uid} of the signed-in
// user, and the security rules only allow that user in.
// ─────────────────────────────────────────────────────────────

export const getUserId = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    // Picked up by utils/errors → "Your session has expired. Please sign in again."
    throw Object.assign(new Error('Not signed in'), { code: 'unauthenticated' });
  }
  return uid;
};

export const userPath = (): string => `users/${getUserId()}`;
