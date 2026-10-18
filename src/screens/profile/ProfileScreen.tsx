import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchProfile, saveProfile, createProfile } from '../../services/profile';
import { colours } from '../../constants/colours';
import { spacing } from '../../constants/spacing';
import { UserProfile } from '../../types/index';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');

  // Create fields
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
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
          Alert.alert('Error', 'Failed to load profile.');
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required.');
      return;
    }
    setSaving(true);
    try {
      await saveProfile({ fullName, username, email, academicLevel });
      setProfile((prev) => prev ? { ...prev, fullName, username, email, academicLevel } : prev);
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    try {
      await saveProfile({ darkMode: value });
      setProfile((prev) => prev ? { ...prev, darkMode: value } : prev);
    } catch (e) {
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    try {
      await saveProfile({ notifications: value });
      setProfile((prev) => prev ? { ...prev, notifications: value } : prev);
    } catch (e) {
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  const handleCreate = async () => {
    if (!newFullName.trim()) {
      Alert.alert('Error', 'Full name is required.');
      return;
    }
    setSaving(true);
    try {
      await createProfile(newFullName.trim(), newUsername.trim(), newEmail.trim(), newAcademicLevel.trim());
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
      Alert.alert('Error', 'Failed to create profile.');
    } finally {
      setSaving(false);
    }
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
        <ActivityIndicator size="large" color={colours.primary} />
      </View>
    );
  }

  // No profile exists yet — show create form
  if (!profile && !creating) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appName}>Profile</Text>
        </View>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCreating(false)}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Profile</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={newFullName} onChangeText={setNewFullName} placeholder="Your full name" placeholderTextColor={colours.grey4} />
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={newUsername} onChangeText={setNewUsername} placeholder="Choose a username" placeholderTextColor={colours.grey4} autoCapitalize="none" />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="you@email.com" placeholderTextColor={colours.grey4} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Academic Level</Text>
          <TextInput style={styles.input} value={newAcademicLevel} onChangeText={setNewAcademicLevel} placeholder="e.g. Third Year" placeholderTextColor={colours.grey4} />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate} disabled={saving}>
            {saving ? <ActivityIndicator color={colours.white} /> : <Text style={styles.btnPrimaryText}>Save Profile</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (editing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Text style={styles.backText}>‹ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={colours.primary} />
              : <Text style={styles.saveText}>Save</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={colours.grey4} />
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor={colours.grey4} autoCapitalize="none" />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor={colours.grey4} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Academic Level</Text>
          <TextInput style={styles.input} value={academicLevel} onChangeText={setAcademicLevel} placeholder="e.g. Third Year" placeholderTextColor={colours.grey4} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Profile</Text>
        <TouchableOpacity onPress={() => setEditing(true)}>
          <Ionicons name="create-outline" size={24} color={colours.primary} />
        </TouchableOpacity>
      </View>

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
            <Text style={styles.profileEmail}>{profile.email}</Text>
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
              value={profile?.darkMode ?? false}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: colours.grey3, true: colours.primary }}
              thumbColor={colours.white}
            />
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch
              value={profile?.notifications ?? false}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colours.grey3, true: colours.primary }}
              thumbColor={colours.white}
            />
          </View>
        </View>

        <Text style={styles.version}>StudyTrack v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
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
  appName: { fontSize: 22, fontWeight: '800', color: colours.primary, letterSpacing: -0.5 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colours.text },
  backText: { fontSize: 16, color: colours.primary, fontWeight: '500', width: 70 },
  saveText: { fontSize: 16, color: colours.primary, fontWeight: '700', width: 70, textAlign: 'right' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.screenPadding },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colours.grey5 },
  emptyText: { fontSize: 14, color: colours.grey4, textAlign: 'center' },
  scroll: { padding: spacing.screenPadding, paddingBottom: 40 },
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
  avatarText: { fontSize: 28, fontWeight: '800', color: colours.white },
  profileName: { fontSize: 20, fontWeight: '800', color: colours.text, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: colours.grey5 },
  section: {
    backgroundColor: colours.white,
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
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colours.grey4,
    marginTop: 16,
  },
});