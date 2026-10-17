export interface Assessment {
  id: string;
  name: string;
  mark: number;
  outOf: number;
  weighting: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  name: string;
  code: string;
  level: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  targetPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deadline {
  id: string;
  moduleId: string;
  assessmentId: string;
  moduleName: string;
  assessmentName: string;
  date: Date;
  reminderDate: Date | null;
  isDone: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  academicLevel: string;
  darkMode: boolean;
  notifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}