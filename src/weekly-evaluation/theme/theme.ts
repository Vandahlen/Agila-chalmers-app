/**
 * theme/theme.ts
 *
 * Centralized design tokens from the Chalmers Studentkår
 * "Grafisk profil" (Kårappen). Every color and type style used in
 * this module is pulled from this file - do not hardcode hex
 * values or font sizes elsewhere.
 */

import { TextStyle } from 'react-native';

export const colors = {
  bla: '#00ACFF', // Primary brand accent, unread indicators, primary buttons
  lila: '#843690',
  rod: '#D8004D',
  mattRod: '#F8686D',
  orange: '#F86600',
  varmGra: '#634C3D',
  gron: '#27AD72',
  turkos: '#7CCDC2',

  // Functional / neutral tokens (not in the source palette table,
  // but required by the button/disabled specs in the profile).
  white: '#FFFFFF',
  black: '#1A1A1A', // dark background used for icon bars / headings in the profile
  disabledBackground: '#E0E0E0',
  disabledText: 'rgba(26, 26, 26, 0.4)',
} as const;

export const fontFamily = {
  regular: 'OpenSans-Regular',
  medium: 'OpenSans-Medium',
  semiBold: 'OpenSans-SemiBold',
  bold: 'OpenSans-Bold',
} as const;

/**
 * Typography scale, matching the profile spec exactly:
 * Titel 30pt, H1 20pt, H2 16pt, Subheading 11pt,
 * Paragraph1 16pt, Paragraph2 13pt, Caption1 12pt, Caption2 10pt, Label 10pt.
 */
export const typography: Record<string, TextStyle> = {
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    color: colors.black,
  },
  heading1: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.black,
  },
  heading2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.black,
  },
  subheading1: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.black,
  },
  paragraph1: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.black,
  },
  paragraph2: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.black,
  },
  caption1: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.black,
  },
  caption2: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.black,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.orange,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  pill: 999,
  card: 12,
  sm: 6,
} as const;

export const theme = { colors, fontFamily, typography, spacing, radii };

export type Theme = typeof theme;
export default theme;
