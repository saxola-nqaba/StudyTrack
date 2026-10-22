import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Module } from '../types/index';
import { deadlinesPath } from './deadlines';
import { userPath } from './user';

export const getModulesPath = () => `${userPath()}/modules`;

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

// Deadlines store a copy of the module name, so a rename must update them too
export const updateModule = async (
  moduleId: string,
  updates: Partial<Pick<Module, 'name' | 'code' | 'level'>>
): Promise<void> => {
  const batch = writeBatch(db);
  batch.update(doc(db, getModulesPath(), moduleId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });

  if (updates.name !== undefined) {
    const linked = await getDocs(
      query(collection(db, deadlinesPath()), where('moduleId', '==', moduleId))
    );
    linked.forEach((d) =>
      batch.update(d.ref, { moduleName: updates.name, updatedAt: Timestamp.now() })
    );
  }

  await batch.commit();
};

// Firestore does NOT delete sub-collections when a document is deleted,
// so remove the module's assessments, goal and deadlines explicitly.
// All in one batch — either everything is deleted or nothing is.
export const deleteModule = async (moduleId: string): Promise<void> => {
  const batch = writeBatch(db);

  const assessments = await getDocs(
    collection(db, getModulesPath(), moduleId, 'assessments')
  );
  assessments.forEach((d) => batch.delete(d.ref));

  batch.delete(doc(db, getModulesPath(), moduleId, 'goalData', 'target'));

  const linkedDeadlines = await getDocs(
    query(collection(db, deadlinesPath()), where('moduleId', '==', moduleId))
  );
  linkedDeadlines.forEach((d) => batch.delete(d.ref));

  batch.delete(doc(db, getModulesPath(), moduleId));

  await batch.commit();
};