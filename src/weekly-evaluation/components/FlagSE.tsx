// src/weekly-evaluation/components/FlagSE.tsx
/**
 * components/FlagSE.tsx
 *
 * Simplified Swedish flag icon for the language toggle - see
 * FlagUK.tsx for context. Fixed national-flag colors - not
 * theme-tinted.
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export interface FlagIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const FlagSE: React.FC<FlagIconProps> = ({ size = 20, style }) => (
  <Svg width={size * 1.4} height={size} viewBox="0 0 28 20" style={style}>
    <Rect x="0" y="0" width="28" height="20" fill="#006AA7" />
    <Rect x="10" y="0" width="4" height="20" fill="#FECC00" />
    <Rect x="0" y="8" width="28" height="4" fill="#FECC00" />
  </Svg>
);

export default FlagSE;
