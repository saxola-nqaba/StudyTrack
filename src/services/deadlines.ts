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
import { Deadline } from '../types/index';
import { userPath } from './user';

export const deadlinesPath = () => `${userPath()}/deadlines`;

export const fetchDeadlines = async (): Promise<Deadline[]> => {
  const snap = await getDocs(collection(db, deadlinesPath()));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Deadline));
};

export const addDeadline = async (
  moduleId: string,
  moduleName: string,
  assessmentName: string,
  date: Date
): Promise<string> => {
  const ref = await addDoc(collection(db, deadlinesPath()), {
    moduleId,
    assessmentId: '',
    moduleName,
    assessmentName,
    date: Timestamp.fromDate(date),
    reminderDate: null,
    isDone: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
};

export const toggleDeadlineDone = async (
  deadlineId: string,
  isDone: boolean
): Promise<void> => {
  await updateDoc(doc(db, deadlinesPath(), deadlineId), {
    isDone,
    updatedAt: Timestamp.now(),
  });
};

export const deleteDeadline = async (deadlineId: string): Promise<void> => {
  await deleteDoc(doc(db, deadlinesPath(), deadlineId));
};

export const updateDeadline = async (
  deadlineId: string,
  moduleName: string,
  assessmentName: string,
  date: Date
): Promise<void> => {
  await updateDoc(doc(db, deadlinesPath(), deadlineId), {
    moduleName,
    assessmentName,
    date: Timestamp.fromDate(date),
    updatedAt: Timestamp.now(),
  });
};