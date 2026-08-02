/**
 * components/EvaluationIntroCard.tsx
 *
 * Shown immediately after a student taps the evaluation
 * notification. Briefly explains the weekly survey and gives a
 * single Primärknapp CTA to begin.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChalmersText, ChalmersButton, colors, spacing, radii, useTheme } from 'kar-ui-kit';
import { useI18n } from '../i18n/I18nContext';

export interface EvaluationIntroCardProps {
  onStart: () => void;
  /** Optional override, defaults to the standard weekly-check-in copy. */
  description?: string;
}

const EvaluationIntroCard: React.FC<EvaluationIntroCardProps> = ({
  onStart,
  description,
}) => {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <ChalmersText variant="heading1" style={styles.title}>
        {t.introTitle}
      </ChalmersText>

      <ChalmersText
        variant="paragraph1"
        color={theme.subText}
        style={styles.description}
      >
        {description ?? t.introDescriptionDefault}
      </ChalmersText>

      <View style={[styles.anonymityBadge, { backgroundColor: theme.badgeBg }]}>
        <ChalmersText variant="caption1" color={colors.gron}>
          {t.introBadge}
        </ChalmersText>
      </View>

      <ChalmersButton
        label={t.introStartButton}
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  startButton: {
    alignSelf: 'stretch',
  },
});

export default EvaluationIntroCard;
