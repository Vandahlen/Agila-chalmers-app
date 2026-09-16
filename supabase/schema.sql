-- Weekly evaluation tables for agila-chalmers-app
-- Matches columns read/written by
-- src/weekly-evaluation/services/SupabaseEvaluationRepository.ts
-- and the Question / EvaluationPayload types in types/evaluation.ts.
-- Safe to re-run.

create table if not exists public.evaluation_questions (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null,
  question_text text not null,
  question_type text not null
    check (question_type in ('scale', 'single_choice', 'text')),
  options text[],          -- single_choice only
  scale_min integer,       -- scale only; app defaults to 1
  scale_max integer,       -- scale only; app defaults to 5
  helper_text text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Anonymized by design: no user id, only aggregate academic context.
create table if not exists public.evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  program text not null,
  study_year integer not null,
  submitted_at timestamptz not null,
  answers jsonb not null,  -- [{ question_id, answer_value }]
  created_at timestamptz not null default now()
);

alter table public.evaluation_questions enable row level security;
alter table public.evaluation_responses enable row level security;

drop policy if exists "Public can read active questions" on public.evaluation_questions;
drop policy if exists "Public can submit responses" on public.evaluation_responses;

create policy "Public can read active questions"
  on public.evaluation_questions for select
  to anon, authenticated
  using (is_active);

-- Insert only: the app key can submit but never read responses back.
-- Read results with the service role (dashboard / SQL editor).
create policy "Public can submit responses"
  on public.evaluation_responses for insert
  to anon, authenticated
  with check (true);
