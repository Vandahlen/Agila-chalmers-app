# Student identity (Chalmers ID) handoff

How agila learns which student is using it, so it can look up their
courses (via TimeEdit, once API access exists).

## Decisions

### 1. The host passes the ID in; agila never finds it itself

The Kårappen app already knows who is signed in. When it renders agila, it
passes that student as a prop:

```tsx
<AgilaRoot student={signedIn ? { cid: session.cid } : null} />
```

- Type: `StudentIdentity | null` (`types.ts`). `null` = no signed-in student.
- agila does **not** read Kårappen's storage, parse tokens, or ask the
  student to type their CID. A typed-in CID is unverified - anyone could
  enter someone else's and see their courses.
- If agila ships as a separate app instead of an embedded module, the ID
  must still come from a verified sign-in (e.g. Chalmers SSO), never from a
  deep-link parameter, which any app or link can forge.

### 2. A missing ID is normal, not an error

`useStudentCourses(student, repository)` returns one of:

| Status | When | What the UI does |
|---|---|---|
| `no-student` | host passed `null` | hide course-based content; no error message |
| `loading` | lookup in progress | show a spinner where courses would appear |
| `ready` | lookup succeeded | use `courses` |
| `error` | lookup failed (network, TimeEdit down) | same as `no-student`, plus an optional "Försök igen" calling `reload()` |

The weekly evaluation keeps working in every state: it is anonymous and
does not need the ID. Signing out mid-lookup drops the late response.

### 3. The ID stays on the device

- Never included in `EvaluationPayload` or the offline queue (both would
  make anonymous responses traceable).
- Never persisted by agila; the host owns the session.
- Only sent to the course lookup (`ICourseRepository.getCourses`).

## Open, decide when the TimeEdit docs arrive

- **Who may look up whose courses.** If TimeEdit returns any student's
  courses for a bare CID, calling it straight from the app lets anyone query
  anyone. Then the lookup must go through a small server that checks the
  host's session token first - add `token` to `StudentIdentity` for that.
- **Storing courses with evaluations.** Course codes would make results far
  more useful, but a small course can identify a student. Decide on a
  minimum group size before adding courses to `EvaluationPayload`.
- **Program and study year.** Still host-provided (`studentContext`); check
  whether TimeEdit or Kårappen's profile is the better source.
