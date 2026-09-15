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
│   ├── SupabaseEvaluationRepository.ts  # Supabase implementation of IEvaluationRepository
│   └── offlineQueue.ts               # AsyncStorage retry queue for failed submits
├── i18n/
│   ├── translations.ts               # EN/SV copy for this module
│   └── I18nContext.tsx               # language state, persisted, defaults to sv
├── components/
│   ├── NotificationItem.tsx          # Feed entry, unread dot, timestamp
│   ├── EvaluationIntroCard.tsx       # Pre-survey explainer + "Start Evaluation"
│   └── QuestionInput.tsx             # scale / single-choice / free-text input
├── hooks/
│   └── useWeeklyEvaluation.ts        # question loading, step state, submit
└── screens/
    └── WeeklyEvaluationScreen.tsx    # Step-by-step survey, submits + fires onEvaluationFinished
```

Theming and typography (`ChalmersText`, `ChalmersButton`, colors, spacing,
`ThemeProvider`/`useTheme`) come from the shared **`kar-ui-kit`** package
(`file:../kar-ui-kit`), not from files inside this module - there's no local
`theme/` folder or copied component here. See `kar-ui-kit/README.md` for the
full Kårappen graphic-profile token table and type scale.

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
a successful Supabase write. The host app (currently `App.tsx`'s demo
feed) supplies that callback and is responsible for deleting/hiding
the notification.

## Dependencies

```bash
npm install @supabase/supabase-js
```

Chalmers-branded UI primitives come from `kar-ui-kit`, already a
dependency of this app (`file:../kar-ui-kit`) - no extra styling
library is required here.

## Known gaps / extension points

- No auth/session identity is threaded through `IEvaluationRepository`
  - `SupabaseEvaluationRepository` takes an already-configured client.
  A real per-user auth requirement would be new surface on the
  interface, not something swapping implementations gives for free.
