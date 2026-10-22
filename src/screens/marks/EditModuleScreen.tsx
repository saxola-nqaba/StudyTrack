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
import { MarksStackParamList } from '../../navigation/MarksNavigator';
import { updateModule, deleteModule, fetchModules } from '../../services/modules';
import ScreenHeader, { HeaderAction } from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { showError } from '../../utils/errors';
import FormField from '../../components/FormField';
import { validateModule, hasErrors, FieldErrors } from '../../utils/validation';

type Nav = StackNavigationProp<MarksStackParamList, 'EditModule'>;
type Route = RouteProp<MarksStackParamList, 'EditModule'>;

export default function EditModuleScreen() {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { moduleId } = route.params;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<'name'>>({});
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const modules = await fetchModules();
        const module = modules.find((m) => m.id === moduleId);
        if (module) {
          setName(module.name);
          setCode(module.code || '');
          setLevel(module.level || '');
        }
      } catch (e) {
        showError("Couldn't load module", e);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [moduleId]);

  const handleSave = async () => {
    const found = validateModule(name);
    setErrors(found);
    if (hasErrors(found)) return;
    setLoading(true);
    try {
      await updateModule(moduleId, {
        name: name.trim(),
        code: code.trim(),
        level: level.trim(),
      });
      navigation.goBack();
    } catch (e) {
      showError("Couldn't update module", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Module',
      'Deleting this module will also remove all its assessments, its goal and its deadlines. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteModule(moduleId);
              navigation.navigate('Dashboard');
            } catch (e) {
              showError("Couldn't delete module", e);
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
      <ScreenHeader title="Edit Module" onBack={() => navigation.goBack()} right={<HeaderAction label="Delete" destructive loading={deleting} onPress={handleDelete} />} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="Module Name *"
          value={name}
          onChangeText={(v) => { setName(v); setErrors({}); }}
          placeholder="e.g. Mathematics"
          error={errors.name}
        />

        <FormField
          label="Module Code"
          value={code}
          onChangeText={setCode}
          placeholder="e.g. MATH101"
          autoCapitalize="characters"
        />

        <FormField
          label="Level / Year"
          value={level}
          onChangeText={setLevel}
          placeholder="e.g. Third Year"
        />

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