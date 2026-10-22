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
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { resetPassword } from '../../services/auth';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import ScreenHeader from '../../components/ScreenHeader';
import FormField from '../../components/FormField';
import { showError } from '../../utils/errors';
import { validateEmailOnly, hasErrors, FieldErrors } from '../../utils/validation';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
  route: RouteProp<AuthStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);

  // Pre-fill whatever was typed on the login screen
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<'email'>>({});

  const handleSend = async () => {
    const found = validateEmailOnly(email);
    setErrors(found);
    if (hasErrors(found)) return;

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e) {
      showError("Couldn't send the reset email", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenHeader title="Reset password" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {sent ? (
          <View style={styles.sent}>
            <Ionicons name="mail-open-outline" size={48} color={colours.accent} />
            <Text style={styles.sentTitle}>Check your email</Text>
            <Text style={styles.sentText}>
              If an account exists for {email.trim()}, a link to reset your password is on its way.
              It can take a few minutes, so check your spam folder too.
            </Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.goBack()} accessibilityRole="button">
              <Text style={styles.btnPrimaryText}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.intro}>
              Enter the email you signed up with and we'll send you a link to choose a new password.
            </Text>
            <FormField
              label="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors({}); }}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={errors.email}
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSend} disabled={loading} accessibilityRole="button">
              {loading
                ? <ActivityIndicator color={colours.onPrimary} />
                : <Text style={styles.btnPrimaryText}>Send reset link</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colours.background },
  content: { padding: spacing.screenPadding, paddingTop: 20 },
  intro: { fontSize: 14, color: colours.textSoft, lineHeight: 20, marginBottom: 20 },
  btnPrimary: {
    backgroundColor: colours.primary,
    borderRadius: spacing.borderRadius,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'stretch',
  },
  btnPrimaryText: { color: colours.onPrimary, fontSize: 15, fontWeight: '700' },
  sent: { alignItems: 'center', gap: 10, paddingTop: 24 },
  sentTitle: { fontSize: 18, fontWeight: '700', color: colours.text },
  sentText: { fontSize: 14, color: colours.textSoft, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
});
