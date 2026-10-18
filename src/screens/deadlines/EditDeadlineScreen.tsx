import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DeadlinesStackParamList } from '../../navigation/DeadlinesNavigator';
import { fetchDeadlines, updateDeadline, deleteDeadline } from '../../services/deadlines';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';

type Nav = NativeStackNavigationProp<DeadlinesStackParamList, 'EditDeadline'>;
type Route = RouteProp<DeadlinesStackParamList, 'EditDeadline'>;

const getDate = (ts: any): Date => {
  if (ts && typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
};

export default function EditDeadlineScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { deadlineId } = route.params;

  const [moduleName, setModuleName] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await fetchDeadlines();
        const found = all.find((d) => d.id === deadlineId);
        if (found) {
          setModuleName(found.moduleName);
          setAssessmentName(found.assessmentName);
          const date = getDate(found.date);
          setDay(date.getDate().toString());
          setMonth((date.getMonth() + 1).toString());
          setYear(date.getFullYear().toString());
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load deadline.');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [deadlineId]);

  const handleSave = async () => {
    if (!assessmentName.trim()) {
      Alert.alert('Error', 'Assessment name is required.');
      return;
    }

    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (
      isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) ||
      dayNum < 1 || dayNum > 31 ||
      monthNum < 1 || monthNum > 12 ||
      yearNum < 2024
    ) {
      Alert.alert('Error', 'Please enter a valid date.');
      return;
    }

    const date = new Date(yearNum, monthNum - 1, dayNum);
    setLoading(true);
    try {
      await updateDeadline(deadlineId, moduleName, assessmentName.trim(), date);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to update deadline.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Deadline',
      'This will permanently remove this deadline.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteDeadline(deadlineId);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete deadline.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Deadline</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          {deleting
            ? <ActivityIndicator size="small" color={colours.danger} />
            : <Text style={styles.deleteText}>Delete</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Module</Text>
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyText}>{moduleName}</Text>
        </View>

        <Text style={styles.label}>Assessment Name *</Text>
        <TextInput
          style={styles.input}
          value={assessmentName}
          onChangeText={setAssessmentName}
          placeholder="e.g. Test 2"
          placeholderTextColor={colours.grey4}
        />

        <Text style={styles.label}>Due Date *</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Day</Text>
            <TextInput
              style={styles.dateInput}
              value={day}
              onChangeText={setDay}
              keyboardType="number-pad"
              placeholder="DD"
              placeholderTextColor={colours.grey4}
              maxLength={2}
            />
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Month</Text>
            <TextInput
              style={styles.dateInput}
              value={month}
              onChangeText={setMonth}
              keyboardType="number-pad"
              placeholder="MM"
              placeholderTextColor={colours.grey4}
              maxLength={2}
            />
          </View>
          <View style={[styles.dateItem, { flex: 1.5 }]}>
            <Text style={styles.dateLabel}>Year</Text>
            <TextInput
              style={styles.dateInput}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              placeholder="YYYY"
              placeholderTextColor={colours.grey4}
              maxLength={4}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colours.white} />
            : <Text style={styles.btnPrimaryText}>Save Changes</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnSecondaryText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colours.white,
    borderBottomWidth: 1,
    borderBottomColor: colours.grey3,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, color: colours.primary, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colours.text },
  deleteBtn: { width: 60, alignItems: 'flex-end' },
  deleteText: { fontSize: 15, color: colours.danger, fontWeight: '600' },
  content: { padding: spacing.screenPadding, paddingTop: 24 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colours.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  readOnly: {
    backgroundColor: colours.grey1,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    borderRadius: spacing.borderRadius,
    padding: 13,
    marginBottom: 16,
  },
  readOnlyText: { fontSize: 15, color: colours.grey5 },
  input: {
    backgroundColor: colours.white,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    borderRadius: spacing.borderRadius,
    padding: 13,
    fontSize: 15,
    color: colours.text,
    marginBottom: 16,
  },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 11, color: colours.grey5, marginBottom: 4 },
  dateInput: {
    backgroundColor: colours.white,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    borderRadius: spacing.borderRadius,
    padding: 13,
    fontSize: 15,
    color: colours.text,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: colours.primary,
    borderRadius: spacing.borderRadius,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: colours.white, fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    alignItems: 'center',
    padding: 15,
    marginTop: 8,
    borderRadius: spacing.borderRadius,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    backgroundColor: colours.white,
  },
  btnSecondaryText: { color: colours.grey5, fontSize: 15, fontWeight: '600' },
});