import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from './firebaseAuth';

// Create the account, then the user's profile document at users/{uid}.
export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  username: string,
  academicLevel: string
): Promise<User> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // Name shown by Firebase (e.g. in the console) — not critical if it fails
  updateProfile(user, { displayName: fullName }).catch(() => {});

  await setDoc(doc(db, 'users', user.uid), {
    fullName,
    username,
    email,
    academicLevel,
    darkMode: false,
    notifications: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return user;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

// Firebase only sends the email if an account exists, but never says
// whether it does — so the app shows the same message either way.
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const currentUserEmail = (): string => auth.currentUser?.email ?? '';
