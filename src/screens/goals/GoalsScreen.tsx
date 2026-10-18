import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GoalsStackParamList } from '../../navigation/GoalsNavigator';
import { fetchModules } from '../../services/modules';
import { fetchAssessments } from '../../services/assessments';
import { fetchGoal } from '../../services/goals';
import {
  calculateWeightedAverage,
  calculateFeasibility,
  calculateRequiredScore,
  calculateRemainingWeighting,
  FeasibilityStatus,
} from '../../utils/calculations';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { Module, Assessment, Goal } from '../../types/index';

type Nav = NativeStackNavigationProp<GoalsStackParamList, 'GoalsList'>;

interface ModuleGoalData {
  module: Module;
  assessments: Assessment[];
  goal: Goal | null;
}

const feasibilityConfig = (status: FeasibilityStatus) => {
  switch (status) {
    case 'Reached': return { color: colours.success, bg: colours.successPale };
    case 'On Track': return { color: colours.success, bg: colours.successPale };
    case 'At Risk': return { color: colours.warning, bg: colours.warningPale };
    case 'Unlikely': return { color: colours.orange, bg: '#FDEBD0' };
    case 'Impossible': return { color: colours.danger, bg: colours.dangerPale };
    default: return { color: colours.grey4, bg: colours.grey2 };
  }
};

export default function GoalsScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<ModuleGoalData[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const modules = await fetchModules();
          const result = await Promise.all(
            modules.map(async (m) => {
              const assessments = await fetchAssessments(m.id);
              const goal = await fetchGoal(m.id);
              return { module: m, assessments, goal };
            })
          );
          setData(result);
        } catch (e) {
          Alert.alert('Error', 'Failed to load goals.');
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.primary} />
      </View>
    );
  }

    const overallAverage = data.length > 0
    ? data.reduce((sum, item) => sum + calculateWeightedAverage(item.assessments), 0) / data.length
    : 0;

  const modulesWithGoals = data.filter((item) => item.goal !== null);
  const avgGoal = modulesWithGoals.length > 0
    ? modulesWithGoals.reduce((sum, item) => sum + (item.goal?.targetPercentage ?? 0), 0) / modulesWithGoals.length
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Goals</Text>
      </View>

      {avgGoal !== null && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Overall Average</Text>
            <Text style={styles.summaryValue}>{overallAverage.toFixed(1)}%</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg Goal</Text>
            <Text style={styles.summaryValue}>{avgGoal.toFixed(1)}%</Text>
          </View>
          <View style={styles.summaryStatus}>
            <Text style={[
              styles.summaryStatusText,
              { color: overallAverage >= avgGoal ? colours.success : colours.warning }
            ]}>
              {overallAverage >= avgGoal ? '↑ On Track' : '↓ Below'}
            </Text>
          </View>
        </View>
      )}


      <FlatList
        data={data}
        keyExtractor={(item) => item.module.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={48} color={colours.grey3} />
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
          const { color, bg } = feasibilityConfig(feasibility);
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
                  Current: <Text style={styles.pctValue}>{avg.toFixed(1)}%</Text>
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

              {item.goal ? (
                <Text style={styles.noteText}>
                  {feasibility === 'Reached'
                    ? '🎉 Goal achieved!'
                    : required !== null && remaining > 0
                    ? `Need ${required.toFixed(1)}% on remaining · ${remaining.toFixed(0)}% weighting left`
                    : 'No remaining weighting — add more assessments'}
                </Text>
              ) : (
                <Text style={[styles.noteText, { color: colours.primary }]}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colours.white,
    borderBottomWidth: 1,
    borderBottomColor: colours.grey3,
  },
  appName: { fontSize: 22, fontWeight: '800', color: colours.primary, letterSpacing: -0.5 },
  list: { padding: spacing.screenPadding, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 14, color: colours.grey4 },
  card: {
    backgroundColor: colours.white,
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
    color: colours.white,
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