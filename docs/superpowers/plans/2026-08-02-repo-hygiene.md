# Repo Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the small, mechanical gaps found in the full-scan review: two lingering bugs in `agila`, a stale README, missing lint tooling in `study-rooms`, an unused dependency in `Chalmers-app-sommaren-2026`, and zero CI anywhere across the three repos.

**Architecture:** Independent, mechanical fixes - no shared code, no feature design. Each task touches exactly one repo and is safe to do in any order (listed in ascending "quickest first" order here). This plan does not depend on, and is not depended on by, the shared-UI-kit or features/tests plans - it's fine to run this one first since it's the fastest.

**Tech Stack:** No new runtime dependencies. GitHub Actions for CI (works whether or not a repo currently has a `git remote` - the workflow file is inert until pushed to GitHub). `@react-native/eslint-config` (already a devDependency pattern in the other two repos) for `study-rooms`' lint setup.

## Global Constraints

- Every task in this plan is independently completable and independently useful - do not let one task's outcome change another's approach.
- CI workflows run `npm ci` (not `npm install`) for reproducibility, then `npx tsc --noEmit` and `npm test`. `study-rooms`'s workflow does not need an Android/iOS build step (Task 0 of its original plan deliberately scoped it as jest/tsc-only); `agila`'s and `Chalmers-app-sommaren-2026`'s workflows also stick to JS-level checks only - a full native build in CI is a separate, larger effort (Android SDK/Xcode toolchain in CI) not in scope here.
- Fixing `agila`'s `tsc --noEmit` to be fully clean is the acceptance bar for that repo's CI to be meaningful - Task 1 must leave `npx tsc --noEmit` exiting 0 with zero output in `agila`.

---

### Task 1: Fix `agila`'s duplicated `babel.config.js` and missing `env.d.ts`

**Repo:** `C:\Users\jakob\Karappen\agila\`

**Files:**
- Modify: `babel.config.js`
- Create: `env.d.ts`

**Interfaces:**
- Produces: a working `@env` module declaration (`SUPABASE_URL: string`, `SUPABASE_ANON_KEY: string` - the names already used by `src/config/supabase.ts:12`). No other task in this plan touches these names.

- [ ] **Step 1: Replace `babel.config.js`'s duplicated contents**

Find the entire current contents of `babel.config.js`:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv'],
  ],
};
```

Replace it with the single, correct block (the second one was already the one taking effect - this just removes the dead first block):

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv'],
  ],
};
```

- [ ] **Step 2: Add the `@env` type declaration**

```ts
// env.d.ts
declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
}
```

- [ ] **Step 3: Verify the fix**

Run: `cd "C:\Users\jakob\Karappen\agila" && npx tsc --noEmit`
Expected: exits 0 with **zero output** (this repo's standing `Cannot find module '@env'` error is gone).

Run: `cd "C:\Users\jakob\Karappen\agila" && npx jest`
Expected: `__tests__/App.test.tsx`'s smoke test still passes (babel plugin behavior is unchanged, only the dead duplicate block was removed).

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\jakob\Karappen\agila"
git add babel.config.js env.d.ts
git commit -m "fix: remove duplicated babel.config.js export, add missing @env type declaration"
```

---

### Task 2: Fix the stale `weekly-evaluation` README

**Repo:** `C:\Users\jakob\Karappen\agila\`

**Files:**
- Modify: `src/weekly-evaluation/README.md`

**Interfaces:** None - documentation only.

- [ ] **Step 1: Update the "Known gaps / extension points" section**

Find:

```markdown
## Known gaps / extension points

- `QuestionInput`'s `text` branch is a placeholder - wire in a
  `TextInput` if you add free-text questions.
- No offline queueing: a failed submit surfaces an inline error and
  lets the student retry; add a queue/retry layer if offline support
  is required.
- No i18n layer - all copy is in English; the profile's icon set
  includes a language switcher (`Språk`) suggesting the host app
  already has one, so this module should read from it rather than
  duplicating it.
```

Replace it with (both stale claims corrected - `TextInput` and full i18n were built after this section was originally written and never updated):

```markdown
## Known gaps / extension points

- No offline queueing: a failed submit surfaces an inline error and
  lets the student retry; add a queue/retry layer if offline support
  is required. (Tracked separately - see the features-and-coverage plan.)
- No auth/session identity is threaded through `IEvaluationRepository`
  - `SupabaseEvaluationRepository` takes an already-configured client.
  A real per-user auth requirement would be new surface on the
  interface, not something swapping implementations gives for free.
```

- [ ] **Step 2: Verify no other stale claims exist in the same file**

Run: `grep -n "placeholder\|No i18n" "C:\Users\jakob\Karappen\agila\src\weekly-evaluation\README.md"`
Expected: no output (confirms the two corrected claims were the only stale ones in this file).

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jakob\Karappen\agila"
git add src/weekly-evaluation/README.md
git commit -m "docs: fix stale Known Gaps claims in weekly-evaluation README"
```

---

### Task 3: Add lint tooling to `study-rooms`

**Repo:** `C:\Users\jakob\Karappen\study-rooms\`

**Files:**
- Create: `.eslintrc.js`
- Modify: `package.json`

**Interfaces:** None - tooling only.

- [ ] **Step 1: Install eslint dependencies**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npm install --save-dev eslint@^8.19.0 @react-native/eslint-config@0.86.0`
Expected: adds both to `devDependencies`, installs cleanly (same versions `agila`/`Chalmers-app-sommaren-2026` already use).

- [ ] **Step 2: Add `.eslintrc.js`**

```js
// .eslintrc.js
module.exports = {
  root: true,
  extends: '@react-native',
};
```

- [ ] **Step 3: Add the `lint` script**

Find in `package.json`:

```json
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
```

Replace with:

```json
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
```

- [ ] **Step 4: Run lint and fix any findings**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx eslint .`
Expected: some warnings/errors are likely on first run (this codebase has never been linted). Fix anything reported - if fixes are needed, keep them minimal and mechanical (e.g. quote style, unused imports); do not restructure working code to satisfy a stylistic preference beyond what the linter flags. If a rule conflicts with a deliberate pattern used elsewhere in this codebase (e.g. `react-native/no-inline-styles` on a one-off style), it's fine to leave a rule violation as a warning rather than restructure - only `error`-level findings must be fixed.

- [ ] **Step 5: Verify**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx eslint . && npx tsc --noEmit && npx jest`
Expected: eslint exits 0 (warnings acceptable, no errors); tsc clean; all 10 tests still pass.

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add .eslintrc.js package.json package-lock.json
git commit -m "chore: add eslint tooling to study-rooms"
```

(If Step 4 required source fixes beyond config files, add those files to this same commit too.)

---

### Task 4: Remove unused `react-native-config` from `Chalmers-app-sommaren-2026`

**Repo:** `C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026\`

**Files:**
- Modify: `package.json`

**Interfaces:** None.

- [ ] **Step 1: Confirm it's genuinely unused**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && grep -rn "react-native-config" --include="*.ts" --include="*.tsx" . | grep -v node_modules`
Expected: no output (already confirmed during the earlier listings-repository review - this dependency has zero imports anywhere).

- [ ] **Step 2: Uninstall it**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npm uninstall react-native-config`
Expected: removes it from `dependencies` in `package.json` and `package-lock.json`.

- [ ] **Step 3: Verify nothing broke**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx tsc --noEmit && npx jest`
Expected: same pre-existing `chalmers-admin/` type errors as before (unrelated, unaffected); both jest suites still pass.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git add package.json package-lock.json
git commit -m "chore: remove unused react-native-config dependency"
```

---

### Task 5: Add CI workflow to `agila`

**Repo:** `C:\Users\jakob\Karappen\agila\`

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:** None.

- [ ] **Step 1: Write the workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint .
      - run: npm test
```

- [ ] **Step 2: Validate the YAML is well-formed**

Run: `cd "C:\Users\jakob\Karappen\agila" && node -e "require('js-yaml') ? null : null" 2>/dev/null; python -c "import yaml, sys; yaml.safe_load(open('.github/workflows/ci.yml'))" 2>&1 || echo "no python/js-yaml available - visually re-check indentation matches the block above exactly instead"
Expected: no parse error (or, if neither tool is available, re-read the file back and confirm indentation matches exactly - GitHub Actions YAML is whitespace-sensitive).

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jakob\Karappen\agila"
git add .github/workflows/ci.yml
git commit -m "ci: run typecheck, lint, and tests on push/PR"
```

Note in your task report: this workflow will not actually execute until the repo has a GitHub remote and is pushed there - that's expected, not a defect to fix in this task.

---

### Task 6: Add CI workflow to `study-rooms`

**Repo:** `C:\Users\jakob\Karappen\study-rooms\`

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the `lint` script added in Task 3. If Task 3 has not yet run, this task's `npx eslint .` step will fail on CI once pushed (it will not fail locally, since this task only creates the file) - complete Task 3 before Task 6 if running them out of order.

- [ ] **Step 1: Write the workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint .
      - run: npm test
```

- [ ] **Step 2: Validate and commit**

Same validation approach as Task 5, Step 2.

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add .github/workflows/ci.yml
git commit -m "ci: run typecheck, lint, and tests on push/PR"
```

---

### Task 7: Add CI workflow to `Chalmers-app-sommaren-2026`

**Repo:** `C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026\`

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:** None.

- [ ] **Step 1: Write the workflow**

This repo's root `tsconfig.json` sweeps up `chalmers-admin/` (a separate Vite app with its own, pre-existing, unrelated type errors - confirmed in the listings-repository work). CI must not fail on those. Scope the typecheck step to exclude that folder rather than running the bare root `tsc --noEmit`:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Typecheck (mobile app only, excludes chalmers-admin/)
        run: npx tsc --noEmit | grep -v "^chalmers-admin/" | (! grep .)
      - run: npx eslint .
      - run: npm test
      - name: Install and build chalmers-admin
        working-directory: chalmers-admin
        run: npm install && npm run build
```

- [ ] **Step 2: Verify the typecheck filter works locally**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx tsc --noEmit | grep -v "^chalmers-admin/" | (! grep .); echo "exit: $?"`
Expected: `exit: 0` - the pre-existing `chalmers-admin/` errors are filtered out and nothing else remains, so the pipeline succeeds. If this prints `exit: 1`, a NEW error exists outside `chalmers-admin/` - stop and report it rather than loosening the filter.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git add .github/workflows/ci.yml
git commit -m "ci: run typecheck, lint, and tests on push/PR"
```
