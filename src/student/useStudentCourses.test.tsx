import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useStudentCourses } from './useStudentCourses';
import { ICourseRepository, StudentIdentity } from './types';

type HookResult = ReturnType<typeof useStudentCourses>;

function render(student: StudentIdentity | null, repository: ICourseRepository) {
  const result: { current: HookResult | null } = { current: null };
  function Probe({ s }: { s: StudentIdentity | null }): null {
    result.current = useStudentCourses(s, repository);
    return null;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Probe s={student} />);
  });
  const rerender = (s: StudentIdentity | null) =>
    ReactTestRenderer.act(() => {
      renderer.update(<Probe s={s} />);
    });
  return { result, rerender };
}

const flush = () => ReactTestRenderer.act(async () => {});

const courses = [{ code: 'TDA357', name: 'Databaser' }];

test('no student: never calls the repository and reports no-student', async () => {
  const repository = { getCourses: jest.fn() };
  const { result } = render(null, repository);
  await flush();

  expect(result.current?.status).toBe('no-student');
  expect(repository.getCourses).not.toHaveBeenCalled();
});

test('student: loads courses by cid', async () => {
  const repository = { getCourses: jest.fn(async () => courses) };
  const { result } = render({ cid: 'jakobah' }, repository);
  expect(result.current?.status).toBe('loading');
  await flush();

  expect(repository.getCourses).toHaveBeenCalledWith({ cid: 'jakobah' });
  expect(result.current).toMatchObject({ status: 'ready', courses });
});

test('lookup failure is an error state that reload retries', async () => {
  const repository = {
    getCourses: jest
      .fn()
      .mockRejectedValueOnce(new Error('TimeEdit down'))
      .mockResolvedValueOnce(courses),
  };
  const { result } = render({ cid: 'jakobah' }, repository);
  await flush();
  expect(result.current?.status).toBe('error');

  ReactTestRenderer.act(() => result.current!.reload());
  await flush();
  expect(result.current).toMatchObject({ status: 'ready', courses });
});

test('signing out mid-request drops the stale response', async () => {
  let resolve!: (value: typeof courses) => void;
  const repository = {
    getCourses: jest.fn(() => new Promise<typeof courses>((r) => (resolve = r))),
  };
  const { result, rerender } = render({ cid: 'jakobah' }, repository);

  rerender(null);
  resolve(courses);
  await flush();

  expect(result.current?.status).toBe('no-student');
});
