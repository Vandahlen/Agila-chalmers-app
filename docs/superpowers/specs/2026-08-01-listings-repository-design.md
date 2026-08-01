# Chalmers-app-sommaren-2026 Listings Repository Hardening — Design

Repo: `C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026\` (its own git
repo, separate from `agila`/`study-rooms`).

## Goal

`services/DatabaseAdapter.ts` currently hardcodes a Supabase URL and
anon key directly in source, and is a plain object rather than
following the `IEvaluationRepository`/`IStudyRoomRepository` pattern
already established in `agila` and `study-rooms`. This work brings it
in line with that pattern and fixes the credential handling, without
building any new feature (no write path for the "utomstående fyller i
ett formulär" submission form - that's separate, unrequested scope).

## Current state (confirmed by reading the actual files)

- `services/DatabaseAdapter.ts:8-9` hardcodes `API_URL` and `API_KEY`
  directly in source, with a comment acknowledging it's temporary.
- `.env` already exists in this repo **and is already tracked by
  git** (`git ls-files` shows it) - so the leak already happened
  regardless of what this work does next.
- `react-native-config` is an installed dependency but is completely
  unused (no `Config` import anywhere, no native gradle wiring) -
  dead weight, not part of the fix.
- `agila` already solves the equivalent problem with
  `react-native-dotenv` (babel-transform based, `import { X } from
  '@env'`), but is itself missing an ambient `@env.d.ts` module
  declaration, which is exactly why `agila`'s `tsc --noEmit` has a
  pre-existing `Cannot find module '@env'` error. This work adds that
  declaration here so the new code doesn't inherit the same gap.
  Fixing `agila`'s existing gap is out of scope for this plan - noted
  as a separate follow-up.
- `agila`'s `babel.config.js` has a real, pre-existing bug: two
  `module.exports` statements back to back (the second silently wins
  at runtime, so the dotenv plugin does work, but the first block is
  dead code). Also out of scope here, flagged as a separate follow-up.

## Changes

### 1. Config loading: `react-native-dotenv`

- Add `react-native-dotenv` (same version as `agila`: `^3.4.12`) to
  devDependencies.
- Add the babel plugin to `babel.config.js` (a single, correct
  `module.exports` - not the duplicated-block bug `agila` has).
- Add `env.d.ts` at the repo root declaring the `@env` module with
  `API_URL: string` and `API_KEY: string` - the two names already
  used in `.env` and `DatabaseAdapter.ts` today. Not renamed to match
  `agila`'s `SUPABASE_URL`/`SUPABASE_ANON_KEY` - smaller diff, no
  reason to rename working code.
- `DatabaseAdapter.ts` imports `API_URL`/`API_KEY` from `@env` instead
  of the hardcoded literals.

### 2. Stop tracking `.env`

- `git rm --cached .env` (keeps the file on disk, untracked, with its
  current real values - the app keeps working locally).
- Add `.env` to `.gitignore`, with the same comment `agila` uses:
  `# Environment variables (contains secrets - keep .env.example
  tracked instead)`.
- Add a tracked `.env.example` with the same two keys as placeholder
  values.
- **The actual Supabase anon key must still be rotated in the
  Supabase dashboard by the user** - it's already in this repo's git
  history, and removing it from tracking going forward doesn't erase
  that history. Not something this plan can do (account-level action).

### 3. `IListingsRepository` interface + Supabase/Mock implementations

Restructure `services/DatabaseAdapter.ts`:

```ts
export interface IListingsRepository {
  fetchAllListings(): Promise<Listing[]>;
}
```

- `SupabaseListingsRepository` class wrapping the existing Supabase
  query and column-mapping logic (`item.titleSv` -> `title`,
  `item.applicationDeadline` -> `deadline`, etc.) - unchanged behavior,
  just moved into a class implementing the interface, reading
  `API_URL`/`API_KEY` from `@env`.
- `createSupabaseListingsRepository(): IListingsRepository` factory -
  matching `study-rooms`/`weekly-evaluation`'s factory-function
  convention (`createMockStudyRoomRepository()`,
  `createSupabaseEvaluationRepository(postgrest)`).
- `App.tsx` swaps `DatabaseAdapter.fetchAllListings()` for a
  `repository.fetchAllListings()` call, with `const repository =
  createSupabaseListingsRepository();` created once at module scope -
  same shape as the other two modules' `App.tsx`/screen wiring.

New `services/MockListingsRepository.ts`:

- `createMockListingsRepository(): IListingsRepository`, returning a
  small inline fixture array (2-3 `Listing` items) - not a separate
  JSON file like `study-rooms`' fixture set, since this is a much
  smaller surface (one type, one method) and doesn't need hand-edited
  fixture data the way a UI-heavy feature does.
- Not wired into `App.tsx` by default - `App.tsx` keeps using the real
  Supabase-backed repository. The mock exists as the swappable option
  the existing (unfulfilled) commit message promised
  ("hotswappable... Supabase and a mock database for testing"),
  available for a test or a future dev toggle.

### 4. Testing

- `services/MockListingsRepository.test.ts` - resolves the fixture
  list, checks its shape (count, a specific item's fields). Mirrors
  `study-rooms`' `MockStudyRoomRepository.test.ts`. Nothing currently
  tests any part of `DatabaseAdapter.ts`.
- No test changes needed for `SupabaseListingsRepository` itself - it
  isn't unit-tested today (no repo convention for mocking the
  Supabase client), and this plan doesn't introduce one.

## Out of scope

- The write path for the external submission form (spec page 1,
  "Utomstående får fylla i ett formulär för att skapa annons") - not
  requested, not started.
- Actually rotating the leaked Supabase anon key - account-level
  action only the user can take.
- Fixing `agila`'s pre-existing `@env` type-declaration gap or its
  duplicated `babel.config.js` `module.exports` - flagged as separate
  follow-ups, not part of this plan.
- Removing the unused `react-native-config` dependency - left in
  place; a separate, smaller cleanup if wanted later.
