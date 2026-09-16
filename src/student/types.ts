/**
 * student/types.ts
 *
 * The contract between the Kårappen host app and agila for "who is the
 * student". See student/README.md for the design and the rules around it.
 */

/**
 * The signed-in student, handed to agila by the host as a prop.
 * `null` means the host has no signed-in student (or couldn't read one).
 *
 * An object rather than a bare string so the host can later add an auth
 * token here without changing every call site.
 */
export interface StudentIdentity {
  /** Chalmers ID (CID), e.g. "jakobah". Never stored or submitted. */
  cid: string;
}

export interface StudentCourse {
  /** Course code, e.g. "TDA357". */
  code: string;
  name: string;
}

/**
 * Looks up a student's current courses. Implemented against TimeEdit
 * once the API format is known - same swappable-repository pattern as
 * IEvaluationRepository.
 */
export interface ICourseRepository {
  getCourses(student: StudentIdentity): Promise<StudentCourse[]>;
}
