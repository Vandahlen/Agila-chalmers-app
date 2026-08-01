// src/weekly-evaluation/components/FlagUK.tsx
/**
 * components/FlagUK.tsx
 *
 * Simplified UK flag icon for the language toggle, matching the
 * Kårappen graphic profile's "Språk" icon concept (hand-authored -
 * the profile PDF is a raster mockup screenshot, not exported vector
 * source). Fixed national-flag colors - not theme-tinted.
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

export interface FlagIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const FlagUK: React.FC<FlagIconProps> = ({ size = 20, style }) => (
  <Svg width={size * 1.4} height={size} viewBox="0 0 28 20" style={style}>
    <Rect x="0" y="0" width="28" height="20" fill="#00247D" />
    <Line x1="0" y1="0" x2="28" y2="20" stroke="#FFFFFF" strokeWidth={4} />
    <Line x1="28" y1="0" x2="0" y2="20" stroke="#FFFFFF" strokeWidth={4} />
    <Line x1="0" y1="0" x2="28" y2="20" stroke="#CF142B" strokeWidth={2} />
    <Line x1="28" y1="0" x2="0" y2="20" stroke="#CF142B" strokeWidth={2} />
    <Line x1="14" y1="0" x2="14" y2="20" stroke="#FFFFFF" strokeWidth={6} />
    <Line x1="0" y1="10" x2="28" y2="10" stroke="#FFFFFF" strokeWidth={6} />
    <Line x1="14" y1="0" x2="14" y2="20" stroke="#CF142B" strokeWidth={3} />
    <Line x1="0" y1="10" x2="28" y2="10" stroke="#CF142B" strokeWidth={3} />
  </Svg>
);

export default FlagUK;
