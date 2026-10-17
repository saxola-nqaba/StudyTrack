import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Goal } from '../types/index';
import { getModulesPath } from './modules';

export const fetchGoal = async (moduleId: string): Promise<Goal | null> => {
  const ref = doc(db, getModulesPath(), moduleId, 'goalData', 'target');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Goal;
};

export const setGoal = async (
  moduleId: string,
  targetPercentage: number
): Promise<void> => {
  const ref = doc(db, getModulesPath(), moduleId, 'goalData', 'target');
  await setDoc(ref, {
    targetPercentage,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const deleteGoal = async (moduleId: string): Promise<void> => {
  const ref = doc(db, getModulesPath(), moduleId, 'goalData', 'target');
  await deleteDoc(ref);
};