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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GoalsStackParamList } from '../../navigation/GoalsNavigator';
import { fetchGoal, setGoal, deleteGoal } from '../../services/goals';
import ScreenHeader, { HeaderAction } from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { showError } from '../../utils/errors';
import FormField from '../../components/FormField';
import { validateGoal, parseNumber, hasErrors, FieldErrors } from '../../utils/validation';

type Nav = StackNavigationProp<GoalsStackParamList, 'EditGoal'>;
type Route = RouteProp<GoalsStackParamList, 'EditGoal'>;

export default function EditGoalScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { moduleId, moduleName } = route.params;

  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<'target'>>({});
  const [deleting, setDeleting] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const goal = await fetchGoal(moduleId);
        if (goal) {
          setTarget(goal.targetPercentage.toString());
          setHasExisting(true);
        }
      } catch (e) {
        showError("Couldn't load goal", e);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [moduleId]);

  const handleSave = async () => {
    const found = validateGoal(target);
    setErrors(found);
    if (hasErrors(found)) return;
    const targetNum = parseNumber(target)!;

    setLoading(true);
    try {
      await setGoal(moduleId, targetNum);
      navigation.goBack();
    } catch (e) {
      showError("Couldn't save goal", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Goal',
      'This will remove the goal for this module.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteGoal(moduleId);
              navigation.goBack();
            } catch (e) {
              showError("Couldn't remove goal", e);
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
      <ScreenHeader
        title={moduleName}
        onBack={() => navigation.goBack()}
        right={hasExisting ? <HeaderAction label="Remove" destructive loading={deleting} onPress={handleDelete} /> : null}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          {hasExisting ? 'Update your target percentage for this module.' : 'Set a target percentage for this module.'}
        </Text>

        <FormField
          label="Target Percentage *"
          value={target}
          onChangeText={(v) => { setTarget(v); setErrors({}); }}
          keyboardType="decimal-pad"
          placeholder="e.g. 75"
          error={errors.target}
          hint="Enter a value between 1 and 100"
          containerStyle={{ marginBottom: 24 }}
        />

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colours.onPrimary} />
            : <Text style={styles.btnPrimaryText}>
                {hasExisting ? 'Update Goal' : 'Set Goal'}
              </Text>
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
  subtitle: { fontSize: 14, color: colours.textSoft, marginBottom: 24, lineHeight: 20 },
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
    marginBottom: 8,
  },
  hint: { fontSize: 12, color: colours.grey4, marginBottom: 24 },
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