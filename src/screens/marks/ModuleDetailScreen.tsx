import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AppIcon from '../../components/AppIcon';
import { MarksStackParamList } from '../../navigation/MarksNavigator';
import { fetchModules } from '../../services/modules';
import { fetchAssessments } from '../../services/assessments';
import { fetchGoal } from '../../services/goals';
import { calculateWeightedAverage, calculateDirection, calculateRequiredScore, calculateRemainingWeighting } from '../../utils/calculations';
import ScreenHeader, { HeaderAction } from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { Module, Assessment, Goal } from '../../types/index';

type Nav = StackNavigationProp<MarksStackParamList, 'ModuleDetail'>;
type Route = RouteProp<MarksStackParamList, 'ModuleDetail'>;

const directionConfig = (d: string, colours: Palette) => {
  if (d === 'up') return { icon: 'trending-up', color: colours.success, label: 'Improving' };
  if (d === 'down') return { icon: 'trending-down', color: colours.danger, label: 'Declining' };
  return { icon: 'remove', color: colours.grey4, label: 'Stable' };
};

export default function ModuleDetailScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { moduleId } = route.params;

  const [module, setModule] = useState<Module | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);

  // Spinner on first visit only; quiet refresh when you come back; pull to refresh
  const { loading, refreshing, onRefresh } = useFocusLoad(async () => {
    const modules = await fetchModules();
    const found = modules.find((m) => m.id === moduleId);
    if (found) setModule(found);
    const asmts = await fetchAssessments(moduleId);
    const sorted = [...asmts].sort((a, b) => {
      const getTime = (ts: any) => {
        if (ts && typeof ts.toMillis === 'function') return ts.toMillis();
        if (ts instanceof Date) return ts.getTime();
        return 0;
      };
      return getTime(a.createdAt) - getTime(b.createdAt);
    });
    setAssessments(sorted);
    // Bug fix: the goal was never loaded, so the tip strip always said "No goal set"
    const g = await fetchGoal(moduleId);
    setGoal(g);
  }, "Couldn't load module");

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.accent} />
      </View>
    );
  }

  if (!module) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colours.grey5 }}>Module not found.</Text>
      </View>
    );
  }

  const avg = calculateWeightedAverage(assessments);
  const direction = calculateDirection(assessments);
  const remaining = calculateRemainingWeighting(assessments);
  const required = goal ? calculateRequiredScore(assessments, goal.targetPercentage) : null;
  const { icon, color, label } = directionConfig(direction, colours);

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title={module.name}
        onBack={() => navigation.goBack()}
        right={<HeaderAction label="Edit" onPress={() => navigation.navigate('EditModule', { moduleId })} />}
      />

      <FlatList
        data={assessments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.accent} colors={[colours.accent]} />}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <View>
                <Text style={styles.heroLabel}>Current Average</Text>
                <View style={styles.heroRow}>
                  <Text style={styles.heroAvg}>{avg.toFixed(1)}%</Text>
                  <View style={styles.directionBadge}>
                    <Ionicons name={icon as any} size={16} color={color} />
                    <Text style={[styles.directionLabel, { color }]}>{label}</Text>
                  </View>
                </View>
                {module.code ? <Text style={styles.heroCode}>{module.code}{module.level ? ` · ${module.level}` : ''}</Text> : null}
              </View>
            </View>

            {/* Insight Strip */}
            {remaining > 0 && (
              <View style={styles.insightStrip}>
                <Ionicons name="bulb-outline" size={14} color={colours.accent} />
                <Text style={styles.insightText}>
                  {!goal || required === null
                    ? `No goal set · ${remaining.toFixed(0)}% weighting still to come`
                    : required <= 0
                    ? `Goal secured — you'll reach ${goal.targetPercentage}% even with 0% on the remaining ${remaining.toFixed(0)}%`
                    : required <= 100
                    ? `Need ${required.toFixed(1)}% on the remaining ${remaining.toFixed(0)}% to reach your ${goal.targetPercentage}% goal`
                    : `Goal needs ${required.toFixed(1)}% on the remaining ${remaining.toFixed(0)}% — consider adjusting your target`}
                </Text>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Assessments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddAssessment', { moduleId })}>
                <Text style={styles.addText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {assessments.length === 0 && (
              <View style={styles.empty}>
                <AppIcon name="document" size={56} />
                <Text style={styles.emptyTitle}>No assessments yet</Text>
                <Text style={styles.emptyText}>Tap + Add to record your first mark</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const pct = (item.mark / item.outOf) * 100;
          const barColor = pct >= 75 ? colours.success : pct >= 50 ? colours.warning : colours.danger;

          return (
            <TouchableOpacity
              style={styles.assessmentCard}
              onPress={() => navigation.navigate('EditAssessment', { moduleId, assessmentId: item.id })}
            >
              <View style={styles.asmtTop}>
                <Text style={styles.asmtName}>{item.name}</Text>
                <Text style={[styles.asmtScore, { color: barColor }]}>{pct.toFixed(1)}%</Text>
              </View>
              <View style={styles.asmtBar}>
                <View style={[styles.asmtBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
              </View>
              <View style={styles.asmtBottom}>
                <Text style={styles.asmtMeta}>{item.mark} / {item.outOf}</Text>
                <Text style={styles.asmtMeta}>Weighting: {item.weighting}%</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddAssessment', { moduleId })}
      >
        <Ionicons name="add" size={28} color={colours.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.background },
  hero: {
    backgroundColor: colours.primary,
    padding: 20,
    marginBottom: 12,
  },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  heroAvg: { fontSize: 44, fontWeight: '800', color: colours.onPrimary, letterSpacing: -1.5 },
  directionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  directionLabel: { fontSize: 12, fontWeight: '600', color: colours.onPrimary },
  heroCode: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  insightStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colours.primaryPale,
    borderRadius: spacing.borderRadius,
    padding: 12,
    marginHorizontal: spacing.screenPadding,
    marginBottom: 12,
  },
  insightText: { flex: 1, fontSize: 12, color: colours.accent, fontWeight: '500', lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.screenPadding,
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colours.grey5, textTransform: 'uppercase', letterSpacing: 0.8 },
  addText: { fontSize: 14, color: colours.accent, fontWeight: '600' },
  list: { paddingBottom: 72 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 13, color: colours.grey4 },
  assessmentCard: {
    backgroundColor: colours.card,
    borderRadius: spacing.borderRadius,
    padding: 14,
    marginHorizontal: spacing.screenPadding,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colours.grey3,
  },
  asmtTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  asmtName: { fontSize: 14, fontWeight: '700', color: colours.text },
  asmtScore: { fontSize: 14, fontWeight: '700' },
  asmtBar: { height: 4, backgroundColor: colours.grey2, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  asmtBarFill: { height: '100%', borderRadius: 2 },
  asmtBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  asmtMeta: { fontSize: 11, color: colours.grey5 },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 20,
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