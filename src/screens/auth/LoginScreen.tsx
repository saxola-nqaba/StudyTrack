import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../components/AppText';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { loginUser } from '../../services/auth';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import FormField from '../../components/FormField';
import AppIcon from '../../components/AppIcon';
import { showError } from '../../utils/errors';
import { validateLogin, hasErrors, FieldErrors, LoginField } from '../../utils/validation';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<LoginField>>({});

  const clearError = (field: LoginField) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleLogin = async () => {
    const found = validateLogin(email, password);
    setErrors(found);
    if (hasErrors(found)) return;

    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      // No navigation needed: AppNavigator switches to the tabs when the user signs in
    } catch (e) {
      showError("Couldn't sign in", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <AppIcon name="marks" size={72} />
          <Text style={styles.appName}>StudyTrack</Text>
          <Text style={styles.tagline}>Know exactly where you stand, and what you need.</Text>
        </View>

        <FormField
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); clearError('email'); }}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
        />
        <FormField
          label="Password"
          value={password}
          onChangeText={(v) => { setPassword(v); clearError('password'); }}
          placeholder="Your password"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          error={errors.password}
          containerStyle={{ marginBottom: 8 }}
        />

        <TouchableOpacity
          style={styles.forgot}
          onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() })}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading} accessibilityRole="button">
          {loading
            ? <ActivityIndicator color={colours.onPrimary} />
            : <Text style={styles.btnPrimaryText}>Sign in</Text>}
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>New to StudyTrack?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} accessibilityRole="button">
            <Text style={styles.linkText}> Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colours.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.screenPadding },
  brand: { alignItems: 'center', marginBottom: 36, gap: 8 },
  appName: { fontSize: 32, fontWeight: '800', color: colours.accent, letterSpacing: -0.8, marginTop: 4 },
  tagline: { fontSize: 14, color: colours.textSoft, textAlign: 'center' },
  forgot: { alignSelf: 'flex-end', paddingVertical: 6, marginBottom: 16 },
  linkText: { color: colours.accent, fontSize: 14, fontWeight: '600' },
  btnPrimary: {
    backgroundColor: colours.primary,
    borderRadius: spacing.borderRadius,
    padding: 15,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colours.onPrimary, fontSize: 15, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  switchText: { color: colours.textSoft, fontSize: 14 },
});
