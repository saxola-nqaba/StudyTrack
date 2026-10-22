import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  ScrollView,
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
import { DeadlinesStackParamList } from '../../navigation/DeadlinesNavigator';
import { fetchDeadlines, toggleDeadlineDone, deleteDeadline } from '../../services/deadlines';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { useTabPressReset } from '../../hooks/useTabPressReset';
import { showError } from '../../utils/errors';
import { Deadline } from '../../types/index';
import { format } from 'date-fns';

type Nav = StackNavigationProp<DeadlinesStackParamList, 'DeadlinesList'>;

const getDate = (ts: any): Date => {
  if (ts && typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
};

// Label for the badge on each deadline card.
// "late" only applies to deadlines that are NOT done — a completed
// deadline with a past date just shows how long ago it was due.
const getDaysLabel = (date: Date, isDone: boolean): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const days = Math.abs(diff);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return isDone ? 'Yesterday' : '1 day late';
  if (diff < 0) return isDone ? `${days} days ago` : `${days} days late`;
  return `In ${days} days`;
};

export default function DeadlinesScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation<Nav>();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  // Spinner on first visit only; quiet refresh when you come back; pull to refresh
  const listRef = useRef<any>(null);
  const { loading, refreshing, onRefresh, refreshQuietly } = useFocusLoad(async () => {
    const data = await fetchDeadlines();
    setDeadlines(data);
  }, "Couldn't load deadlines");

  // Tap the tab icon → back to the top (and refresh if already on this tab)
  useTabPressReset(listRef, refreshQuietly);

  const handleToggle = async (deadline: Deadline) => {
    try {
      await toggleDeadlineDone(deadline.id, !deadline.isDone);
      setDeadlines((prev) =>
        prev.map((d) =>
          d.id === deadline.id ? { ...d, isDone: !d.isDone } : d
        )
      );
    } catch (e) {
      showError("Couldn't update deadline", e);
    }
  };

  const handleDelete = (deadline: Deadline) => {
    Alert.alert(
      'Delete Deadline',
      `Remove "${deadline.assessmentName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeadline(deadline.id);
              setDeadlines((prev) => prev.filter((d) => d.id !== deadline.id));
            } catch (e) {
              showError("Couldn't delete deadline", e);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.accent} />
      </View>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = deadlines.filter((d) => {
    const date = getDate(d.date);
    date.setHours(0, 0, 0, 0);
    return !d.isDone && date < today;
  });

  const upcoming = deadlines.filter((d) => {
    const date = getDate(d.date);
    date.setHours(0, 0, 0, 0);
    return !d.isDone && date >= today;
  }).sort((a, b) => getDate(a.date).getTime() - getDate(b.date).getTime());

  // Completed: most recently due first
  const completed = deadlines
    .filter((d) => d.isDone)
    .sort((a, b) => getDate(b.date).getTime() - getDate(a.date).getTime());

  const sections = [
    { title: 'Overdue', data: overdue, type: 'overdue' },
    { title: 'Upcoming', data: upcoming, type: 'upcoming' },
    { title: 'Completed', data: completed, type: 'done' },
  ].filter((s) => s.data.length > 0);

  const renderItem = ({ item, section }: { item: Deadline; section: any }) => {
    const date = getDate(item.date);
    const isOverdue = section.type === 'overdue';
    const isDone = item.isDone;
    const daysLabel = getDaysLabel(date, isDone);

    return (
        <TouchableOpacity
          style={[styles.card, isOverdue && styles.cardOverdue]}
          onPress={() => navigation.navigate('EditDeadline', { deadlineId: item.id })}
        >
        <TouchableOpacity
          style={[styles.toggle, isDone && styles.toggleDone]}
          onPress={() => handleToggle(item)}
        >
          {isDone && <Ionicons name="checkmark" size={12} color={colours.onPrimary} />}
        </TouchableOpacity>

        <View style={styles.cardInfo}>
          <Text style={[styles.moduleName, isDone && styles.strikethrough]}>
            {item.moduleName}
          </Text>
          <Text style={[styles.assessmentName, isDone && styles.strikethrough]}>
            {item.assessmentName}
          </Text>
          <View style={styles.dateRow}>
            <AppIcon name="calendar" size={14} />
            <Text style={styles.dateText}>{format(date, 'd MMM yyyy')}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={[
            styles.daysBadge,
            isOverdue ? styles.badgeOverdue : isDone ? styles.badgeDone : styles.badgeUpcoming,
          ]}>
            <Text style={[
              styles.daysText,
              isOverdue ? styles.daysOverdue : isDone ? styles.daysDone : styles.daysUpcoming,
            ]}>
              {daysLabel}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={colours.grey4} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Deadlines" />

      {deadlines.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.accent} colors={[colours.accent]} />}
        >
          <AppIcon name="calendar" size={64} />
          <Text style={styles.emptyTitle}>No deadlines yet</Text>
          <Text style={styles.emptyText}>Tap + to add your first deadline</Text>
        </ScrollView>
      ) : (
        <SectionList
          ref={listRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colours.accent} colors={[colours.accent]} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={[
                styles.sectionTitle,
                section.type === 'overdue' && styles.sectionOverdue,
                section.type === 'upcoming' && styles.sectionUpcoming,
                section.type === 'done' && styles.sectionDone,
              ]}>
                {section.title} · {section.data.length}
              </Text>
            </View>
          )}
          renderItem={renderItem}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDeadline')}
      >
        <Ionicons name="add" size={28} color={colours.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.background },
  // Bottom space = just enough for the last card to clear the + button
  list: { padding: spacing.screenPadding, paddingBottom: 72 },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.screenPadding },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 14, color: colours.grey4 },
  sectionHeader: { marginBottom: 8, marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionOverdue: { color: colours.danger },
  sectionUpcoming: { color: colours.accent },
  sectionDone: { color: colours.grey4 },
  card: {
    backgroundColor: colours.card,
    borderRadius: spacing.borderRadius,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colours.grey3,
    gap: 12,
  },
  cardOverdue: { borderColor: colours.overdueBorder, backgroundColor: colours.overdueBg },
  toggle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colours.grey3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleDone: { backgroundColor: colours.success, borderColor: colours.success },
  cardInfo: { flex: 1 },
  moduleName: { fontSize: 11, color: colours.grey5, marginBottom: 2 },
  assessmentName: { fontSize: 14, fontWeight: '700', color: colours.text, marginBottom: 4 },
  strikethrough: { textDecorationLine: 'line-through', color: colours.grey4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 11, color: colours.grey5 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  daysBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeOverdue: { backgroundColor: colours.dangerPale },
  badgeUpcoming: { backgroundColor: colours.primaryPale },
  badgeDone: { backgroundColor: colours.grey2 },
  daysText: { fontSize: 11, fontWeight: '700' },
  daysOverdue: { color: colours.danger },
  daysUpcoming: { color: colours.accent },
  daysDone: { color: colours.grey4 },
  deleteBtn: { padding: 4 },
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