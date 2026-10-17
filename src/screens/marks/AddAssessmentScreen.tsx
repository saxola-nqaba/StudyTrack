import React, { useState } from 'react';
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
import { MarksStackParamList } from '../../navigation/MarksNavigator';
import { addAssessment, fetchAssessments } from '../../services/assessments';
import { calculateTotalWeighting } from '../../utils/calculations';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';

type Nav = NativeStackNavigationProp<MarksStackParamList, 'AddAssessment'>;
type Route = RouteProp<MarksStackParamList, 'AddAssessment'>;

export default function AddAssessmentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { moduleId } = route.params;

  const [name, setName] = useState('');
  const [mark, setMark] = useState('');
  const [outOf, setOutOf] = useState('');
  const [weighting, setWeighting] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Assessment name is required.');
      return;
    }
    const markNum = parseFloat(mark);
    const outOfNum = parseFloat(outOf);
    const weightingNum = parseFloat(weighting);

    if (isNaN(markNum) || isNaN(outOfNum) || isNaN(weightingNum)) {
      Alert.alert('Error', 'Mark, Out Of and Weighting must be valid numbers.');
      return;
    }
    if (outOfNum <= 0) {
      Alert.alert('Error', 'Out Of must be greater than 0.');
      return;
    }
    if (markNum > outOfNum) {
      Alert.alert('Error', 'Mark cannot exceed Out Of.');
      return;
    }
    if (weightingNum <= 0 || weightingNum > 100) {
      Alert.alert('Error', 'Weighting must be between 1 and 100.');
      return;
    }

    setLoading(true);
    try {
      const existing = await fetchAssessments(moduleId);
      const totalWeighting = calculateTotalWeighting(existing);
      if (totalWeighting + weightingNum > 100) {
        Alert.alert(
          'Weighting Exceeded',
          `Adding ${weightingNum}% would bring total weighting to ${(totalWeighting + weightingNum).toFixed(0)}%. You have ${(100 - totalWeighting).toFixed(0)}% remaining.`
        );
        setLoading(false);
        return;
      }
      await addAssessment(moduleId, name.trim(), markNum, outOfNum, weightingNum);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
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
        <Text style={styles.headerTitle}>Add Assessment</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Assessment Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Test 1"
          placeholderTextColor={colours.grey4}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Mark *</Text>
            <TextInput
              style={styles.input}
              value={mark}
              onChangeText={setMark}
              keyboardType="decimal-pad"
              placeholder="e.g. 74"
              placeholderTextColor={colours.grey4}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Out Of *</Text>
            <TextInput
              style={styles.input}
              value={outOf}
              onChangeText={setOutOf}
              keyboardType="decimal-pad"
              placeholder="e.g. 100"
              placeholderTextColor={colours.grey4}
            />
          </View>
        </View>

        <Text style={styles.label}>Weighting (%) *</Text>
        <TextInput
          style={styles.input}
          value={weighting}
          onChangeText={setWeighting}
          keyboardType="decimal-pad"
          placeholder="e.g. 30"
          placeholderTextColor={colours.grey4}
        />

        {mark && outOf && !isNaN(parseFloat(mark)) && !isNaN(parseFloat(outOf)) && parseFloat(outOf) > 0 && (
          <View style={styles.previewStrip}>
            <Text style={styles.previewText}>
              Score preview: {((parseFloat(mark) / parseFloat(outOf)) * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colours.white} />
            : <Text style={styles.btnPrimaryText}>Save Assessment</Text>
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
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  previewStrip: {
    backgroundColor: colours.primaryPale,
    borderRadius: spacing.borderRadiusSmall,
    padding: 10,
    marginBottom: 16,
  },
  previewText: { fontSize: 13, color: colours.primary, fontWeight: '600' },
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