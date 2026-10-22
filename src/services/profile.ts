import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile } from '../types/index';
import { userPath } from './user';

const profilePath = () => userPath();

export const fetchProfile = async (): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, profilePath()));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
};

export const saveProfile = async (
  updates: Partial<UserProfile>
): Promise<void> => {
  await setDoc(doc(db, profilePath()), {
    ...updates,
    updatedAt: Timestamp.now(),
  }, { merge: true });
};

export const createProfile = async (
  fullName: string,
  username: string,
  email: string,
  academicLevel: string
): Promise<void> => {
  await setDoc(doc(db, profilePath()), {
    fullName,
    username,
    email,
    academicLevel,
    darkMode: false,
    notifications: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};