import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppIcon from '../../components/AppIcon';
import { fetchModules } from '../../services/modules';
import { fetchAssessments } from '../../services/assessments';
import { fetchGoal } from '../../services/goals';
import { fetchDeadlines } from '../../services/deadlines';
import {
  calculateWeightedAverage,
  calculateFeasibility,
  calculateRequiredScore,
  calculateRemainingWeighting,
  calculateTotalWeighting,
  calculateOverallAverage,
  FeasibilityStatus,
} from '../../utils/calculations';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { useTabPressReset } from '../../hooks/useTabPressReset';
import { Module, Assessment, Goal, Deadline } from '../../types/index';

interface ModuleData {
  module: Module;
  assessments: Assessment[];
  goal: Goal | null;
  average: number;
}

const feasibilityConfig = (status: FeasibilityStatus, colours: Palette) => {
  switch (status) {
    case 'Reached': return { color: colours.success, bg: colours.successPale };
    case 'On Track': return { color: colours.success, bg: colours.successPale };
    case 'At Risk': return { color: colours.warning, bg: colours.warningPale };
    case 'Unlikely': return { color: colours.orange, bg: colours.orangePale };
    case 'Impossible': return { color: colours.danger, bg: colours.dangerPale };
    default: return { color: colours.grey4, bg: colours.grey2 };
  }
};

const getDeadlineDate = (ts: any): Date => {
  if (ts && typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
};

export default function InsightsScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const [moduleData, setModuleData] = useState<ModuleData[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  // Spinner on first visit only; quiet refresh when you come back; pull to refresh
  const listRef = useRef<any>(null);
  const { loading, refreshing, onRefresh, refreshQuietly } = useFocusLoad(async () => {
    const modules = await fetchModules();
    const data = await Promise.all(
      modules.map(async (m) => {
        const assessments = await fetchAssessments(m.id);
        const goal = await fetchGoal(m.id);
        const average = calculateWeightedAverage(assessments);
        return { module: m, assessments, goal, average };
      })
    );
    const dl = await fetchDeadlines();
    setModuleData(data);
    setDeadlines(dl);
  }, "Couldn't load insights");

  // Tap the tab icon → back to the top (and refresh if already on this tab)
  useTabPressReset(listRef, refreshQuietly);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.accent} />
      </View>
    );
  }

  if (moduleData.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Insights" />
        <ScrollView
          ref={listRef}
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.accent} colors={[colours.accent]} />}
        >
          <AppIcon name="bulb" size={64} />
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>Add modules and assessments to see insights</Text>
        </ScrollView>
      </View>
    );
  }

  // ── Calculations ──────────────────────────────────────────
  // Only modules with marks count — null means nothing recorded yet
  const overallAverage = calculateOverallAverage(moduleData);
  const modulesWithGoals = moduleData.filter((m) => m.goal !== null);
  const goalsSet = modulesWithGoals.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueDeadlines = deadlines.filter((d) => {
    const date = getDeadlineDate(d.date);
    date.setHours(0, 0, 0, 0);
    return !d.isDone && date < today;
  });
  const upcomingDeadlines = deadlines.filter((d) => {
    const date = getDeadlineDate(d.date);
    date.setHours(0, 0, 0, 0);
    return !d.isDone && date >= today;
  }).sort((a, b) => getDeadlineDate(a.date).getTime() - getDeadlineDate(b.date).getTime());
  const completedDeadlines = deadlines.filter((d) => d.isDone);

  // Module ranking — highest to lowest; modules with no marks go to the bottom
  const ranked = [...moduleData].sort((a, b) => {
    const aHas = a.assessments.length > 0;
    const bHas = b.assessments.length > 0;
    if (aHas !== bHas) return aHas ? -1 : 1;
    return b.average - a.average;
  });

  // Focus module — the module furthest BELOW its goal.
  // Only modules that have marks and are actually behind qualify,
  // so no banner shows when every module is at or above its goal.
  const focusModule = modulesWithGoals
    .filter((m) => m.assessments.length > 0 && (m.goal?.targetPercentage ?? 0) - m.average > 0)
    .reduce<ModuleData | null>((worst, m) => {
      const gap = (m.goal?.targetPercentage ?? 0) - m.average;
      const worstGap = worst ? (worst.goal?.targetPercentage ?? 0) - worst.average : -Infinity;
      return gap > worstGap ? m : worst;
    }, null);

  // Weighting flags — modules where total weighting != 100%
  const weightingFlags = moduleData.filter((m) => {
    const total = calculateTotalWeighting(m.assessments);
    return m.assessments.length > 0 && Math.abs(total - 100) > 0.5;
  });

  const nextDeadline = upcomingDeadlines[0] ?? null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Insights" />

      <ScrollView
        ref={listRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.accent} colors={[colours.accent]} />}
      >

        {/* ── Section 1: Overall Summary ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {overallAverage !== null ? `${overallAverage.toFixed(1)}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>Overall Average</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{moduleData.length}</Text>
              <Text style={styles.statLabel}>Modules</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goalsSet}</Text>
              <Text style={styles.statLabel}>Goals Set</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, overdueDeadlines.length > 0 && { color: colours.danger }]}>
                {overdueDeadlines.length}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        {/* ── Section 2: Module Ranking ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <AppIcon name="insights" size={20} />
            <Text style={styles.sectionTitle}>Module Ranking</Text>
          </View>
          {ranked.map((item, index) => {
            const hasMarks = item.assessments.length > 0;
            const isTop = index === 0 && hasMarks;
            const avgColor = item.average >= 75
              ? colours.success
              : item.average >= 50
              ? colours.warning
              : colours.danger;

            return (
              <View key={item.module.id} style={styles.rankRow}>
                <View style={[styles.rankNum, isTop && styles.rankNumGold]}>
                  <Text style={[styles.rankNumText, isTop && { color: colours.goldText }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{item.module.name}</Text>
                  {item.module.code ? (
                    <Text style={styles.rankCode}>{item.module.code}</Text>
                  ) : null}
                </View>
                <Text style={[styles.rankAvg, { color: hasMarks ? avgColor : colours.grey4 }]}>
                  {hasMarks ? `${item.average.toFixed(1)}%` : '—'}
                </Text>
              </View>
            );
          })}

          {focusModule && (
            <View style={styles.focusStrip}>
              <Ionicons name="warning-outline" size={14} color={colours.danger} />
              <Text style={styles.focusText}>
                Focus on <Text style={{ fontWeight: '700' }}>{focusModule.module.name}</Text> — furthest from its goal
              </Text>
            </View>
          )}
        </View>

        {/* ── Section 3: Goal Summary ── */}
        {goalsSet > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
            <AppIcon name="goals" size={20} />
            <Text style={styles.sectionTitle}>Goal Summary</Text>
          </View>
            {modulesWithGoals.map((item) => {
              const feasibility = calculateFeasibility(
                item.assessments,
                item.goal?.targetPercentage ?? null
              );
              const required = calculateRequiredScore(
                item.assessments,
                item.goal?.targetPercentage ?? 0
              );
              const remaining = calculateRemainingWeighting(item.assessments);
              const { color, bg } = feasibilityConfig(feasibility, colours);

              return (
                <View key={item.module.id} style={styles.goalRow}>
                  <View style={styles.goalRowLeft}>
                    <Text style={styles.goalModuleName}>{item.module.name}</Text>
                    <Text style={styles.goalDetail}>
                      {item.average.toFixed(1)}% → {item.goal?.targetPercentage}%
                      {required !== null && remaining > 0 && required > 0
                        ? ` · Need ${required.toFixed(1)}% on remaining`
                        : ''}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: bg }]}>
                    <Text style={[styles.badgeText, { color }]}>{feasibility}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Section 4: Weighting Summary ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <AppIcon name="document" size={20} />
            <Text style={styles.sectionTitle}>Weighting Summary</Text>
          </View>
          {moduleData.map((item) => {
            const total = calculateTotalWeighting(item.assessments);
            const remaining = calculateRemainingWeighting(item.assessments);
            const isComplete = Math.abs(total - 100) <= 0.5;
            const hasAssessments = item.assessments.length > 0;

            return (
              <View key={item.module.id} style={styles.weightRow}>
                <View style={styles.weightInfo}>
                  <Text style={styles.weightName}>{item.module.name}</Text>
                  <Text style={styles.weightDetail}>
                    {hasAssessments
                      ? `${total.toFixed(0)}% entered · ${remaining.toFixed(0)}% remaining`
                      : 'No assessments yet'}
                  </Text>
                </View>
                <View style={[
                  styles.weightBadge,
                  { backgroundColor: isComplete ? colours.successPale : colours.warningPale }
                ]}>
                  <Text style={[
                    styles.weightBadgeText,
                    { color: isComplete ? colours.success : colours.warning }
                  ]}>
                    {isComplete ? '✓ Complete' : `${remaining.toFixed(0)}% left`}
                  </Text>
                </View>
              </View>
            );
          })}

          {weightingFlags.length > 0 && (
            <View style={styles.weightingAlert}>
              <Ionicons name="information-circle-outline" size={14} color={colours.warning} />
              <Text style={styles.weightingAlertText}>
                {weightingFlags.length} module{weightingFlags.length > 1 ? 's' : ''} {weightingFlags.length > 1 ? 'have' : 'has'} incomplete weighting — averages may not be accurate
              </Text>
            </View>
          )}
        </View>

        {/* ── Section 5: Deadline Summary ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <AppIcon name="deadlines" size={20} />
            <Text style={styles.sectionTitle}>Deadline Summary</Text>
          </View>

          <View style={styles.deadlineTiles}>
            <View style={[styles.deadlineTile, { backgroundColor: colours.dangerPale }]}>
              <Text style={[styles.tileCount, { color: colours.danger }]}>
                {overdueDeadlines.length}
              </Text>
              <Text style={[styles.tileLabel, { color: colours.danger }]}>Overdue</Text>
            </View>
            <View style={[styles.deadlineTile, { backgroundColor: colours.primaryPale }]}>
              <Text style={[styles.tileCount, { color: colours.accent }]}>
                {upcomingDeadlines.length}
              </Text>
              <Text style={[styles.tileLabel, { color: colours.accent }]}>Upcoming</Text>
            </View>
            <View style={[styles.deadlineTile, { backgroundColor: colours.successPale }]}>
              <Text style={[styles.tileCount, { color: colours.success }]}>
                {completedDeadlines.length}
              </Text>
              <Text style={[styles.tileLabel, { color: colours.success }]}>Done</Text>
            </View>
          </View>

          {nextDeadline && (
            <View style={styles.nextDeadline}>
              <Ionicons name="time-outline" size={14} color={colours.accent} />
              <Text style={styles.nextDeadlineText}>
                Next: <Text style={{ fontWeight: '700' }}>{nextDeadline.assessmentName}</Text>
                {' '}({nextDeadline.moduleName}) · {getDeadlineDate(nextDeadline.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          )}

          {overdueDeadlines.length > 0 && (
            <View style={styles.overdueAlert}>
              <Ionicons name="alert-circle-outline" size={14} color={colours.danger} />
              <Text style={styles.overdueAlertText}>
                {overdueDeadlines.length} overdue deadline{overdueDeadlines.length > 1 ? 's' : ''} — check the Deadlines tab
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.background },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.screenPadding },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 14, color: colours.grey4, textAlign: 'center', paddingHorizontal: 40 },
  scroll: { padding: spacing.screenPadding, paddingBottom: 16 },

  // Summary card
  summaryCard: {
    backgroundColor: colours.primary,
    borderRadius: spacing.borderRadiusLarge,
    padding: 16,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: { flex: 1, minWidth: '40%' },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colours.onPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  // Sections
  section: {
    backgroundColor: colours.card,
    borderRadius: spacing.borderRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colours.grey3,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colours.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Ranking
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colours.grey2,
  },
  rankNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colours.grey2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumGold: { backgroundColor: colours.goldBg },
  rankNumText: { fontSize: 12, fontWeight: '700', color: colours.grey5 },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: '600', color: colours.text },
  rankCode: { fontSize: 11, color: colours.grey5 },
  rankAvg: { fontSize: 14, fontWeight: '800' },
  focusStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colours.dangerPale,
    borderRadius: spacing.borderRadiusSmall,
    padding: 10,
    marginTop: 10,
  },
  focusText: { flex: 1, fontSize: 12, color: colours.danger, lineHeight: 18 },

  // Goal summary
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colours.grey2,
  },
  goalRowLeft: { flex: 1 },
  goalModuleName: { fontSize: 14, fontWeight: '600', color: colours.text },
  goalDetail: { fontSize: 11, color: colours.grey5, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Weighting
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colours.grey2,
  },
  weightInfo: { flex: 1 },
  weightName: { fontSize: 14, fontWeight: '600', color: colours.text },
  weightDetail: { fontSize: 11, color: colours.grey5, marginTop: 2 },
  weightBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  weightBadgeText: { fontSize: 11, fontWeight: '700' },
  weightingAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colours.warningPale,
    borderRadius: spacing.borderRadiusSmall,
    padding: 10,
    marginTop: 10,
  },
  weightingAlertText: { flex: 1, fontSize: 12, color: colours.warning, lineHeight: 18 },

  // Deadlines
  deadlineTiles: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  deadlineTile: {
    flex: 1,
    borderRadius: spacing.borderRadiusSmall,
    padding: 12,
    alignItems: 'center',
  },
  tileCount: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
  tileLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  nextDeadline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colours.primaryPale,
    borderRadius: spacing.borderRadiusSmall,
    padding: 10,
    marginBottom: 8,
  },
  nextDeadlineText: { flex: 1, fontSize: 12, color: colours.accent, lineHeight: 18 },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colours.dangerPale,
    borderRadius: spacing.borderRadiusSmall,
    padding: 10,
  },
  overdueAlertText: { flex: 1, fontSize: 12, color: colours.danger, lineHeight: 18 },
});