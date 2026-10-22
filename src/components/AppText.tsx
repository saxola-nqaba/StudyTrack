import React, { createContext, forwardRef, useContext } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  TextProps,
  TextInputProps,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { fontFor } from '../theme/fonts';

// ─────────────────────────────────────────────────────────────
// Drop-in replacements for React Native's Text and TextInput that
// apply the app font. Import them instead of the react-native ones:
//   import { Text, TextInput } from '../../components/AppText';
//
// fontWeight in a style picks the matching font file (700 → Bold).
// Nested <Text> without its own fontWeight inherits from its parent.
// ─────────────────────────────────────────────────────────────

const InsideText = createContext(false);

export const Text = forwardRef<RNText, TextProps>(({ style, children, ...rest }, ref) => {
  const nested = useContext(InsideText);
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const applyFont = !flat.fontFamily && (!nested || flat.fontWeight !== undefined);
  const font = applyFont ? { fontFamily: fontFor(flat.fontWeight), fontWeight: 'normal' as const } : null;

  return (
    <RNText ref={ref} style={[style, font]} {...rest}>
      <InsideText.Provider value={true}>{children}</InsideText.Provider>
    </RNText>
  );
});
Text.displayName = 'AppText';

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({ style, ...rest }, ref) => {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const font = flat.fontFamily ? null : { fontFamily: fontFor(flat.fontWeight), fontWeight: 'normal' as const };
  return <RNTextInput ref={ref} style={[style, font]} {...rest} />;
});
TextInput.displayName = 'AppTextInput';
