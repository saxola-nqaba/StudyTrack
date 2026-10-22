import React, { useState, useMemo } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  View,
} from 'react-native';
import { Text } from '../../components/AppText';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { registerUser } from '../../services/auth';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import ScreenHeader from '../../components/ScreenHeader';
import FormField from '../../components/FormField';
import { showError } from '../../utils/errors';
import { validateRegister, hasErrors, FieldErrors, RegisterField } from '../../utils/validation';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<RegisterField>>({});

  const clearError = (field: RegisterField) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleRegister = async () => {
    const found = validateRegister(fullName, email, password, confirm);
    setErrors(found);
    if (hasErrors(found)) return;

    setLoading(true);
    try {
      await registerUser(email.trim(), password, fullName.trim(), username.trim(), academicLevel.trim());
      // AppNavigator switches to the tabs as soon as the account exists
    } catch (e) {
      showError("Couldn't create your account", e);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenHeader title="Create account" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Track your marks, set goals and see what you need to reach them.</Text>

        <FormField
          label="Full name *"
          value={fullName}
          onChangeText={(v) => { setFullName(v); clearError('fullName'); }}
          placeholder="Your full name"
          autoComplete="name"
          textContentType="name"
          error={errors.fullName}
        />
        <FormField
          label="Email *"
          value={email}
          onChangeText={(v) => { setEmail(v); clearError('email'); }}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
        />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <FormField
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Optional"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.rowItem}>
            <FormField
              label="Academic level"
              value={academicLevel}
              onChangeText={setAcademicLevel}
              placeholder="e.g. Third Year"
            />
          </View>
        </View>
        <FormField
          label="Password *"
          value={password}
          onChangeText={(v) => { setPassword(v); clearError('password'); }}
          placeholder="At least 6 characters"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.password}
        />
        <FormField
          label="Confirm password *"
          value={confirm}
          onChangeText={(v) => { setConfirm(v); clearError('confirm'); }}
          placeholder="Type it again"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.confirm}
        />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading} accessibilityRole="button">
          {loading
            ? <ActivityIndicator color={colours.onPrimary} />
            : <Text style={styles.btnPrimaryText}>Create account</Text>}
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.linkText}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colours.background },
  content: { padding: spacing.screenPadding, paddingTop: 20, paddingBottom: 40 },
  intro: { fontSize: 14, color: colours.textSoft, lineHeight: 20, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  btnPrimary: {
    backgroundColor: colours.primary,
    borderRadius: spacing.borderRadius,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: colours.onPrimary, fontSize: 15, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  switchText: { color: colours.textSoft, fontSize: 14 },
  linkText: { color: colours.accent, fontSize: 14, fontWeight: '600' },
});
