/**
 * student/useStudentCourses.ts
 *
 * Loads the signed-in student's courses. A missing student is a normal
 * state ('no-student'), not an error: callers hide course-based content
 * and everything else keeps working.
 */
import { useCallback, useEffect, useState } from 'react';
import { ICourseRepository, StudentCourse, StudentIdentity } from './types';

export type StudentCoursesState =
  | { status: 'no-student' }
  | { status: 'loading' }
  | { status: 'ready'; courses: StudentCourse[] }
  | { status: 'error' };

export function useStudentCourses(
  student: StudentIdentity | null,
  repository: ICourseRepository,
): StudentCoursesState & { reload: () => void } {
  const cid = student?.cid ?? null;
  const [state, setState] = useState<StudentCoursesState>(
    cid ? { status: 'loading' } : { status: 'no-student' },
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!cid) {
      setState({ status: 'no-student' });
      return;
    }
    // Ignore a slow response for a previous student (sign-out / switch).
    let current = true;
    setState({ status: 'loading' });
    repository
      .getCourses({ cid })
      .then((courses) => current && setState({ status: 'ready', courses }))
      .catch(() => current && setState({ status: 'error' }));
    return () => {
      current = false;
    };
  }, [cid, repository, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}
