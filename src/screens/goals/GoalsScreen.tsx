import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text } from '../../components/AppText';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AppIcon from '../../components/AppIcon';
import { GoalsStackParamList } from '../../navigation/GoalsNavigator';
import { fetchModules } from '../../services/modules';
import { fetchAssessments } from '../../services/assessments';
import { fetchGoal } from '../../services/goals';
import {
  calculateWeightedAverage,
  calculateFeasibility,
  calculateRequiredScore,
  calculateRemainingWeighting,
  calculateOverallAverage,
  meetsTarget,
  FeasibilityStatus,
} from '../../utils/calculations';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { useTabPressReset } from '../../hooks/useTabPressReset';
import { Module, Assessment, Goal } from '../../types/index';

type Nav = StackNavigationProp<GoalsStackParamList, 'GoalsList'>;

interface ModuleGoalData {
  module: Module;
  assessments: Assessment[];
  goal: Goal | null;
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

export default function GoalsScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<ModuleGoalData[]>([]);

  // Spinner on first visit only; quiet refresh when you come back; pull to refresh
  const listRef = useRef<any>(null);
  const { loading, refreshing, onRefresh, refreshQuietly } = useFocusLoad(async () => {
    const modules = await fetchModules();
    const result = await Promise.all(
      modules.map(async (m) => {
        const assessments = await fetchAssessments(m.id);
        const goal = await fetchGoal(m.id);
        return { module: m, assessments, goal };
      })
    );
    setData(result);
  }, "Couldn't load goals");

  // Tap the tab icon → back to the top (and refresh if already on this tab)
  useTabPressReset(listRef, refreshQuietly);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.accent} />
      </View>
    );
  }

  // Only modules with marks count — null means nothing recorded yet
  const overallAverage = calculateOverallAverage(data);

  const modulesWithGoals = data.filter((item) => item.goal !== null);
  // Compare like with like: once some modules have marks, the average goal
  // only includes those modules (unstarted ones can't be "below" yet)
  const goalPool = modulesWithGoals.some((m) => m.assessments.length > 0)
    ? modulesWithGoals.filter((m) => m.assessments.length > 0)
    : modulesWithGoals;
  const avgGoal = goalPool.length > 0
    ? goalPool.reduce((sum, item) => sum + (item.goal?.targetPercentage ?? 0), 0) / goalPool.length
    : null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Goals" />

      {avgGoal !== null && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Overall Average</Text>
            <Text style={styles.summaryValue}>
              {overallAverage !== null ? `${overallAverage.toFixed(1)}%` : '—'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg Goal</Text>
            <Text style={styles.summaryValue}>{avgGoal.toFixed(1)}%</Text>
          </View>
          {overallAverage !== null && (
            <View style={styles.summaryStatus}>
              <Text style={[
                styles.summaryStatusText,
                { color: meetsTarget(overallAverage, avgGoal) ? colours.success : colours.warning }
              ]}>
                {meetsTarget(overallAverage, avgGoal) ? '↑ On track' : '↓ Below'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Fixed goals count — sits under the strip and does not scroll */}
      {data.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countLabel}>
            {modulesWithGoals.length === 0
              ? 'No goals set'
              : `${modulesWithGoals.length} goal${modulesWithGoals.length !== 1 ? 's' : ''} set`}
            <Text style={styles.countOf}>
              {modulesWithGoals.length === 0
                ? ' · tap a module to add one'
                : ` · ${data.length} module${data.length !== 1 ? 's' : ''}`}
            </Text>
          </Text>
        </View>
      )}

      {/* Scrollable list — only the cards move */}
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => item.module.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.accent} colors={[colours.accent]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="trophy" size={64} />
            <Text style={styles.emptyTitle}>No modules yet</Text>
            <Text style={styles.emptyText}>Add modules in the Marks tab first</Text>
          </View>
        }
        renderItem={({ item }) => {
          const avg = calculateWeightedAverage(item.assessments);
          const feasibility = calculateFeasibility(
            item.assessments,
            item.goal?.targetPercentage ?? null
          );
          const required = item.goal
            ? calculateRequiredScore(item.assessments, item.goal.targetPercentage)
            : null;
          const remaining = calculateRemainingWeighting(item.assessments);
          const { color, bg } = feasibilityConfig(feasibility, colours);
          const progress = item.goal
            ? Math.min((avg / item.goal.targetPercentage) * 100, 100)
            : 0;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('EditGoal', {
                  moduleId: item.module.id,
                  moduleName: item.module.name,
                })
              }
            >
              <View style={styles.cardTop}>
                <Text style={styles.moduleName}>{item.module.name}</Text>
                <View style={[styles.badge, { backgroundColor: bg }]}>
                  <Text style={[styles.badgeText, { color }]}>{feasibility}</Text>
                </View>
              </View>

              <View style={styles.pctRow}>
                <Text style={styles.pctLabel}>
                  Current: <Text style={styles.pctValue}>
                    {item.assessments.length > 0 ? `${avg.toFixed(1)}%` : '—'}
                  </Text>
                </Text>
                {item.goal && (
                  <Text style={styles.pctLabel}>
                    Goal: <Text style={styles.pctValue}>{item.goal.targetPercentage}%</Text>
                  </Text>
                )}
              </View>

              {item.goal && (
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: color }]} />
                </View>
              )}

              {item.goal && feasibility === 'Reached' ? (
                <View style={styles.reachedRow}>
                  <AppIcon name="trophy" size={16} />
                  <Text style={[styles.noteText, styles.reachedText]}>
                    {remaining <= 0
                      ? 'Goal achieved!'
                      : `Goal secured · ${remaining.toFixed(0)}% weighting left`}
                  </Text>
                </View>
              ) : item.goal ? (
                <Text style={styles.noteText}>
                  {feasibility === 'Not Started'
                    ? `No marks yet · aim for ${item.goal.targetPercentage}% across your assessments`
                    : required !== null && remaining > 0
                    ? `Need ${required.toFixed(1)}% on remaining · ${remaining.toFixed(0)}% weighting left`
                    : 'All weighting complete, finished below goal'}
                </Text>
              ) : (
                <Text style={[styles.noteText, { color: colours.accent }]}>
                  Tap to set a goal →
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.background },
  // No + button on Goals, so only a small gap above the tab bar
  countBar: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: colours.background,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colours.grey5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  countOf: { fontWeight: '500', color: colours.grey4 },
  list: { paddingHorizontal: spacing.screenPadding, paddingTop: 2, paddingBottom: 16 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 14, color: colours.grey4 },
  card: {
    backgroundColor: colours.card,
    borderRadius: spacing.borderRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colours.grey3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moduleName: { fontSize: 15, fontWeight: '700', color: colours.text, flex: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  pctRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  pctLabel: { fontSize: 13, color: colours.grey5 },
  pctValue: { fontWeight: '700', color: colours.text },
  barTrack: {
    height: 6,
    backgroundColor: colours.grey2,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: { height: '100%', borderRadius: 3 },
  noteText: { fontSize: 12, color: colours.grey5, marginTop: 2 },
  reachedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  reachedText: { marginTop: 0, color: colours.success, fontWeight: '600' },

    summaryStrip: {
    backgroundColor: colours.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 20,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colours.onPrimary,
    letterSpacing: -1,
  },
  summaryItem: { flex: 1 },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  summaryStatus: { alignItems: 'flex-end' },
  summaryStatusText: { fontSize: 14, fontWeight: '700' },
});