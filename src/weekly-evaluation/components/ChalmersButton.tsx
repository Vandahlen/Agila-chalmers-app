/**
 * components/ChalmersButton.tsx
 *
 * Button primitive implementing the three button states from the
 * profile: Primärknapp (filled pill), Sekundärknapp (text link),
 * and Disable (muted, reduced-opacity).
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import ChalmersText from './ChalmersText';
import { colors, radii, spacing } from '../theme/theme';

export type ChalmersButtonVariant = 'primary' | 'secondary';

export interface ChalmersButtonProps {
  label: string;
  onPress: () => void;
  variant?: ChalmersButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ChalmersButton: React.FC<ChalmersButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={styles.secondaryContainer}
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        <ChalmersText
          variant="paragraph1"
          color={isDisabled ? colors.disabledText : colors.bla}
        >
          {label}
        </ChalmersText>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.primaryContainer,
        isDisabled && styles.primaryDisabled,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <ChalmersText
          variant="paragraph1"
          color={isDisabled ? colors.disabledText : colors.white}
          style={styles.primaryLabel}
        >
          {label}
        </ChalmersText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  primaryContainer: {
    backgroundColor: colors.bla,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: {
    backgroundColor: colors.disabledBackground,
  },
  primaryLabel: {
    fontWeight: '600',
  },
  secondaryContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChalmersButton;
