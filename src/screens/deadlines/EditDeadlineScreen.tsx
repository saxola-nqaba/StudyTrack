import React, { useState, useEffect, useMemo } from 'react';
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
import { StackNavigationProp } from '@react-navigation/stack';
import { DeadlinesStackParamList } from '../../navigation/DeadlinesNavigator';
import { fetchDeadlines, updateDeadline, deleteDeadline } from '../../services/deadlines';
import ScreenHeader, { HeaderAction } from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { showError } from '../../utils/errors';
import { buildValidDate } from '../../utils/dates';
import FormField from '../../components/FormField';
import { validateDeadline, hasErrors, FieldErrors, DeadlineField } from '../../utils/validation';

type Nav = StackNavigationProp<DeadlinesStackParamList, 'EditDeadline'>;
type Route = RouteProp<DeadlinesStackParamList, 'EditDeadline'>;

const getDate = (ts: any): Date => {
  if (ts && typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
};

export default function EditDeadlineScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { deadlineId } = route.params;

  const [moduleName, setModuleName] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<DeadlineField>>({});

  const clearError = (field: DeadlineField) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
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
        showError("Couldn't load deadline", e);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [deadlineId]);

  const handleSave = async () => {
    const found = validateDeadline(true, assessmentName, day, month, year);
    setErrors(found);
    if (hasErrors(found)) return;
    const date = buildValidDate(day, month, year)!;

    setLoading(true);
    try {
      await updateDeadline(deadlineId, moduleName, assessmentName.trim(), date);
      navigation.goBack();
    } catch (e) {
      showError("Couldn't update deadline", e);
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
              showError("Couldn't delete deadline", e);
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
        <ActivityIndicator size="large" color={colours.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Edit Deadline" onBack={() => navigation.goBack()} right={<HeaderAction label="Delete" destructive loading={deleting} onPress={handleDelete} />} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Module</Text>
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyText}>{moduleName}</Text>
        </View>

        <FormField
          label="Assessment Name *"
          value={assessmentName}
          onChangeText={(v) => { setAssessmentName(v); clearError('name'); }}
          placeholder="e.g. Test 2, Assignment 1"
          error={errors.name}
        />

        <Text style={styles.label}>Due Date *</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Day</Text>
            <TextInput
              style={[styles.dateInput, errors.date ? styles.inputInvalid : null]}
              value={day}
              onChangeText={(v) => { setDay(v); clearError('date'); }}
              keyboardType="number-pad"
              placeholder="DD"
              placeholderTextColor={colours.grey4}
              maxLength={2}
            />
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Month</Text>
            <TextInput
              style={[styles.dateInput, errors.date ? styles.inputInvalid : null]}
              value={month}
              onChangeText={(v) => { setMonth(v); clearError('date'); }}
              keyboardType="number-pad"
              placeholder="MM"
              placeholderTextColor={colours.grey4}
              maxLength={2}
            />
          </View>
          <View style={[styles.dateItem, { flex: 1.5 }]}>
            <Text style={styles.dateLabel}>Year</Text>
            <TextInput
              style={[styles.dateInput, errors.date ? styles.inputInvalid : null]}
              value={year}
              onChangeText={(v) => { setYear(v); clearError('date'); }}
              keyboardType="number-pad"
              placeholder="YYYY"
              placeholderTextColor={colours.grey4}
              maxLength={4}
            />
          </View>
        </View>
        {errors.date ? <Text style={styles.dateError}>{errors.date}</Text> : null}

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colours.onPrimary} />
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

const makeStyles = (colours: Palette) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.background },
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
    backgroundColor: colours.card,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    borderRadius: spacing.borderRadius,
    padding: 13,
    fontSize: 15,
    color: colours.text,
    marginBottom: 16,
  },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  inputInvalid: { borderColor: colours.danger, backgroundColor: colours.dangerPale },
  dateError: { fontSize: 12, color: colours.danger, fontWeight: '500', marginTop: -16, marginBottom: 20 },
  pickerError: { fontSize: 12, color: colours.danger, fontWeight: '500', marginTop: -10, marginBottom: 16 },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 11, color: colours.grey5, marginBottom: 4 },
  dateInput: {
    backgroundColor: colours.card,
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
  btnPrimaryText: { color: colours.onPrimary, fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    alignItems: 'center',
    padding: 15,
    marginTop: 8,
    borderRadius: spacing.borderRadius,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    backgroundColor: colours.card,
  },
  btnSecondaryText: { color: colours.grey5, fontSize: 15, fontWeight: '600' },
});