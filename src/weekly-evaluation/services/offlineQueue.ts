// src/weekly-evaluation/services/offlineQueue.ts
/**
 * services/offlineQueue.ts
 *
 * Minimum-viable "don't lose a submission if it fails" layer: a
 * failed submit is persisted to AsyncStorage; the next successful
 * app start (or manual reload) retries every queued payload once.
 * Not a general offline-sync framework - no background timers, no
 * push-based retry, no queue-viewing UI.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EvaluationPayload, IEvaluationRepository } from '../types/evaluation';

const QUEUE_KEY = 'weekly-evaluation.offline-queue';

async function readQueue(): Promise<EvaluationPayload[]> {
  const stored = await AsyncStorage.getItem(QUEUE_KEY);
  return stored ? JSON.parse(stored) : [];
}

async function writeQueue(queue: EvaluationPayload[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueuePayload(payload: EvaluationPayload): Promise<void> {
  const queue = await readQueue();
  const deduped = queue.filter((p) => p.notification_id !== payload.notification_id);
  deduped.push(payload);
  await writeQueue(deduped);
}

/** Removes any queued payload for a notification, e.g. once a later retry succeeds. */
export async function removeFromQueue(notificationId: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((p) => p.notification_id !== notificationId));
}

/** Attempts to submit every queued payload once. Returns the count that succeeded. */
export async function flushQueue(repository: IEvaluationRepository): Promise<number> {
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  const stillQueued: EvaluationPayload[] = [];
  let succeeded = 0;

  for (const payload of queue) {
    try {
      await repository.submitEvaluation(payload);
      succeeded += 1;
    } catch {
      stillQueued.push(payload);
    }
  }

  await writeQueue(stillQueued);
  return succeeded;
}
