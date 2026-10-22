import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text, TextInput } from '../../components/AppText';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { DeadlinesStackParamList } from '../../navigation/DeadlinesNavigator';
import { addDeadline } from '../../services/deadlines';
import { fetchModules } from '../../services/modules';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { showError } from '../../utils/errors';
import { buildValidDate } from '../../utils/dates';
import FormField from '../../components/FormField';
import { validateDeadline, hasErrors, FieldErrors, DeadlineField } from '../../utils/validation';
import { Module } from '../../types/index';

type Nav = StackNavigationProp<DeadlinesStackParamList, 'AddDeadline'>;

export default function AddDeadlineScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation<Nav>();
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
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
  const [showModulePicker, setShowModulePicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const mods = await fetchModules();
        setModules(mods);
      } catch (e) {
        showError("Couldn't load modules", e);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const found = validateDeadline(!!selectedModule, assessmentName, day, month, year);
    setErrors(found);
    if (hasErrors(found) || !selectedModule) return;
    const date = buildValidDate(day, month, year)!;

    setLoading(true);
    try {
      await addDeadline(
        selectedModule.id,
        selectedModule.name,
        assessmentName.trim(),
        date
      );
      navigation.goBack();
    } catch (e) {
      showError("Couldn't save deadline", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Add Deadline" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Module Picker */}
        <Text style={styles.label}>Module *</Text>
        <TouchableOpacity
          style={[styles.picker, errors.module ? styles.inputInvalid : null]}
          onPress={() => setShowModulePicker(!showModulePicker)}
        >
          <Text style={selectedModule ? styles.pickerSelected : styles.pickerPlaceholder}>
            {selectedModule ? selectedModule.name : 'Select a module'}
          </Text>
          <Ionicons
            name={showModulePicker ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colours.grey4}
          />
        </TouchableOpacity>

        {errors.module ? <Text style={styles.pickerError}>{errors.module}</Text> : null}

        {showModulePicker && (
          <View style={styles.dropdownList}>
            {modules.length === 0 ? (
              <Text style={styles.dropdownEmpty}>No modules found. Add modules in the Marks tab first.</Text>
            ) : (
              modules.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedModule(m);
                    setShowModulePicker(false);
                    clearError('module');
                  }}
                >
                  <Text style={styles.dropdownItemText}>{m.name}</Text>
                  {selectedModule?.id === m.id && (
                    <Ionicons name="checkmark" size={16} color={colours.accent} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

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
            : <Text style={styles.btnPrimaryText}>Save Deadline</Text>
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
  content: { padding: spacing.screenPadding, paddingTop: 24 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colours.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  picker: {
    backgroundColor: colours.card,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    borderRadius: spacing.borderRadius,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerSelected: { fontSize: 15, color: colours.text },
  pickerPlaceholder: { fontSize: 15, color: colours.grey4 },
  dropdownList: {
    backgroundColor: colours.card,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    borderRadius: spacing.borderRadius,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownEmpty: { padding: 14, fontSize: 13, color: colours.grey5 },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colours.grey2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: { fontSize: 15, color: colours.text },
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