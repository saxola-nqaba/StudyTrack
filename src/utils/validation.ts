import { buildValidDate } from './dates';

// ─────────────────────────────────────────────────────────────
// Form validation — one place for every rule, so Add and Edit
// screens can never disagree. Each validator returns an object of
// field → message. An empty object means the form is valid.
// ─────────────────────────────────────────────────────────────

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;

// Stricter than parseFloat: "12abc" or "" → null instead of 12 / NaN.
// Accepts a comma as decimal separator (common on SA keyboards).
export const parseNumber = (value: string): number | null => {
  const v = value.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(v)) return null;
  return Number(v);
};

// ── MODULE ────────────────────────────────────────────────────
export const validateModule = (name: string): FieldErrors<'name'> => {
  const errors: FieldErrors<'name'> = {};
  if (!name.trim()) errors.name = 'Module name is required';
  return errors;
};

// ── ASSESSMENT ────────────────────────────────────────────────
export type AssessmentField = 'name' | 'mark' | 'outOf' | 'weighting';

export const validateAssessment = (
  values: { name: string; mark: string; outOf: string; weighting: string },
  otherWeightingTotal: number // weighting already used by the module's OTHER assessments
): FieldErrors<AssessmentField> => {
  const errors: FieldErrors<AssessmentField> = {};
  const mark = parseNumber(values.mark);
  const outOf = parseNumber(values.outOf);
  const weighting = parseNumber(values.weighting);
  const available = Math.max(0, 100 - otherWeightingTotal);

  if (!values.name.trim()) errors.name = 'Assessment name is required';

  if (outOf === null) errors.outOf = 'Enter a number';
  else if (outOf <= 0) errors.outOf = 'Must be more than 0';

  if (mark === null) errors.mark = 'Enter a number';
  else if (mark < 0) errors.mark = 'Cannot be negative';
  else if (outOf !== null && outOf > 0 && mark > outOf) errors.mark = `Cannot be more than ${outOf}`;

  if (weighting === null) errors.weighting = 'Enter a number';
  else if (weighting <= 0 || weighting > 100) errors.weighting = 'Must be between 1 and 100';
  else if (weighting > available) {
    errors.weighting = available > 0
      ? `Only ${available.toFixed(0)}% weighting left in this module`
      : 'This module already has 100% weighting';
  }

  return errors;
};

// ── GOAL ──────────────────────────────────────────────────────
export const validateGoal = (target: string): FieldErrors<'target'> => {
  const errors: FieldErrors<'target'> = {};
  const t = parseNumber(target);
  if (t === null) errors.target = 'Enter a number';
  else if (t <= 0 || t > 100) errors.target = 'Must be between 1 and 100';
  return errors;
};

// ── PROFILE ───────────────────────────────────────────────────
export type ProfileField = 'fullName' | 'email';

export const validateProfile = (fullName: string, email: string): FieldErrors<ProfileField> => {
  const errors: FieldErrors<ProfileField> = {};
  if (!fullName.trim()) errors.fullName = 'Full name is required';
  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email, e.g. you@email.com';
  }
  return errors;
};

// ── DEADLINE ──────────────────────────────────────────────────
export type DeadlineField = 'module' | 'name' | 'date';

export const validateDeadline = (
  hasModule: boolean,
  assessmentName: string,
  day: string,
  month: string,
  year: string
): FieldErrors<DeadlineField> => {
  const errors: FieldErrors<DeadlineField> = {};
  if (!hasModule) errors.module = 'Select a module';
  if (!assessmentName.trim()) errors.name = 'Assessment name is required';
  if (!buildValidDate(day, month, year)) errors.date = 'Enter a real date, e.g. 28 / 02 / 2027';
  return errors;
};

// ── AUTH ──────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginField = 'email' | 'password';

export const validateLogin = (email: string, password: string): FieldErrors<LoginField> => {
  const errors: FieldErrors<LoginField> = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email, e.g. you@email.com';
  if (!password) errors.password = 'Password is required';
  return errors;
};

export type RegisterField = 'fullName' | 'email' | 'password' | 'confirm';

export const validateRegister = (
  fullName: string,
  email: string,
  password: string,
  confirm: string
): FieldErrors<RegisterField> => {
  const errors: FieldErrors<RegisterField> = {};
  if (!fullName.trim()) errors.fullName = 'Full name is required';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email, e.g. you@email.com';
  if (password.length < 6) errors.password = 'At least 6 characters';
  if (!confirm) errors.confirm = 'Re-enter your password';
  else if (confirm !== password) errors.confirm = "Passwords don't match";
  return errors;
};

export const validateEmailOnly = (email: string): FieldErrors<'email'> => {
  const errors: FieldErrors<'email'> = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email, e.g. you@email.com';
  return errors;
};
