/**
 * types/evaluation.ts
 *
 * Shared types for the Weekly Study Situation Evaluation module.
 */

/** Supported input types for a survey question. */
export type QuestionType = 'scale' | 'single_choice' | 'text';

/** A single survey question as stored in `evaluation_questions`. */
export interface Question {
  id: string;
  order_index: number;
  question_text: string;
  question_type: QuestionType;
  /** Only present for `single_choice` questions. */
  options?: string[];
  /** Only present for `scale` questions, e.g. 1-5. */
  scale_min?: number;
  scale_max?: number;
  /** Optional helper text shown under the question. */
  helper_text?: string;
}

/** A single answered question, submitted as part of the payload. */
export interface QuestionAnswer {
  question_id: string;
  /** Numeric value for `scale`, string for `single_choice` / `text`. */
  answer_value: string | number;
}

/**
 * Anonymized submission payload for `evaluation_responses`.
 * Deliberately excludes any user identifier - only aggregate
 * academic context is retained so responses cannot be traced
 * back to an individual student.
 */
export interface EvaluationPayload {
  notification_id: string;
  program: string;
  study_year: number;
  submitted_at: string; // ISO 8601
  answers: QuestionAnswer[];
}

/** Shape of a notification entry rendered in the notification feed. */
export interface EvaluationNotification {
  id: string;
  title: string;
  body: string;
  created_at: string; // ISO 8601
  is_read: boolean;
  /** Distinguishes this notification type from other in-app notifications. */
  type: 'weekly_evaluation';
}

/**
 * Repository contract for the evaluation module's data layer.
 * Any backend (Supabase, REST, mock/local) can implement this
 * interface, keeping UI components decoupled from the data source.
 */
export interface IEvaluationRepository {
  /** Fetches the current set of active weekly evaluation questions. */
  getQuestions(): Promise<Question[]>;

  /** Submits an anonymized evaluation response. */
  submitEvaluation(payload: EvaluationPayload): Promise<void>;
}
