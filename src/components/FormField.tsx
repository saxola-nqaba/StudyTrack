import React, { forwardRef, useMemo } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../constants/colours';
import { spacing } from '../constants/spacing';

// ─────────────────────────────────────────────────────────────
// Label + input + inline error, themed.
// Pass `error` to turn the border red and show the message under
// the field. Pass `hint` for grey helper text when there's no error.
// ─────────────────────────────────────────────────────────────

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const FormField = forwardRef<TextInput, Props>(
  ({ label, error, hint, containerStyle, style, ...inputProps }, ref) => {
    const { colours, isDark } = useTheme();
    const styles = useMemo(() => makeStyles(colours), [colours]);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
          ref={ref}
          style={[styles.input, error ? styles.inputError : null, style]}
          placeholderTextColor={colours.grey4}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          accessibilityLabel={label}
          accessibilityHint={error}
          {...inputProps}
        />
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={13} color={colours.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
      </View>
    );
  }
);

export default FormField;

const makeStyles = (colours: Palette) =>
  StyleSheet.create({
    container: { marginBottom: 16 },
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
    },
    inputError: {
      borderColor: colours.danger,
      backgroundColor: colours.dangerPale,
    },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    errorText: { flex: 1, fontSize: 12, color: colours.danger, fontWeight: '500' },
    hint: { fontSize: 12, color: colours.grey4, marginTop: 6 },
  });
