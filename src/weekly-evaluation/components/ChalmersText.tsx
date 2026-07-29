/**
 * components/ChalmersText.tsx
 *
 * Typography primitive that maps directly onto the profile's
 * named text styles (Titel, Heading 1/2, Paragraph 1/2, etc).
 * Referenced by WeeklyEvaluationScreen and reusable anywhere else
 * in the app that needs on-brand text.
 *
 * Defaults to the current theme's text color (light/dark aware).
 * Variants with a fixed brand color baked in (e.g. `label`) keep
 * that color unless the `color` prop overrides it.
 */

import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { typography } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

export type ChalmersTextVariant = keyof typeof typography;

export interface ChalmersTextProps extends TextProps {
  variant?: ChalmersTextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const ChalmersText: React.FC<ChalmersTextProps> = ({
  variant = 'paragraph1',
  color,
  style,
  children,
  ...rest
}) => {
  const baseStyle = typography[variant];
  const theme = useTheme();
  const resolvedColor = color ?? baseStyle.color ?? theme.text;

  return (
    <Text
      style={[baseStyle, { color: resolvedColor }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default ChalmersText;
