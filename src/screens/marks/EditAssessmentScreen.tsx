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
import { MarksStackParamList } from '../../navigation/MarksNavigator';
import { fetchAssessments, updateAssessment, deleteAssessment } from '../../services/assessments';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';

type Nav = NativeStackNavigationProp<MarksStackParamList, 'EditAssessment'>;
type Route = RouteProp<MarksStackParamList, 'EditAssessment'>;

export default function EditAssessmentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { moduleId, assessmentId } = route.params;

  const [name, setName] = useState('');
  const [mark, setMark] = useState('');
  const [outOf, setOutOf] = useState('');
  const [weighting, setWeighting] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const assessments = await fetchAssessments(moduleId);
        const found = assessments.find((a) => a.id === assessmentId);
        if (found) {
          setName(found.name);
          setMark(found.mark.toString());
          setOutOf(found.outOf.toString());
          setWeighting(found.weighting.toString());
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load assessment.');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [moduleId, assessmentId]);

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
      await updateAssessment(moduleId, assessmentId, {
        name: name.trim(),
        mark: markNum,
        outOf: outOfNum,
        weighting: weightingNum,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to update assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Assessment',
      'This will permanently remove this assessment and its mark. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAssessment(moduleId, assessmentId);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete assessment.');
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
        <Text style={styles.headerTitle}>Edit Assessment</Text>
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