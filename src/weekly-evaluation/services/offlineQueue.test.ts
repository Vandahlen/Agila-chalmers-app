// src/weekly-evaluation/services/offlineQueue.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueuePayload, flushQueue } from './offlineQueue';
import { EvaluationPayload, IEvaluationRepository } from '../types/evaluation';

const payload = (id: string): EvaluationPayload => ({
  notification_id: id,
  program: 'Computer Science',
  study_year: 2,
  submitted_at: '2026-08-02T10:00:00.000Z',
  answers: [],
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('enqueuePayload persists a payload for later flushing', async () => {
  await enqueuePayload(payload('a'));
  const stored = await AsyncStorage.getItem('weekly-evaluation.offline-queue');
  expect(JSON.parse(stored!)).toHaveLength(1);
});

test('flushQueue submits every queued payload and clears the queue on success', async () => {
  await enqueuePayload(payload('a'));
  await enqueuePayload(payload('b'));

  const submitted: string[] = [];
  const repository: IEvaluationRepository = {
    getQuestions: async () => [],
    submitEvaluation: async (p) => {
      submitted.push(p.notification_id);
    },
  };

  const count = await flushQueue(repository);

  expect(count).toBe(2);
  expect(submitted).toEqual(['a', 'b']);
  const stored = await AsyncStorage.getItem('weekly-evaluation.offline-queue');
  expect(JSON.parse(stored!)).toEqual([]);
});

test('flushQueue keeps a payload queued if submission fails', async () => {
  await enqueuePayload(payload('a'));

  const repository: IEvaluationRepository = {
    getQuestions: async () => [],
    submitEvaluation: async () => {
      throw new Error('network down');
    },
  };

  const count = await flushQueue(repository);

  expect(count).toBe(0);
  const stored = await AsyncStorage.getItem('weekly-evaluation.offline-queue');
  expect(JSON.parse(stored!)).toHaveLength(1);
});
