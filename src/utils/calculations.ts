import { Assessment } from '../types/index';

// ── WEIGHTED AVERAGE ──────────────────────────────────────────
export const calculateWeightedAverage = (assessments: Assessment[]): number => {
  if (!assessments || assessments.length === 0) return 0;

  let weightedSum = 0;
  let totalWeighting = 0;

  assessments.forEach((a) => {
    if (a.mark !== null && a.outOf > 0 && a.weighting > 0) {
      weightedSum += (a.mark / a.outOf) * a.weighting;
      totalWeighting += a.weighting;
    }
  });

  if (totalWeighting === 0) return 0;
  return (weightedSum / totalWeighting) * 100;
};

// ── TOTAL WEIGHTING ENTERED ───────────────────────────────────
export const calculateTotalWeighting = (assessments: Assessment[]): number => {
  return assessments.reduce((sum, a) => sum + (a.weighting || 0), 0);
};

// ── REMAINING WEIGHTING ───────────────────────────────────────
export const calculateRemainingWeighting = (assessments: Assessment[]): number => {
  const total = calculateTotalWeighting(assessments);
  return Math.max(0, 100 - total);
};

// ── REQUIRED SCORE TO REACH GOAL ─────────────────────────────
export const calculateRequiredScore = (
  assessments: Assessment[],
  targetPercentage: number
): number | null => {
  const remainingWeighting = calculateRemainingWeighting(assessments);
  if (remainingWeighting <= 0) return null;

  let currentWeightedScore = 0;
  assessments.forEach((a) => {
    if (a.mark !== null && a.outOf > 0 && a.weighting > 0) {
      currentWeightedScore += (a.mark / a.outOf) * a.weighting;
    }
  });

  // required = score needed on remaining assessments as a percentage
  // targetPercentage = currentWeightedScore + (required/100 * remainingWeighting)
  // solving for required:
  const required = ((targetPercentage - currentWeightedScore) / remainingWeighting) * 100;
  return required;
};

// ── GOAL FEASIBILITY ──────────────────────────────────────────
export type FeasibilityStatus =
  | 'Reached'
  | 'On Track'
  | 'At Risk'
  | 'Unlikely'
  | 'Impossible'
  | 'Not Started'
  | 'No Goal';

export const calculateFeasibility = (
  assessments: Assessment[],
  targetPercentage: number | null
): FeasibilityStatus => {
  if (targetPercentage === null) return 'No Goal';

  // No marks yet: nothing to judge, so no On Track / At Risk badge
  const marked = assessments.filter((a) => a.outOf > 0 && a.weighting > 0);
  if (marked.length === 0) return 'Not Started';

  const current = calculateWeightedAverage(assessments);
  const remaining = calculateRemainingWeighting(assessments);

  if (remaining <= 0) {
    return current >= targetPercentage ? 'Reached' : 'Impossible';
  }

  const required = calculateRequiredScore(assessments, targetPercentage);
  if (required === null) return 'Impossible';

  // Marks already banked guarantee the target, even with 0% on the rest
  if (required <= 0) return 'Reached';
  if (required > 100) return 'Impossible';
  if (required > 90) return 'Unlikely';
  if (required > 80) return 'At Risk';
  return 'On Track';
};

// ── DIRECTION INDICATOR ───────────────────────────────────────
export type Direction = 'up' | 'down' | 'stable';

export const calculateDirection = (assessments: Assessment[]): Direction => {
  if (!assessments || assessments.length < 2) return 'stable';

  const getTime = (a: Assessment): number => {
    const ts = a.createdAt;
    if (ts && typeof (ts as any).toMillis === 'function') {
      return (ts as any).toMillis();
    }
    if (ts instanceof Date) return ts.getTime();
    return 0;
  };

  const sorted = [...assessments].sort((a, b) => getTime(a) - getTime(b));
  const withoutLast = sorted.slice(0, sorted.length - 1);

  const averageWith = calculateWeightedAverage(sorted);
  const averageWithout = calculateWeightedAverage(withoutLast);

  if (averageWith > averageWithout + 1) return 'up';
  if (averageWith < averageWithout - 1) return 'down';
  return 'stable';
};

// ── OVERALL AVERAGE ───────────────────────────────────────────
// Mean of module averages, counting ONLY modules that have marks.
// A new module with no assessments is not "0%" — it's just not started.
// Returns null when no module has any marks yet.
export const calculateOverallAverage = (
  modules: { assessments: Assessment[] }[]
): number | null => {
  const withMarks = modules.filter((m) => m.assessments && m.assessments.length > 0);
  if (withMarks.length === 0) return null;
  const sum = withMarks.reduce((acc, m) => acc + calculateWeightedAverage(m.assessments), 0);
  return sum / withMarks.length;
};
// ── COMPARE AGAINST A TARGET (as displayed) ───────────────────
// Compare at the 1 decimal place the user actually sees, so
// "74.3% vs 74.3%" never shows as "Below" because the hidden
// values were 74.27 and 74.33.
export const meetsTarget = (value: number, target: number): boolean =>
  Math.round(value * 10) >= Math.round(target * 10);
