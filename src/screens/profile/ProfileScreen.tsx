import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput } from '../../components/AppText';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchProfile, saveProfile, createProfile } from '../../services/profile';
import { signOut, currentUserEmail } from '../../services/auth';
import ScreenHeader, { HeaderAction } from '../../components/ScreenHeader';
import { useTheme } from '../../theme/ThemeContext';
import { Palette } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { showError } from '../../utils/errors';
import FormField from '../../components/FormField';
import { validateProfile, hasErrors, FieldErrors, ProfileField } from '../../utils/validation';
import { UserProfile } from '../../types/index';

export default function ProfileScreen() {
  const { colours, isDark, setDarkMode } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<ProfileField>>({});

  const clearError = (field: ProfileField) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');

  // Create fields
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newAcademicLevel, setNewAcademicLevel] = useState('');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const p = await fetchProfile();
          setProfile(p);
          if (p) {
            setFullName(p.fullName || '');
            setUsername(p.username || '');
            setEmail(p.email || '');
            setAcademicLevel(p.academicLevel || '');
          }
        } catch (e) {
          showError("Couldn't load profile", e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const handleSave = async () => {
    const found = validateProfile(fullName, email);
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    try {
      const clean = {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        academicLevel: academicLevel.trim(),
      };
      await saveProfile(clean);
      setProfile((prev) => prev ? { ...prev, ...clean } : prev);
      setEditing(false);
    } catch (e) {
      showError("Couldn't save profile", e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    // Switch the theme instantly (and save on the phone), then sync to Firestore
    setDarkMode(value);
    setProfile((prev) => prev ? { ...prev, darkMode: value } : prev);
    try {
      await saveProfile({ darkMode: value });
    } catch (e) {
      // Theme still applies on this phone — only the cloud copy failed
      Alert.alert('Sync issue', 'Dark mode was applied, but could not be saved to your profile.');
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    // Flip the switch instantly, roll back if Firestore fails
    setProfile((prev) => prev ? { ...prev, notifications: value } : prev);
    try {
      await saveProfile({ notifications: value });
    } catch (e) {
      setProfile((prev) => prev ? { ...prev, notifications: !value } : prev);
      showError("Couldn't update setting", e);
    }
  };

  const handleCreate = async () => {
    const found = validateProfile(newFullName, '');
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    try {
      await createProfile(newFullName.trim(), newUsername.trim(), currentUserEmail(), newAcademicLevel.trim());
      const p = await fetchProfile();
      setProfile(p);
      if (p) {
        setFullName(p.fullName || '');
        setUsername(p.username || '');
        setEmail(p.email || '');
        setAcademicLevel(p.academicLevel || '');
      }
      setCreating(false);
    } catch (e) {
      showError("Couldn't create profile", e);
    } finally {
      setSaving(false);
    }
  };

  // Cancel throws away unsaved edits, so reopening Edit shows the saved values
  const handleCancelEdit = () => {
    setFullName(profile?.fullName || '');
    setUsername(profile?.username || '');
    setEmail(profile?.email || '');
    setAcademicLevel(profile?.academicLevel || '');
    setErrors({});
    setEditing(false);
  };

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You can sign back in any time with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut(); // AppNavigator switches back to the Login screen
          } catch (e) {
            showError("Couldn't sign out", e);
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colours.accent} />
      </View>
    );
  }

  // No profile exists yet — show create form
  if (!profile && !creating) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Ionicons name="person-circle-outline" size={64} color={colours.grey3} />
          <Text style={styles.emptyTitle}>No profile yet</Text>
          <Text style={styles.emptyText}>Set up your profile to personalise StudyTrack</Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => setCreating(true)}
          >
            <Text style={styles.btnPrimaryText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (creating) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScreenHeader title="Create Profile" onBack={() => { setCreating(false); setErrors({}); }} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormField label="Full Name *" value={newFullName} onChangeText={(v) => { setNewFullName(v); clearError('fullName'); }} placeholder="Your full name" error={errors.fullName} />
          <FormField label="Username" value={newUsername} onChangeText={setNewUsername} placeholder="Choose a username" autoCapitalize="none" />
          <FormField label="Email" value={currentUserEmail()} editable={false} hint="Your sign-in email" />
          <FormField label="Academic Level" value={newAcademicLevel} onChangeText={setNewAcademicLevel} placeholder="e.g. Third Year" />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate} disabled={saving}>
            {saving ? <ActivityIndicator color={colours.onPrimary} /> : <Text style={styles.btnPrimaryText}>Save Profile</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (editing) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScreenHeader
          title="Edit Profile"
          onBack={handleCancelEdit}
          backLabel="Cancel"
          right={<HeaderAction label="Save" loading={saving} onPress={handleSave} />}
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormField label="Full Name *" value={fullName} onChangeText={(v) => { setFullName(v); clearError('fullName'); }} placeholder="Your full name" error={errors.fullName} />
          <FormField label="Username" value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" />
          <FormField label="Email" value={currentUserEmail()} editable={false} hint="Your sign-in email can't be changed here" />
          <FormField label="Academic Level" value={academicLevel} onChangeText={setAcademicLevel} placeholder="e.g. Third Year" />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Profile"
        onBack={() => navigation.goBack()}
        right={<HeaderAction label="Edit" onPress={() => setEditing(true)} />}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.fullName || 'U')}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.fullName}</Text>
          {profile?.email ? (
            <Text style={styles.profileEmail}>{profile.email || currentUserEmail()}</Text>
          ) : null}
        </View>

        {/* Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Username</Text>
            <Text style={styles.rowValue}>{profile?.username || '—'}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Academic Level</Text>
            <Text style={styles.rowValue}>{profile?.academicLevel || '—'}</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: colours.grey3, true: colours.primary }}
              thumbColor={colours.onPrimary}
            />
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch
              value={profile?.notifications ?? false}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colours.grey3, true: colours.primary }}
              thumbColor={colours.onPrimary}
            />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
        >
          {signingOut
            ? <ActivityIndicator color={colours.danger} />
            : (
              <View style={styles.signOutRow}>
                <Ionicons name="log-out-outline" size={18} color={colours.danger} />
                <Text style={styles.signOutText}>Sign out</Text>
              </View>
            )}
        </TouchableOpacity>

        <Text style={styles.version}>StudyTrack v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colours: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.screenPadding },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 14, color: colours.grey4, textAlign: 'center' },
  scroll: { padding: spacing.screenPadding, paddingBottom: 16 },
  content: { padding: spacing.screenPadding, paddingTop: 24 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colours.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colours.onPrimary },
  profileName: { fontSize: 20, fontWeight: '800', color: colours.text, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: colours.grey5 },
  section: {
    backgroundColor: colours.card,
    borderRadius: spacing.borderRadius,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  rowLabel: { fontSize: 15, fontWeight: '500', color: colours.text },
  rowValue: { fontSize: 15, color: colours.grey5 },
  rowDivider: { height: 1, backgroundColor: colours.grey2, marginHorizontal: 16 },
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
  signOutBtn: {
    backgroundColor: colours.card,
    borderRadius: spacing.borderRadius,
    borderWidth: 1.5,
    borderColor: colours.grey3,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  signOutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signOutText: { color: colours.danger, fontSize: 15, fontWeight: '600' },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colours.grey4,
    marginTop: 16,
  },
});