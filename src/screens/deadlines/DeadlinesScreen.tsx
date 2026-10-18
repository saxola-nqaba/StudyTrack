import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DeadlinesStackParamList } from '../../navigation/DeadlinesNavigator';
import { fetchDeadlines, toggleDeadlineDone, deleteDeadline } from '../../services/deadlines';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { Deadline } from '../../types/index';
import { format } from 'date-fns';

type Nav = NativeStackNavigationProp<DeadlinesStackParamList, 'DeadlinesList'>;

const getDate = (ts: any): Date => {
  if (ts && typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
};

const getDaysLabel = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d late`;
  return `${diff} days`;
};

export default function DeadlinesScreen() {
  const navigation = useNavigation<Nav>();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const data = await fetchDeadlines();
          setDeadlines(data);
        } catch (e) {
          Alert.alert('Error', 'Failed to load deadlines.');
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const handleToggle = async (deadline: Deadline) => {
    try {
      await toggleDeadlineDone(deadline.id, !deadline.isDone);
      setDeadlines((prev) =>
        prev.map((d) =>
          d.id === deadline.id ? { ...d, isDone: !d.isDone } : d
        )
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to update deadline.');
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
              Alert.alert('Error', 'Failed to delete deadline.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.primary} />
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

  const completed = deadlines.filter((d) => d.isDone);

  const sections = [
    { title: 'Overdue', data: overdue, type: 'overdue' },
    { title: 'Upcoming', data: upcoming, type: 'upcoming' },
    { title: 'Completed', data: completed, type: 'done' },
  ].filter((s) => s.data.length > 0);

  const renderItem = ({ item, section }: { item: Deadline; section: any }) => {
    const date = getDate(item.date);
    const daysLabel = getDaysLabel(date);
    const isOverdue = section.type === 'overdue';
    const isDone = item.isDone;

    return (
        <TouchableOpacity
          style={[styles.card, isOverdue && styles.cardOverdue]}
          onPress={() => navigation.navigate('EditDeadline', { deadlineId: item.id })}
        >
        <TouchableOpacity
          style={[styles.toggle, isDone && styles.toggleDone]}
          onPress={() => handleToggle(item)}
        >
          {isDone && <Ionicons name="checkmark" size={12} color={colours.white} />}
        </TouchableOpacity>

        <View style={styles.cardInfo}>
          <Text style={[styles.moduleName, isDone && styles.strikethrough]}>
            {item.moduleName}
          </Text>
          <Text style={[styles.assessmentName, isDone && styles.strikethrough]}>
            {item.assessmentName}
          </Text>
          <Text style={styles.dateText}>
            📅 {format(date, 'd MMM yyyy')}
          </Text>
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
      <View style={styles.header}>
        <Text style={styles.appName}>Deadlines</Text>
      </View>

      {deadlines.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={colours.grey3} />
          <Text style={styles.emptyTitle}>No deadlines yet</Text>
          <Text style={styles.emptyText}>Tap + to add your first deadline</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
        <Ionicons name="add" size={28} color={colours.white} />
      </TouchableOpacity>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 14, color: colours.grey4 },
  sectionHeader: { marginBottom: 8, marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionOverdue: { color: colours.danger },
  sectionUpcoming: { color: colours.primary },
  sectionDone: { color: colours.grey4 },
  card: {
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
  cardOverdue: { borderColor: '#F5C6CB', backgroundColor: '#FFF5F5' },
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
  dateText: { fontSize: 11, color: colours.grey5 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  daysBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeOverdue: { backgroundColor: colours.dangerPale },
  badgeUpcoming: { backgroundColor: colours.primaryPale },
  badgeDone: { backgroundColor: colours.grey2 },
  daysText: { fontSize: 11, fontWeight: '700' },
  daysOverdue: { color: colours.danger },
  daysUpcoming: { color: colours.primary },
  daysDone: { color: colours.grey4 },
  deleteBtn: { padding: 4 },
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