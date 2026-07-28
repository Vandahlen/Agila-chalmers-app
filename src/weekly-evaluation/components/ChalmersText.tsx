/**
 * components/ChalmersText.tsx
 *
 * Typography primitive that maps directly onto the profile's
 * named text styles (Titel, Heading 1/2, Paragraph 1/2, etc).
 * Referenced by WeeklyEvaluationScreen and reusable anywhere else
 * in the app that needs on-brand text.
 */

import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { typography } from '../theme/theme';

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

  return (
    <Text
      style={[baseStyle, color ? { color } : null, style]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default ChalmersText;
