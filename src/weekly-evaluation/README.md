# Weekly Study Situation Evaluation Module

A standalone React Native (bare CLI, TypeScript) module for Chalmers
Studentkår that lets students answer a short, anonymous weekly
check-in on how their studies are going, entered from the app's
notification feed.

## Folder structure

```
weekly-evaluation/
├── types/
│   └── evaluation.ts                 # Question, EvaluationPayload, IEvaluationRepository
├── services/
│   └── SupabaseEvaluationRepository.ts  # Supabase implementation of IEvaluationRepository
├── theme/
│   └── theme.ts                      # Chalmers colors + Open Sans type scale
├── components/
│   ├── ChalmersText.tsx              # Typography primitive (Titel/H1/H2/Paragraph/...)
│   ├── ChalmersButton.tsx            # Primärknapp / Sekundärknapp / Disable states
│   ├── NotificationItem.tsx          # Feed entry, unread dot, timestamp
│   └── EvaluationIntroCard.tsx       # Pre-survey explainer + "Start Evaluation"
├── screens/
│   └── WeeklyEvaluationScreen.tsx    # Step-by-step survey, submits + fires onEvaluationFinished
└── example/
    └── ExampleUsage.tsx              # Illustrative wiring, not a required file
```

## Design system

All colors and type sizes come from `theme/theme.ts`, sourced directly
from the Kårappen graphic profile:

| Token       | Hex       |
|-------------|-----------|
| Blå         | `#00ACFF` |
| Lila        | `#843690` |
| Röd         | `#D8004D` |
| Matt röd    | `#F8686D` |
| Orange      | `#F86600` |
| Varm grå    | `#634C3D` |
| Grön        | `#27AD72` |
| Turkos      | `#7CCDC2` |

Type scale (Open Sans): Titel 30pt, Heading 1 20pt, Heading 2 16pt,
Subheading 1 11pt, Paragraph 1 16pt, Paragraph 2 13pt, Caption 1/2
12pt/10pt, Label 10pt. Register the actual Open Sans font files
(`OpenSans-Regular/Medium/SemiBold/Bold`) via `react-native.config.js`
/ `npx react-native-asset` - this module only references the family
names, it doesn't bundle the font files.

## Repository pattern (swappable backend)

Nothing outside `services/SupabaseEvaluationRepository.ts` imports
`@supabase/supabase-js`. Every component/screen depends only on the
`IEvaluationRepository` interface, so you can swap in a mock, a REST
adapter, or a different backend by writing a new class that
implements the same two methods:

```ts
interface IEvaluationRepository {
  getQuestions(): Promise<Question[]>;
  submitEvaluation(payload: EvaluationPayload): Promise<void>;
}
```

## Suggested Supabase schema

```sql
create table evaluation_questions (
  id uuid primary key default gen_random_uuid(),
  order_index int not null,
  question_text text not null,
  question_type text not null check (question_type in ('scale', 'single_choice', 'text')),
  options text[],
  scale_min int,
  scale_max int,
  helper_text text,
  is_active boolean not null default true
);

create table evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  program text not null,
  study_year int not null,
  submitted_at timestamptz not null,
  answers jsonb not null
);
```

Note `evaluation_responses` has **no user/auth column** - the
repository strips `notification_id` before insert and only ever
writes `program`, `study_year`, `submitted_at`, and `answers`, so
responses cannot be traced back to an individual student. Row Level
Security should still be enabled: allow `insert` for any
authenticated user, disallow `select`/`update`/`delete` from the
client entirely.

## Notification cleanup

`WeeklyEvaluationScreen` never touches the notification feed's state
directly - it only calls `onEvaluationFinished(notificationId)` after
a successful Supabase write. The host app supplies that callback and
is responsible for deleting/hiding the notification (see
`example/ExampleUsage.tsx` for a minimal version).

## Dependencies

```bash
npm install @supabase/supabase-js
```

`ChalmersButton` / `ChalmersText` use only core `react-native`
primitives (`Pressable`, `Text`, `StyleSheet`) - no extra styling
library is required, though you can swap the `StyleSheet.create`
blocks for `styled-components` without changing any public props.

## Known gaps / extension points

- No auth/session identity is threaded through `IEvaluationRepository`
  - `SupabaseEvaluationRepository` takes an already-configured client.
  A real per-user auth requirement would be new surface on the
  interface, not something swapping implementations gives for free.
