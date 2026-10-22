import React, { ReactNode, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../constants/colours';
import { spacing } from '../constants/spacing';

// ─────────────────────────────────────────────────────────────
// One header for every screen, so spacing and buttons always match.
//
//  Tab screens:   <ScreenHeader title="Goals" />
//                 → large brand title on the left
//
//  Inner screens: <ScreenHeader title="Edit Module" onBack={...}
//                   right={<HeaderAction label="Delete" destructive onPress={...} />} />
//                 → ‹ Back · centred title · optional action
// ─────────────────────────────────────────────────────────────

interface HeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
}

export default function ScreenHeader({ title, onBack, backLabel = 'Back', right }: HeaderProps) {
  const { colours } = useTheme();
  const styles = useMemo(() => makeStyles(colours), [colours]);
  const insets = useSafeAreaInsets();
  const isInner = !!onBack;

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      {isInner ? (
        <>
          <TouchableOpacity
            onPress={onBack}
            style={styles.side}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
          >
            <View style={styles.backRow}>
              <Ionicons name="chevron-back" size={20} color={colours.accent} />
              <Text style={styles.backText}>{backLabel}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.innerTitle} numberOfLines={1}>{title}</Text>
          <View style={[styles.side, styles.sideRight]}>{right}</View>
        </>
      ) : (
        <>
          <Text style={styles.tabTitle} numberOfLines={1} accessibilityRole="header">{title}</Text>
          {right ? <View>{right}</View> : null}
        </>
      )}
    </View>
  );
}

interface ActionProps {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export function HeaderAction({ label, onPress, destructive, loading, disabled }: ActionProps) {
  const { colours } = useTheme();
  const colour = destructive ? colours.danger : colours.accent;

  if (loading) return <ActivityIndicator size="small" color={colour} />;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color: colour, opacity: disabled ? 0.5 : 1 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colours: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: 12,
      minHeight: 44,
      backgroundColor: colours.card,
      borderBottomWidth: 1,
      borderBottomColor: colours.grey3,
    },
    tabTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: colours.accent, letterSpacing: -0.5 },
    side: { width: 80, justifyContent: 'center' },
    sideRight: { alignItems: 'flex-end' },
    backRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -6 },
    backText: { fontSize: 16, color: colours.accent, fontWeight: '500' },
    innerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colours.text },
  });
