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
import { Module } from '../types/index';

const TEMP_USER_ID = 'temp-user-123';

export const getModulesPath = () =>
  `users/${TEMP_USER_ID}/modules`;

export const fetchModules = async (): Promise<Module[]> => {
  const snap = await getDocs(collection(db, getModulesPath()));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Module));
};

export const addModule = async (
  name: string,
  code: string,
  level: string
): Promise<string> => {
  const ref = await addDoc(collection(db, getModulesPath()), {
    name,
    code,
    level,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
};

export const updateModule = async (
  moduleId: string,
  updates: Partial<Pick<Module, 'name' | 'code' | 'level'>>
): Promise<void> => {
  await updateDoc(doc(db, getModulesPath(), moduleId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteModule = async (moduleId: string): Promise<void> => {
  await deleteDoc(doc(db, getModulesPath(), moduleId));
};