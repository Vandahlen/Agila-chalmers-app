/**
 * components/EvaluationIntroCard.tsx
 *
 * Shown immediately after a student taps the evaluation
 * notification. Briefly explains the weekly survey and gives a
 * single Primärknapp CTA to begin.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import ChalmersText from './ChalmersText';
import ChalmersButton from './ChalmersButton';
import { colors, spacing, radii } from '../theme/theme';

export interface EvaluationIntroCardProps {
  onStart: () => void;
  /** Optional override, defaults to the standard weekly-check-in copy. */
  description?: string;
}

const DEFAULT_DESCRIPTION =
  'Once a week we ask a few quick questions about how your studies are going. ' +
  'It takes about a minute, your answers are anonymous, and they help the ' +
  'student union spot problems early.';

const EvaluationIntroCard: React.FC<EvaluationIntroCardProps> = ({
  onStart,
  description = DEFAULT_DESCRIPTION,
}) => {
  return (
    <View style={styles.card}>
      <ChalmersText variant="heading1" style={styles.title}>
        Weekly study check-in
      </ChalmersText>

      <ChalmersText
        variant="paragraph1"
        color={colors.varmGra}
        style={styles.description}
      >
        {description}
      </ChalmersText>

      <View style={styles.anonymityBadge}>
        <ChalmersText variant="caption1" color={colors.gron}>
          Fully anonymous · no ID attached
        </ChalmersText>
      </View>

      <ChalmersButton
        label="Start Evaluation"
        onPress={onStart}
        variant="primary"
        style={styles.startButton}
        testID="evaluation-intro-start-button"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  description: {
    lineHeight: 22,
  },
  anonymityBadge: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
    backgroundColor: '#EAF9F1',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  startButton: {
    alignSelf: 'stretch',
  },
});

export default EvaluationIntroCard;
