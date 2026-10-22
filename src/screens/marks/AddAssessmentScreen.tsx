import React, { useState, useMemo, useEffect } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MarksStackParamList } from '../../navigation/MarksNavigator';
import { addAssessment, fetchAssessments } from '../../services/assessments';
import { calculateTotalWeighting } from '../../utils/calculations';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { showError } from '../../utils/errors';
import FormField from '../../components/FormField';
import { validateAssessment, parseNumber, hasErrors, FieldErrors, AssessmentField } from '../../utils/validation';

type Nav = StackNavigationProp<MarksStackParamList, 'AddAssessment'>;
type Route = RouteProp<MarksStackParamList, 'AddAssessment'>;

export default function AddAssessmentScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { moduleId } = route.params;

  const [name, setName] = useState('');
  const [mark, setMark] = useState('');
  const [outOf, setOutOf] = useState('');
  const [weighting, setWeighting] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<AssessmentField>>({});
  // Weighting already used by this module's OTHER assessments
  const [otherWeighting, setOtherWeighting] = useState(0);

  const clearError = (field: AssessmentField) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const previewMark = parseNumber(mark);
  const previewOutOf = parseNumber(outOf);

  // Load how much weighting is already used, for the hint and validation
  useEffect(() => {
    fetchAssessments(moduleId)
      .then((all) => setOtherWeighting(calculateTotalWeighting(all)))
      .catch(() => {});
  }, [moduleId]);

  const handleSave = async () => {
    const found = validateAssessment({ name, mark, outOf, weighting }, otherWeighting);
    setErrors(found);
    if (hasErrors(found)) return;

    setLoading(true);
    try {
      // Re-check against the latest saved data before writing
      const latest = calculateTotalWeighting(await fetchAssessments(moduleId));
      const recheck = validateAssessment({ name, mark, outOf, weighting }, latest);
      if (hasErrors(recheck)) {
        setOtherWeighting(latest);
        setErrors(recheck);
        return;
      }
      await addAssessment(moduleId, name.trim(), parseNumber(mark)!, parseNumber(outOf)!, parseNumber(weighting)!);
      navigation.goBack();
    } catch (e) {
      showError("Couldn't save assessment", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Add Assessment" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          label="Assessment Name *"
          value={name}
          onChangeText={(v) => { setName(v); clearError('name'); }}
          placeholder="e.g. Test 1"
          error={errors.name}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <FormField
              label="Mark *"
              value={mark}
              onChangeText={(v) => { setMark(v); clearError('mark'); }}
              keyboardType="decimal-pad"
              placeholder="e.g. 74"
              error={errors.mark}
            />
          </View>
          <View style={styles.rowItem}>
            <FormField
              label="Out Of *"
              value={outOf}
              onChangeText={(v) => { setOutOf(v); clearError('outOf'); clearError('mark'); }}
              keyboardType="decimal-pad"
              placeholder="e.g. 100"
              error={errors.outOf}
            />
          </View>
        </View>

        <FormField
          label="Weighting (%) *"
          value={weighting}
          onChangeText={(v) => { setWeighting(v); clearError('weighting'); }}
          keyboardType="decimal-pad"
          placeholder="e.g. 30"
          error={errors.weighting}
          hint={`${Math.max(0, 100 - otherWeighting).toFixed(0)}% weighting left in this module`}
        />

        {previewMark !== null && previewOutOf !== null && previewOutOf > 0 && (
          <View style={styles.previewStrip}>
            <Text style={styles.previewText}>
              Score preview: {((previewMark / previewOutOf) * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colours.onPrimary} />
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
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  previewStrip: {
    backgroundColor: colours.primaryPale,
    borderRadius: spacing.borderRadiusSmall,
    padding: 10,
    marginBottom: 16,
  },
  previewText: { fontSize: 13, color: colours.accent, fontWeight: '600' },
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