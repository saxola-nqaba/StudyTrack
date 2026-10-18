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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DeadlinesStackParamList } from '../../navigation/DeadlinesNavigator';
import { addDeadline } from '../../services/deadlines';
import { fetchModules } from '../../services/modules';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { Module } from '../../types/index';

type Nav = NativeStackNavigationProp<DeadlinesStackParamList, 'AddDeadline'>;

export default function AddDeadlineScreen() {
  const navigation = useNavigation<Nav>();
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [assessmentName, setAssessmentName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModulePicker, setShowModulePicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const mods = await fetchModules();
        setModules(mods);
      } catch (e) {
        Alert.alert('Error', 'Failed to load modules.');
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!selectedModule) {
      Alert.alert('Error', 'Please select a module.');
      return;
    }
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
    if (isNaN(date.getTime())) {
      Alert.alert('Error', 'Invalid date.');
      return;
    }

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
      Alert.alert('Error', 'Failed to save deadline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Deadline</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Module Picker */}
        <Text style={styles.label}>Module *</Text>
        <TouchableOpacity
          style={styles.picker}
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
                  }}
                >
                  <Text style={styles.dropdownItemText}>{m.name}</Text>
                  {selectedModule?.id === m.id && (
                    <Ionicons name="checkmark" size={16} color={colours.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <Text style={styles.label}>Assessment Name *</Text>
        <TextInput
          style={styles.input}
          value={assessmentName}
          onChangeText={setAssessmentName}
          placeholder="e.g. Test 2, Assignment 1"
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colours.background },
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
    backgroundColor: colours.white,
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
    backgroundColor: colours.white,
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