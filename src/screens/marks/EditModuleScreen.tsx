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
import { updateModule, deleteModule, fetchModules } from '../../services/modules';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';

type Nav = NativeStackNavigationProp<MarksStackParamList, 'EditModule'>;
type Route = RouteProp<MarksStackParamList, 'EditModule'>;

export default function EditModuleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { moduleId } = route.params;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(false);
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
        Alert.alert('Error', 'Failed to load module.');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [moduleId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Module name is required.');
      return;
    }
    setLoading(true);
    try {
      await updateModule(moduleId, {
        name: name.trim(),
        code: code.trim(),
        level: level.trim(),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to update module.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Module',
      'Deleting this module will also remove all its assessments and goal. This cannot be undone.',
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
              Alert.alert('Error', 'Failed to delete module.');
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
        <Text style={styles.headerTitle}>Edit Module</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          {deleting
            ? <ActivityIndicator size="small" color={colours.danger} />
            : <Text style={styles.deleteText}>Delete</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Module Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Mathematics"
          placeholderTextColor={colours.grey4}
        />

        <Text style={styles.label}>Module Code</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="e.g. MATH101"
          placeholderTextColor={colours.grey4}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Level / Year</Text>
        <TextInput
          style={styles.input}
          value={level}
          onChangeText={setLevel}
          placeholder="e.g. Third Year"
          placeholderTextColor={colours.grey4}
        />

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