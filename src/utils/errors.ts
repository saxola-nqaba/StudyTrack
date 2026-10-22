import { Alert } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Turns technical Firebase errors into messages a student can act on.
//
//   showError("Couldn't save module", e)
//   → title:   Couldn't save module
//   → message: You seem to be offline. Check your connection and try again.
// ─────────────────────────────────────────────────────────────

const MESSAGES: Record<string, string> = {
  unavailable: "You seem to be offline. Check your internet connection and try again.",
  'deadline-exceeded': 'The connection is too slow right now. Please try again in a moment.',
  'permission-denied': "You don't have permission to do that. Try signing out and back in.",
  unauthenticated: 'Your session has expired. Please sign in again.',
  'not-found': 'This item no longer exists. It may have been deleted.',
  'resource-exhausted': 'Too many requests right now. Wait a moment and try again.',
  aborted: 'Something else changed this at the same time. Please try again.',
  cancelled: 'The request was cancelled. Please try again.',
  // Firebase Auth (used in Phase 10)
  'auth/network-request-failed': "You seem to be offline. Check your internet connection and try again.",
  'auth/invalid-credential': 'That email and password combination is incorrect.',
  'auth/wrong-password': 'That email and password combination is incorrect.',
  'auth/user-not-found': 'No account exists with that email.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Choose a stronger password: at least 6 characters.',
  'auth/invalid-email': "That email address doesn't look right.",
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
};

const FALLBACK = 'Something went wrong. Please try again.';

export const friendlyMessage = (error: unknown): string => {
  const err = error as { code?: string; message?: string } | null;
  const code = err?.code?.replace(/^firestore\//, '');
  if (code && MESSAGES[code]) return MESSAGES[code];
  // Firestore sometimes reports offline only in the message text
  if (err?.message && /offline/i.test(err.message)) return MESSAGES.unavailable;
  return FALLBACK;
};

export const showError = (title: string, error: unknown) => {
  if (__DEV__) console.warn(`[StudyTrack] ${title}:`, error); // full details in the Metro log only
  Alert.alert(title, friendlyMessage(error));
};
