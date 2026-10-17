import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Assessment } from '../types/index';
import { getModulesPath } from './modules';

export const fetchAssessments = async (
  moduleId: string
): Promise<Assessment[]> => {
  const path = `${getModulesPath()}/${moduleId}/assessments`;
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assessment));
};

export const addAssessment = async (
  moduleId: string,
  name: string,
  mark: number,
  outOf: number,
  weighting: number
): Promise<string> => {
  const path = `${getModulesPath()}/${moduleId}/assessments`;
  const ref = await addDoc(collection(db, path), {
    name,
    mark,
    outOf,
    weighting,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
};

export const updateAssessment = async (
  moduleId: string,
  assessmentId: string,
  updates: Partial<Pick<Assessment, 'name' | 'mark' | 'outOf' | 'weighting'>>
): Promise<void> => {
  const path = `${getModulesPath()}/${moduleId}/assessments/${assessmentId}`;
  await updateDoc(doc(db, path), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteAssessment = async (
  moduleId: string,
  assessmentId: string
): Promise<void> => {
  const path = `${getModulesPath()}/${moduleId}/assessments/${assessmentId}`;
  await deleteDoc(doc(db, path));
};