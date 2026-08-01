# Chalmers-app-sommaren-2026 Listings Repository Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop hardcoding Supabase credentials in `services/DatabaseAdapter.ts`, stop tracking `.env` in git, and formalize the listings data layer into an `IListingsRepository` interface with `Supabase`/`Mock` implementations - matching the pattern already used in `agila` (`IEvaluationRepository`) and `study-rooms` (`IStudyRoomRepository`).

**Architecture:** `react-native-dotenv` (babel-transform based, `@env` imports) loads `API_URL`/`API_KEY` from a now-untracked `.env`. `DatabaseAdapter.ts` becomes an `IListingsRepository` interface plus a `SupabaseListingsRepository` class and `createSupabaseListingsRepository()` factory (unchanged query/mapping logic, just relocated and reading from `@env`). A new `MockListingsRepository.ts` provides a swappable test double. `App.tsx` is updated to construct the repository once at module scope and call it through the interface, exactly like `study-rooms`/`weekly-evaluation`'s `App.tsx`/screen wiring.

**Tech Stack:** `react-native-dotenv` (new devDependency, version `^3.4.12` - same as `agila`'s). No other new dependencies. React Native 0.86 / React 19.2.3 (already the repo's baseline).

## Global Constraints

- Env var names stay `API_URL`/`API_KEY` (not renamed to match `agila`'s `SUPABASE_URL`/`SUPABASE_ANON_KEY`) - smaller diff, no reason to rename working code.
- Add an `env.d.ts` ambient module declaration for `@env` - `agila` is missing this (it's why `agila`'s `tsc --noEmit` has a pre-existing `Cannot find module '@env'` error); this plan's code must not inherit that gap. Do not fix `agila`'s existing gap - out of scope for this plan.
- Do not fix `agila`'s duplicated `module.exports` in `babel.config.js`, and do not remove `Chalmers-app-sommaren-2026`'s unused `react-native-config` dependency - both are noted, out-of-scope follow-ups.
- Do not build the write path for the external submission form ("Utomstående får fylla i ett formulär") - unrequested, separate scope.
- Actually rotating the Supabase anon key in the Supabase dashboard is the user's action, not something any task here can do - only untrack the file going forward.
- `MockListingsRepository` is not wired into `App.tsx` - `App.tsx` keeps using the real Supabase-backed repository. The mock exists as the swappable option, exercised only by its own test.
- `SupabaseListingsRepository`'s query/column-mapping logic (the `item.titleSv` -> `title` etc. translation) must stay byte-identical to what's in `DatabaseAdapter.ts` today - this plan relocates and reads-from-`@env`, it does not change behavior.

---

### Task 1: `react-native-dotenv` config loading, untrack `.env`

**Files:**
- Modify: `babel.config.js`
- Create: `env.d.ts`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `.env` (untrack only - content unchanged)

**Interfaces:**
- Produces: the `@env` module (`API_URL: string`, `API_KEY: string`), importable from any file in this repo from this task onward. Task 2 imports it.

- [ ] **Step 1: Install `react-native-dotenv`**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npm install --save-dev react-native-dotenv@^3.4.12`
Expected: adds `react-native-dotenv` to `devDependencies`, installs cleanly.

- [ ] **Step 2: Add the babel plugin**

Find the entire current contents of `babel.config.js`:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

Replace it with:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv'],
  ],
};
```

- [ ] **Step 3: Add the `@env` type declaration**

```ts
// env.d.ts
declare module '@env' {
  export const API_URL: string;
  export const API_KEY: string;
}
```

- [ ] **Step 4: Add `.env.example`**

```
# Copy this file to .env and fill in your real values.
# Get these from your Supabase project: Settings -> API.
API_URL=https://your-project.supabase.co
API_KEY=your-anon-key
```

- [ ] **Step 5: Untrack `.env` and add it to `.gitignore`**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && git rm --cached .env`
Expected: `.env` is removed from git's index but stays on disk unchanged (verify with `git status` showing it as untracked afterward, and `cat .env` still showing the same content it had before).

Find this line in `.gitignore`:

```
**/.xcode.env.local
```

Add this block immediately after it:

```

# Environment variables (contains secrets - keep .env.example tracked instead)
.env
```

- [ ] **Step 6: Verify `.env` is no longer tracked**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && git status --short`
Expected: `.env` does NOT appear in the output at all (neither staged nor as a modification) - confirming `.gitignore` now covers it. `babel.config.js`, `env.d.ts`, `.env.example`, `.gitignore`, and `package.json`/`package-lock.json` should appear as changes to commit.

- [ ] **Step 7: Commit**

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git add babel.config.js env.d.ts .env.example .gitignore package.json package-lock.json
git commit -m "chore: load Supabase config from .env via react-native-dotenv, stop tracking .env"
```

Note in the commit message body or your task report: the actual Supabase anon key in `.env` predates this change and is already in this repo's git history - it still needs to be rotated in the Supabase dashboard by the user. This task does not and cannot do that.

---

### Task 2: `IListingsRepository` + `SupabaseListingsRepository`, wire into `App.tsx`

**Files:**
- Modify: `services/DatabaseAdapter.ts`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `@env`'s `API_URL`/`API_KEY` (Task 1).
- Produces: `Listing` (unchanged shape), `IListingsRepository { fetchAllListings(): Promise<Listing[]> }`, `SupabaseListingsRepository` class, `createSupabaseListingsRepository(): IListingsRepository` factory. Task 3's `MockListingsRepository` implements the same `IListingsRepository`. `App.tsx` is the only consumer of the factory.

- [ ] **Step 1: Replace the entire contents of `services/DatabaseAdapter.ts`**

```ts
// services/DatabaseAdapter.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_KEY } from '@env';

export interface Listing {
  id: string;
  category: string;
  title: string;
  company: string;
  programs: string[];
  deadline: string;
  term: string;
  location: string;
  description: string;
  logoColor: string;
  coverColor?: string;
}

/**
 * Repository contract for the listings data layer. Any backend
 * (Supabase, a mock, a REST adapter) can implement this interface,
 * keeping App.tsx decoupled from the data source.
 */
export interface IListingsRepository {
  fetchAllListings(): Promise<Listing[]>;
}

export class SupabaseListingsRepository implements IListingsRepository {
  private supabase = createClient(API_URL, API_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  async fetchAllListings(): Promise<Listing[]> {
    const { data, error } = await this.supabase
      .from('listings')
      .select('*')
      .order('applicationDeadline', { ascending: true }); // Fixed column name here!

    if (error) throw new Error(error.message);

    // Translate the database columns into the strict format your UI expects
    return data.map((item: any) => ({
      id: item.id,
      category: item.type,
      title: item.titleSv,
      company: item.company,
      programs: item.programs || [],
      deadline: item.applicationDeadline,
      term: item.term,
      location: item.location,
      description: item.descriptionSv,
      logoColor: item.logoColor || '#CCCCCC',
      coverColor: item.coverColor,
    }));
  }
}

export function createSupabaseListingsRepository(): IListingsRepository {
  return new SupabaseListingsRepository();
}
```

- [ ] **Step 2: Update the import in `App.tsx`**

Find:

```tsx
// Import our new hotswappable Database Adapter
import { DatabaseAdapter, type Listing } from './services/DatabaseAdapter';
```

Replace with:

```tsx
// Import our new hotswappable Database Adapter
import { createSupabaseListingsRepository, type Listing } from './services/DatabaseAdapter';

const listingsRepository = createSupabaseListingsRepository();
```

- [ ] **Step 3: Update the fetch call in `App.tsx`**

Find:

```tsx
    try {
      // Calls the adapter instead of Supabase directly
      const data = await DatabaseAdapter.fetchAllListings();
      setListings(data);
```

Replace with:

```tsx
    try {
      // Calls the repository instead of Supabase directly
      const data = await listingsRepository.fetchAllListings();
      setListings(data);
```

- [ ] **Step 4: Type-check and run the existing test**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx tsc --noEmit && npx jest`
Expected: no NEW type errors (the pre-existing `chalmers-admin/` errors from the profile-icons work are unrelated and still present - confirm any error you see is one of those, not in `App.tsx`/`DatabaseAdapter.ts`); `__tests__/App.test.tsx` still passes (it renders `<App />`, which now constructs `SupabaseListingsRepository` at module scope via `@env` - same shape of test that already passes in `agila` with the equivalent `@env`-backed `postgrest` client).

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git add services/DatabaseAdapter.ts App.tsx
git commit -m "refactor: formalize DatabaseAdapter into IListingsRepository"
```

---

### Task 3: `MockListingsRepository` + test

**Files:**
- Create: `services/MockListingsRepository.ts`
- Create: `services/MockListingsRepository.test.ts`

**Interfaces:**
- Consumes: `Listing`, `IListingsRepository` from `./DatabaseAdapter` (Task 2).
- Produces: `createMockListingsRepository(): IListingsRepository`. Not consumed anywhere in `App.tsx` - only its own test exercises it.

- [ ] **Step 1: Write the failing test**

```ts
// services/MockListingsRepository.test.ts
import { createMockListingsRepository } from './MockListingsRepository';

test('resolves the fixture listing list', async () => {
  const repository = createMockListingsRepository();
  const listings = await repository.fetchAllListings();

  expect(listings.length).toBe(2);
  expect(listings[0]).toMatchObject({
    id: 'mock-1',
    category: 'Examensarbete',
    company: 'Volvo Group',
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx jest services/MockListingsRepository.test.ts`
Expected: FAIL - `Cannot find module './MockListingsRepository'`

- [ ] **Step 3: Write `MockListingsRepository.ts`**

```ts
// services/MockListingsRepository.ts
import { IListingsRepository, Listing } from './DatabaseAdapter';

const FIXTURE_LISTINGS: Listing[] = [
  {
    id: 'mock-1',
    category: 'Examensarbete',
    title: 'Data-driven route optimization',
    company: 'Volvo Group',
    programs: ['Mechanical Eng', 'Industrial Eng'],
    deadline: '2026-09-15',
    term: 'HT26',
    location: 'Gothenburg',
    description: 'We are looking for a masters student to explore reinforcement learning approaches for real-time fleet routing across our logistics network.',
    logoColor: '#00ACFF',
  },
  {
    id: 'mock-2',
    category: 'Jobb',
    title: 'Frontend developer',
    company: 'Northvolt',
    programs: ['Computer Science', 'IT'],
    deadline: '2026-08-30',
    term: 'HT26',
    location: 'Remote',
    description: 'Join our team building the next generation of battery manufacturing software.',
    logoColor: '#27AD72',
  },
];

export class MockListingsRepository implements IListingsRepository {
  async fetchAllListings(): Promise<Listing[]> {
    return FIXTURE_LISTINGS;
  }
}

export function createMockListingsRepository(): IListingsRepository {
  return new MockListingsRepository();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx jest services/MockListingsRepository.test.ts`
Expected: PASS

- [ ] **Step 5: Type-check and run the full suite**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx tsc --noEmit && npx jest`
Expected: no NEW type errors (same pre-existing `chalmers-admin/` caveat as Task 2); both test suites pass (`__tests__/App.test.tsx`, `services/MockListingsRepository.test.ts`).

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git add services/MockListingsRepository.ts services/MockListingsRepository.test.ts
git commit -m "test: add MockListingsRepository as a swappable IListingsRepository implementation"
```
