import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Custom Canva icons. Each name has three files in assets/icons:
//   name.png (64px) · name@2x.png (128px) · name@3x.png (192px)
// React Native picks the sharpest one for the phone automatically.
//
// To swap an icon later: replace those three PNGs, keep the names.
// ─────────────────────────────────────────────────────────────

const ICONS = {
  marks: require('../../assets/icons/marks.png'),
  goals: require('../../assets/icons/goals.png'),
  deadlines: require('../../assets/icons/deadlines.png'),
  insights: require('../../assets/icons/insights.png'),
  document: require('../../assets/icons/document.png'),
  trophy: require('../../assets/icons/trophy.png'),
  calendar: require('../../assets/icons/calendar.png'),
  bulb: require('../../assets/icons/bulb.png'),
  warning: require('../../assets/icons/warning.png'),
  info: require('../../assets/icons/info.png'),
  clock: require('../../assets/icons/clock.png'),
} as const;

export type AppIconName = keyof typeof ICONS;

interface Props {
  name: AppIconName;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export default function AppIcon({ name, size = 24, style }: Props) {
  return (
    <Image
      source={ICONS[name]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
