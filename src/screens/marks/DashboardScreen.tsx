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
import { MarksStackParamList } from '../../navigation/MarksNavigator';
import { useModulesStore } from '../../store/useModulesStore';
import { fetchModules } from '../../services/modules';
import { fetchAssessments } from '../../services/assessments';
import { fetchGoal } from '../../services/goals';
import {
  calculateWeightedAverage,
  calculateFeasibility,
  calculateDirection,
} from '../../utils/calculations';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { Goal } from '../../types/index';

type Nav = NativeStackNavigationProp<MarksStackParamList, 'Dashboard'>;

const directionIcon = (d: string) => {
  if (d === 'up') return { icon: 'trending-up', color: colours.success };
  if (d === 'down') return { icon: 'trending-down', color: colours.danger };
  return { icon: 'remove', color: colours.grey4 };
};

const feasibilityColor = (status: string) => {
  if (status === 'Reached') return colours.success;
  if (status === 'On Track') return colours.success;
  if (status === 'At Risk') return colours.warning;
  if (status === 'Unlikely') return colours.orange;
  if (status === 'Impossible') return colours.danger;
  return colours.grey4;
};

interface ModuleData {
  id: string;
  name: string;
  code: string;
  level: string;
  assessments: any[];
  goal: Goal | null;
  createdAt: any;
  updatedAt: any;
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { setModules } = useModulesStore();
  const [modules, setLocalModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          const mods = await fetchModules();
          const modsWithData = await Promise.all(
            mods.map(async (m) => {
              const assessments = await fetchAssessments(m.id);
              const goal = await fetchGoal(m.id);
              return { ...m, assessments, goal };
            })
          );
          setLocalModules(modsWithData);
          setModules(modsWithData);
        } catch (e) {
          Alert.alert('Error', 'Failed to load modules.');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

  const moduleAverages = modules.map((m) => calculateWeightedAverage(m.assessments));
  const overallAverage = moduleAverages.length > 0
    ? moduleAverages.reduce((sum, avg) => sum + avg, 0) / moduleAverages.length
    : 0;

  const modulesWithGoals = modules.filter((m) => m.goal !== null);
  const overallGoal = modulesWithGoals.length > 0
    ? modulesWithGoals.reduce((sum, m) => sum + (m.goal?.targetPercentage ?? 0), 0) / modulesWithGoals.length
    : null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>StudyTrack</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={32} color={colours.primary} />
        </TouchableOpacity>
      </View>

      {/* Fixed Overall Card — does not scroll */}
      <View style={styles.overallCard}>
        <View style={styles.overallLeft}>
          <Text style={styles.overallLabel}>Overall Average</Text>
          <Text style={styles.overallPercent}>{overallAverage.toFixed(1)}%</Text>
          <View style={styles.overallBarTrack}>
            <View style={[styles.overallBarFill, { width: `${Math.min(overallAverage, 100)}%` }]} />
          </View>
        </View>
        {overallGoal !== null && (
          <View style={styles.overallRight}>
            <Text style={styles.goalLabel}>Avg Goal</Text>
            <Text style={styles.goalValue}>{overallGoal.toFixed(1)}%</Text>
            <Text style={[
              styles.goalStatus,
              { color: overallAverage >= overallGoal ? colours.success : colours.warning }
            ]}>
              {overallAverage >= overallGoal ? '↑ On track' : '↓ Below'}
            </Text>
          </View>
        )}
      </View>

      {/* Scrollable Module List */}
      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>
            {modules.length} module{modules.length !== 1 ? 's' : ''} tracked
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={colours.grey3} />
            <Text style={styles.emptyTitle}>No modules yet</Text>
            <Text style={styles.emptyText}>Tap + to add your first module</Text>
          </View>
        }
        renderItem={({ item }) => {
          const avg = calculateWeightedAverage(item.assessments);
          const direction = calculateDirection(item.assessments);
          const feasibility = calculateFeasibility(
            item.assessments,
            item.goal?.targetPercentage ?? null
          );
          const { icon, color } = directionIcon(direction);
          const barColor = feasibilityColor(feasibility);

          return (
            <TouchableOpacity
              style={styles.moduleCard}
              onPress={() => navigation.navigate('ModuleDetail', { moduleId: item.id })}
            >
              <View style={[styles.colorBar, { backgroundColor: barColor }]} />
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleName}>{item.name}</Text>
                {item.code ? <Text style={styles.moduleCode}>{item.code}</Text> : null}
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(avg, 100)}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.moduleMeta}>
                  {item.assessments.length} assessment{item.assessments.length !== 1 ? 's' : ''}
                  {item.goal ? ` · Goal: ${item.goal.targetPercentage}%` : ''}
                </Text>
              </View>
              <View style={styles.moduleRight}>
                <Text style={[styles.moduleAvg, { color: barColor }]}>{avg.toFixed(1)}%</Text>
                <Ionicons name={icon as any} size={18} color={color} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddModule')}
      >
        <Ionicons name="add" size={28} color={colours.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colours.white,
    borderBottomWidth: 1,
    borderBottomColor: colours.grey3,
  },
  appName: { fontSize: 22, fontWeight: '800', color: colours.primary, letterSpacing: -0.5 },
  overallCard: {
    backgroundColor: colours.primary,
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallLeft: { flex: 1 },
  overallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overallPercent: {
    fontSize: 44,
    fontWeight: '800',
    color: colours.white,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  overallBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  overallBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },
  overallRight: {
    alignItems: 'flex-end',
    paddingLeft: 16,
  },
  goalLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colours.white,
    letterSpacing: -0.5,
  },
  goalStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colours.grey5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  list: { padding: spacing.screenPadding, paddingBottom: 100 },
  moduleCard: {
    backgroundColor: colours.white,
    borderRadius: spacing.borderRadius,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colours.grey3,
    gap: 12,
  },
  colorBar: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  moduleInfo: { flex: 1 },
  moduleName: { fontSize: 15, fontWeight: '700', color: colours.text, marginBottom: 2 },
  moduleCode: { fontSize: 11, color: colours.grey5, marginBottom: 6 },
  barTrack: {
    height: 4,
    backgroundColor: colours.grey2,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: { height: '100%', borderRadius: 2 },
  moduleMeta: { fontSize: 11, color: colours.grey5 },
  moduleRight: { alignItems: 'center', gap: 4 },
  moduleAvg: { fontSize: 18, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 14, color: colours.grey4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colours.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colours.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});