/**
 * services/SupabaseEvaluationRepository.ts
 *
 * Supabase-backed implementation of IEvaluationRepository.
 * Swappable: any other backend can be substituted by implementing
 * the same interface (see types/evaluation.ts), so screens and
 * components never talk to Supabase directly.
 *
 * Deliberately built on @supabase/postgrest-js (the REST-only
 * client Supabase's SDK is built on) rather than the full
 * @supabase/supabase-js client. The full client always constructs
 * a Realtime/WebSocket connection at startup, which does a URL
 * "protocol" rewrite that's incompatible with React Native's URL
 * implementation and crashes on client creation - even though
 * this module never uses realtime subscriptions. PostgrestClient
 * gives the same .from().select()/.insert() query API without
 * ever touching WebSockets.
 */

import { PostgrestClient } from '@supabase/postgrest-js';
import {
  IEvaluationRepository,
  Question,
  QuestionType,
  EvaluationPayload,
} from '../types/evaluation';

const QUESTIONS_TABLE = 'evaluation_questions';
const RESPONSES_TABLE = 'evaluation_responses';

const QUESTION_TYPES: readonly QuestionType[] = ['scale', 'single_choice', 'text'];

/**
 * Validates a single row from `evaluation_questions` against the
 * shape the app relies on, so a schema drift on the backend throws
 * a clear error here instead of crashing deep in the render tree.
 */
function isQuestion(row: unknown): row is Question {
  if (typeof row !== 'object' || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.order_index === 'number' &&
    typeof r.question_text === 'string' &&
    QUESTION_TYPES.includes(r.question_type as QuestionType)
  );
}

function parseQuestions(data: unknown[]): Question[] {
  const invalidIndex = data.findIndex((row) => !isQuestion(row));
  if (invalidIndex !== -1) {
    throw new Error(
      `Received malformed evaluation question at index ${invalidIndex}`,
    );
  }
  return data as Question[];
}

export class SupabaseEvaluationRepository implements IEvaluationRepository {
  private client: PostgrestClient;

  constructor(client: PostgrestClient) {
    this.client = client;
  }

  /**
   * Fetches the active weekly evaluation questions, ordered for
   * display. Only currently-active questions are returned so old
   * or retired questions never appear in the flow.
   */
  async getQuestions(): Promise<Question[]> {
    const { data, error } = await this.client
      .from(QUESTIONS_TABLE)
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch evaluation questions: ${error.message}`);
    }

    return parseQuestions(data ?? []);
  }

  /**
   * Submits an anonymized evaluation response. The payload is
   * expected to already exclude any user identifier - this method
   * does not attach one, by design, to preserve anonymity.
   */
  async submitEvaluation(payload: EvaluationPayload): Promise<void> {
    const anonymizedPayload = payload;

    const { error } = await this.client.from(RESPONSES_TABLE).insert([
      {
        program: anonymizedPayload.program,
        study_year: anonymizedPayload.study_year,
        submitted_at: anonymizedPayload.submitted_at,
        answers: anonymizedPayload.answers,
      },
    ]);

    if (error) {
      throw new Error(`Failed to submit evaluation: ${error.message}`);
    }
  }
}

/**
 * Convenience factory so callers don't need to import the class
 * directly - keeps construction in one place if instantiation
 * logic ever grows (e.g. adding retries, logging).
 */
export function createSupabaseEvaluationRepository(
  client: PostgrestClient,
): IEvaluationRepository {
  return new SupabaseEvaluationRepository(client);
}
