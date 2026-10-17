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
import { GoalsStackParamList } from '../../navigation/GoalsNavigator';
import { fetchGoal, setGoal, deleteGoal } from '../../services/goals';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';

type Nav = NativeStackNavigationProp<GoalsStackParamList, 'EditGoal'>;
type Route = RouteProp<GoalsStackParamList, 'EditGoal'>;

export default function EditGoalScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { moduleId, moduleName } = route.params;

  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
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
        Alert.alert('Error', 'Failed to load goal.');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [moduleId]);

  const handleSave = async () => {
    const targetNum = parseFloat(target);
    if (isNaN(targetNum) || targetNum <= 0 || targetNum > 100) {
      Alert.alert('Error', 'Please enter a valid target between 1 and 100.');
      return;
    }
    setLoading(true);
    try {
      await setGoal(moduleId, targetNum);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save goal.');
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
              Alert.alert('Error', 'Failed to remove goal.');
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
        <Text style={styles.headerTitle} numberOfLines={1}>{moduleName}</Text>
        {hasExisting ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            {deleting
              ? <ActivityIndicator size="small" color={colours.danger} />
              : <Text style={styles.deleteText}>Remove</Text>
            }
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          {hasExisting ? 'Update your target percentage for this module.' : 'Set a target percentage for this module.'}
        </Text>

        <Text style={styles.label}>Target Percentage *</Text>
        <TextInput
          style={styles.input}
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
          placeholder="e.g. 75"
          placeholderTextColor={colours.grey4}
        />

        <Text style={styles.hint}>Enter a value between 1 and 100.</Text>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colours.white} />
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: colours.text, flex: 1, textAlign: 'center' },
  deleteBtn: { width: 60, alignItems: 'flex-end' },
  deleteText: { fontSize: 15, color: colours.danger, fontWeight: '600' },
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
    backgroundColor: colours.white,
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