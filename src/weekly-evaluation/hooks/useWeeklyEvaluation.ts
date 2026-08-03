/**
 * hooks/useWeeklyEvaluation.ts
 *
 * All data-fetching, submission, and step-navigation state for the
 * weekly evaluation flow. WeeklyEvaluationScreen only renders what
 * this hook exposes - it holds no business logic of its own.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EvaluationPayload,
  IEvaluationRepository,
  Question,
  QuestionAnswer,
} from '../types/evaluation';
import { enqueuePayload, flushQueue, removeFromQueue } from '../services/offlineQueue';

export type LoadState = 'loading' | 'ready' | 'error';
export type SubmitState = 'idle' | 'submitting' | 'error';

export interface StudentContext {
  program: string;
  study_year: number;
}

export interface UseWeeklyEvaluationArgs {
  repository: IEvaluationRepository;
  notificationId: string;
  studentContext: StudentContext;
  onEvaluationFinished: (notificationId: string) => void;
}

export function useWeeklyEvaluation({
  repository,
  notificationId,
  studentContext,
  onEvaluationFinished,
}: UseWeeklyEvaluationArgs) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const loadQuestions = useCallback(async () => {
    setLoadState('loading');
    try {
      const fetched = await repository.getQuestions();
      setQuestions(fetched);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [repository]);

  useEffect(() => {
    loadQuestions();
    flushQueue(repository);
  }, [loadQuestions, repository]);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const canProceed = !!currentAnswer;

  const progressRatio = useMemo(() => {
    if (questions.length === 0) return 0;
    return (currentStep + 1) / questions.length;
  }, [currentStep, questions.length]);

  const setAnswer = useCallback((questionId: string, answer_value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { question_id: questionId, answer_value },
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitState('submitting');
    const payload: EvaluationPayload = {
      notification_id: notificationId,
      program: studentContext.program,
      study_year: studentContext.study_year,
      submitted_at: new Date().toISOString(),
      answers: Object.values(answers),
    };

    try {
      await repository.submitEvaluation(payload);
      await removeFromQueue(notificationId);
      setSubmitState('idle');
      onEvaluationFinished(notificationId);
    } catch {
      await enqueuePayload(payload);
      setSubmitState('error');
    }
  }, [answers, notificationId, onEvaluationFinished, repository, studentContext]);

  const goNext = useCallback(() => {
    if (!canProceed) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [canProceed, handleSubmit, isLastStep]);

  const goBack = useCallback((onCancel?: () => void) => {
    if (currentStep === 0) {
      onCancel?.();
    } else {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  return {
    loadState,
    questions,
    currentStep,
    currentQuestion,
    isLastStep,
    currentAnswer,
    canProceed,
    currentStepNumber: currentStep + 1,
    totalSteps: questions.length,
    progressRatio,
    submitState,
    setAnswer,
    goNext,
    goBack,
    reload: loadQuestions,
  };
}
