/**
 * screens/WeeklyEvaluationScreen.tsx
 *
 * Step-by-step weekly study-situation survey. Fully decoupled from
 * Supabase - it only talks to the injected IEvaluationRepository,
 * so the data source can be swapped (e.g. for tests or a future
 * backend) without touching this file.
 *
 * All state and business logic live in useWeeklyEvaluation - this
 * component only renders what the hook exposes.
 *
 * On successful submission it calls `onEvaluationFinished`, which
 * the host app uses to delete/hide the originating notification.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Vibration } from 'react-native';
import ChalmersText from '../components/ChalmersText';
import ChalmersButton from '../components/ChalmersButton';
import QuestionInput from '../components/QuestionInput';
import { colors, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { IEvaluationRepository } from '../types/evaluation';
import { useWeeklyEvaluation, StudentContext } from '../hooks/useWeeklyEvaluation';

export type { StudentContext };

export interface WeeklyEvaluationScreenProps {
  repository: IEvaluationRepository;
  notificationId: string;
  studentContext: StudentContext;
  /** Called after a successful submit; host app removes the notification here. */
  onEvaluationFinished: (notificationId: string) => void;
  /** Optional, e.g. for a back/close affordance from the host navigator. */
  onCancel?: () => void;
}

const SUBMIT_HAPTIC_MS = 20;

const WeeklyEvaluationScreen: React.FC<WeeklyEvaluationScreenProps> = ({
  repository,
  notificationId,
  studentContext,
  onEvaluationFinished,
  onCancel,
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  const {
    loadState,
    questions,
    currentStep,
    currentQuestion,
    isLastStep,
    currentAnswer,
    canProceed,
    currentStepNumber,
    totalSteps,
    progressRatio,
    submitState,
    setAnswer,
    goNext,
    goBack,
    reload,
  } = useWeeklyEvaluation({
    repository,
    notificationId,
    studentContext,
    onEvaluationFinished,
  });

  const handleGoNext = () => {
    if (isLastStep) {
      Vibration.vibrate(SUBMIT_HAPTIC_MS);
    }
    goNext();
  };

  if (loadState === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={colors.bla} size="large" />
      </View>
    );
  }

  if (loadState === 'error') {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ChalmersText variant="paragraph1" color={colors.rod}>
          {t.surveyLoadError}
        </ChalmersText>
        <ChalmersButton
          label={t.surveyTryAgain}
          onPress={reload}
          variant="secondary"
          style={styles.retryButton}
        />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ChalmersText variant="paragraph1" color={theme.subText}>
          {t.surveyEmpty}
        </ChalmersText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <ChalmersText variant="subheading1" color={theme.subText}>
        {t.surveyProgress(currentStepNumber, totalSteps)}
      </ChalmersText>

      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View
          style={[styles.progressFill, { width: `${progressRatio * 100}%` }]}
        />
      </View>

      <ChalmersText variant="heading1" style={styles.questionText}>
        {currentQuestion.question_text}
      </ChalmersText>

      {currentQuestion.helper_text && (
        <ChalmersText
          variant="paragraph2"
          color={theme.subText}
          style={styles.helperText}
        >
          {currentQuestion.helper_text}
        </ChalmersText>
      )}

      <QuestionInput
        question={currentQuestion}
        value={currentAnswer?.answer_value}
        onChange={(value) => setAnswer(currentQuestion.id, value)}
      />

      {submitState === 'error' && (
        <ChalmersText variant="caption1" color={colors.rod} style={styles.submitError}>
          {t.surveySubmitError}
        </ChalmersText>
      )}

      <View style={styles.footer}>
        <ChalmersButton
          label={`${currentStep === 0 ? '✕' : '←'} ${t.surveyBack}`}
          onPress={() => goBack(onCancel)}
          variant="secondary"
        />
        <ChalmersButton
          label={isLastStep ? t.surveySubmit : t.surveyNext}
          onPress={handleGoNext}
          variant="primary"
          disabled={!canProceed}
          loading={submitState === 'submitting'}
          style={styles.nextButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.bla,
  },
  questionText: {
    marginBottom: spacing.xs,
  },
  helperText: {
    marginBottom: spacing.md,
  },
  submitError: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  nextButton: {
    minWidth: 140,
  },
});

export default WeeklyEvaluationScreen;
