// ─────────────────────────────────────────────────────────────
// StudyTrack colour palettes
//
// Every screen reads colours from useTheme() — never import a
// palette directly into a screen, or it won't switch with dark mode.
//
// Key meanings:
//   primary    → filled brand backgrounds (buttons, FAB, hero cards)
//   accent     → brand-coloured TEXT and ICONS (links, Back, titles)
//   onPrimary  → text/icons sitting on top of a primary background
//   card       → surfaces (cards, headers, inputs, tab bar)
//   background → screen background behind the cards
//   grey2      → progress-bar tracks, row dividers
//   grey3      → borders, empty-state icons
//   grey4      → placeholders, muted icons
//   grey5      → secondary text
// ─────────────────────────────────────────────────────────────

export interface Palette {
  primary: string;
  primaryLight: string;
  primaryPale: string;
  accent: string;
  onPrimary: string;

  success: string;
  successPale: string;
  warning: string;
  warningPale: string;
  orange: string;
  orangePale: string;
  danger: string;
  dangerPale: string;

  background: string;
  card: string;

  grey1: string;
  grey2: string;
  grey3: string;
  grey4: string;
  grey5: string;
  grey6: string;

  text: string;
  textSoft: string;

  overdueBg: string;
  overdueBorder: string;
  goldBg: string;
  goldText: string;
}

export const lightColours: Palette = {
  primary: '#1A5276',
  primaryLight: '#2471A3',
  primaryPale: '#D6EAF8',
  accent: '#1A5276',
  onPrimary: '#FFFFFF',

  success: '#1E8449',
  successPale: '#D5F5E3',
  warning: '#B7770D',
  warningPale: '#FEF9E7',
  orange: '#CA6F1E',
  orangePale: '#FDEBD0',
  danger: '#C0392B',
  dangerPale: '#FADBD8',

  background: '#F1F3F5',
  card: '#FFFFFF',

  grey1: '#F8F9FA',
  grey2: '#F1F3F5',
  grey3: '#DEE2E6',
  grey4: '#ADB5BD',
  grey5: '#6C757D',
  grey6: '#343A40',

  text: '#1C2833',
  textSoft: '#5D6D7E',

  overdueBg: '#FFF5F5',
  overdueBorder: '#F5C6CB',
  goldBg: '#FEF3C7',
  goldText: '#B45309',
};

export const darkColours: Palette = {
  primary: '#2471A3',
  primaryLight: '#5DADE2',
  primaryPale: '#17293A',
  accent: '#5DADE2',
  onPrimary: '#FFFFFF',

  success: '#2ECC71',
  successPale: '#163222',
  warning: '#F0B429',
  warningPale: '#352A10',
  orange: '#EB8C3A',
  orangePale: '#3A2614',
  danger: '#EC7063',
  dangerPale: '#3A1C19',

  background: '#121212',
  card: '#1E1E1E',

  grey1: '#1A1A1A',
  grey2: '#2A2A2A',
  grey3: '#3A3A3A',
  grey4: '#7D848A',
  grey5: '#A0A7AD',
  grey6: '#D0D4D8',

  text: '#E6E8EA',
  textSoft: '#A9B4BE',

  overdueBg: '#2A1717',
  overdueBorder: '#5C2B2B',
  goldBg: '#3A2E12',
  goldText: '#F5B041',
};

// Kept so any old import still compiles — prefer useTheme() in screens.
export const colours = lightColours;
