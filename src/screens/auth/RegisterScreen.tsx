import React, { useState, useMemo } from 'react';
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
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { registerUser } from '../../services/auth';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerUser(email.trim(), password, fullName.trim(), username.trim(), academicLevel.trim());
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.appName}>StudyTrack</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={colours.grey4}
          />

          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="Choose a username"
            placeholderTextColor={colours.grey4}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@email.com"
            placeholderTextColor={colours.grey4}
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Min. 6 characters"
            placeholderTextColor={colours.grey4}
          />

          <Text style={styles.label}>Academic Level</Text>
          <TextInput
            style={styles.input}
            value={academicLevel}
            onChangeText={setAcademicLevel}
            placeholder="e.g. Third Year"
            placeholderTextColor={colours.grey4}
          />

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colours.onPrimary} />
              : <Text style={styles.btnPrimaryText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnSecondaryText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colours.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.screenPadding },
  header: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 36, fontWeight: '800', color: colours.accent, letterSpacing: -1 },
  tagline: { fontSize: 14, color: colours.textSoft, marginTop: 6 },
  form: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colours.textSoft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: {
    backgroundColor: colours.card,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    borderRadius: spacing.borderRadius,
    padding: 13,
    fontSize: 15,
    color: colours.text,
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: colours.primary,
    borderRadius: spacing.borderRadius,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: colours.onPrimary, fontSize: 15, fontWeight: '700' },
  btnSecondary: { alignItems: 'center', padding: 12, marginTop: 4 },
  btnSecondaryText: { color: colours.accent, fontSize: 14, fontWeight: '500' },
});