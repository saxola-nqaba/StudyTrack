export interface Assessment {
  id: string;
  name: string;
  mark: number;
  outOf: number;
  weighting: number;
  createdAt: { toMillis: () => number } | Date;
  updatedAt: { toMillis: () => number } | Date;
}

export interface Module {
  id: string;
  name: string;
  code: string;
  level: string;
  createdAt: { toMillis: () => number } | Date;
  updatedAt: { toMillis: () => number } | Date;
}

export interface Goal {
  targetPercentage: number;
  createdAt: { toMillis: () => number } | Date;
  updatedAt: { toMillis: () => number } | Date;
}

export interface Deadline {
  id: string;
  moduleId: string;
  assessmentId: string;
  moduleName: string;
  assessmentName: string;
  date: { toMillis: () => number } | Date;
  reminderDate: { toMillis: () => number } | Date | null;
  isDone: boolean;
  createdAt: { toMillis: () => number } | Date;
  updatedAt: { toMillis: () => number } | Date;
}

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  academicLevel: string;
  darkMode: boolean;
  notifications: boolean;
  createdAt: { toMillis: () => number } | Date;
  updatedAt: { toMillis: () => number } | Date;
}