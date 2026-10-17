import { Assessment } from '../types/index';

// ── WEIGHTED AVERAGE ──────────────────────────────────────────
// Calculates the current weighted average for a module
// Only includes assessments that have all three values
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
// Returns the score needed on remaining assessments to hit the target
// Returns null if there is no remaining weighting
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

  const required =
    ((targetPercentage * 100) - currentWeightedScore) / remainingWeighting;

  return required;
};

// ── GOAL FEASIBILITY ──────────────────────────────────────────
export type FeasibilityStatus =
  | 'Reached'
  | 'On Track'
  | 'At Risk'
  | 'Unlikely'
  | 'Impossible'
  | 'No Goal';

export const calculateFeasibility = (
  assessments: Assessment[],
  targetPercentage: number | null
): FeasibilityStatus => {
  if (targetPercentage === null) return 'No Goal';

  const current = calculateWeightedAverage(assessments);
  if (current >= targetPercentage) return 'Reached';

  const required = calculateRequiredScore(assessments, targetPercentage);
  if (required === null) return 'Impossible';

  if (required > 100) return 'Impossible';
  if (required > 85) return 'Unlikely';
  if (required > 70) return 'At Risk';
  return 'On Track';
};

// ── DIRECTION INDICATOR ───────────────────────────────────────
export type Direction = 'up' | 'down' | 'stable';

export const calculateDirection = (assessments: Assessment[]): Direction => {
  if (!assessments || assessments.length < 2) return 'stable';

  // Sort by createdAt so we know which is most recent
const sorted = [...assessments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const mostRecent = sorted[sorted.length - 1];
  const without = sorted.slice(0, sorted.length - 1);

  const averageWith = calculateWeightedAverage(sorted);
  const averageWithout = calculateWeightedAverage(without);

  if (averageWith > averageWithout + 1) return 'up';
  if (averageWith < averageWithout - 1) return 'down';
  return 'stable';
};

// ── OVERALL AVERAGE ───────────────────────────────────────────
// Average across all modules (average of averages)
export const calculateOverallAverage = (moduleAverages: number[]): number => {
  if (!moduleAverages || moduleAverages.length === 0) return 0;
  const sum = moduleAverages.reduce((acc, avg) => acc + avg, 0);
  return sum / moduleAverages.length;
};