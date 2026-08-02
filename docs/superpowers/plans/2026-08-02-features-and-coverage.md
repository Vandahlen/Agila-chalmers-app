# Features and Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining functional gaps from the full-scan review - `study-rooms`' fixed sort, `weekly-evaluation`'s missing offline queueing - and the coverage gaps flagged during earlier reviews (error/retry path, UI-driven filtering, i18n persistence). Also document (not build) the auth/session extension point every repository interface is currently missing, since no real backend requires it yet.

**Architecture:** Two small features (adjustable sort, offline queueing), each landing with its own test in the same task (TDD). Four standalone test-only tasks closing coverage gaps in already-built code. One documentation-only task for the auth extension point - deliberately not code, since writing a speculative auth parameter nothing consumes would be exactly the kind of unrequested, unexercised surface YAGNI warns against.

**Tech Stack:** No new dependencies. Offline queueing uses `@react-native-async-storage/async-storage`, already a dependency of `agila`.

## Global Constraints

- **This plan assumes the repo-hygiene plan and the shared-UI-kit plan have already landed.** Every code sample below imports theme/`ChalmersText`/icons from `kar-ui-kit`, not from local duplicate files - if those plans haven't run yet, the import lines in this plan won't match what's on disk. Run this plan last.
- `study-rooms`' default sort behavior does not change - `sortByLongestAvailable` stays the default; the new sort option is additive, not a replacement.
- Offline queueing only ever affects the `weekly-evaluation` submit path - it does not touch loading questions, does not add a UI for "view queued submissions," and does not retry more aggressively than once per mount (no background timers, no push-based retry). This is the minimum viable version of "don't lose a submission if it fails," not a general offline-sync framework.
- The auth/session extension point is **documentation only** in this plan - do not add unused parameters, unused interfaces, or dead code paths for auth. If a real auth requirement shows up later, that's a new plan informed by what that requirement actually needs.

---

### Task 1: Adjustable sort order for `study-rooms`

**Repo:** `C:\Users\jakob\Karappen\study-rooms\`

**Files:**
- Modify: `services/roomFilters.ts`
- Test: `services/roomFilters.test.ts`
- Modify: `hooks/useStudyRooms.ts`
- Modify: `components/FilterBar.tsx`
- Modify: `screens/StudyRoomsScreen.tsx`
- Modify: `i18n/translations.ts`

**Interfaces:**
- Produces: `SortOrder = 'longest' | 'soonest'`, `sortBySoonestToFillUp(rooms: StudyRoom[]): StudyRoom[]`, `sortRoomsBy(rooms: StudyRoom[], order: SortOrder): StudyRoom[]` (from `roomFilters.ts`). `useStudyRooms`'s return value gains `sortOrder: SortOrder` and `setSortOrder: (order: SortOrder) => void`. `FilterBar` gains optional props `sortOrder?: SortOrder`, `onSortOrderChange?: (order: SortOrder) => void`, `showSort?: boolean`.

- [ ] **Step 1: Write the failing test for the new sort function**

Add to `services/roomFilters.test.ts` (append to the existing `describe('sortByLongestAvailable', ...)` block's file, as a new sibling `describe`):

```ts
describe('sortBySoonestToFillUp', () => {
  test('orders by ascending freeUntil, nulls last', () => {
    const rooms = [
      room({ id: 'longest', freeUntil: '2026-08-01T18:00:00.000Z' }),
      room({ id: 'open', freeUntil: null }),
      room({ id: 'soon', freeUntil: '2026-08-01T12:00:00.000Z' }),
    ];

    expect(sortBySoonestToFillUp(rooms).map((r) => r.id)).toEqual([
      'soon',
      'longest',
      'open',
    ]);
  });
});

describe('sortRoomsBy', () => {
  const rooms = [
    room({ id: 'longest', freeUntil: '2026-08-01T18:00:00.000Z' }),
    room({ id: 'soon', freeUntil: '2026-08-01T12:00:00.000Z' }),
  ];

  test('dispatches to sortByLongestAvailable for "longest"', () => {
    expect(sortRoomsBy(rooms, 'longest').map((r) => r.id)).toEqual(['longest', 'soon']);
  });

  test('dispatches to sortBySoonestToFillUp for "soonest"', () => {
    expect(sortRoomsBy(rooms, 'soonest').map((r) => r.id)).toEqual(['soon', 'longest']);
  });
});
```

Also update the top of the file's import line from:
```ts
import { DEFAULT_ROOM_FILTERS, filterRooms, sortByLongestAvailable } from './roomFilters';
```
to:
```ts
import { DEFAULT_ROOM_FILTERS, filterRooms, sortByLongestAvailable, sortBySoonestToFillUp, sortRoomsBy } from './roomFilters';
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest services/roomFilters.test.ts`
Expected: FAIL - `sortBySoonestToFillUp`/`sortRoomsBy` are not exported yet.

- [ ] **Step 3: Add the new functions to `roomFilters.ts`**

Append to the end of `services/roomFilters.ts` (keep everything already there unchanged):

```ts
export type SortOrder = 'longest' | 'soonest';

export function sortBySoonestToFillUp(rooms: StudyRoom[]): StudyRoom[] {
  return [...rooms].sort((a, b) => {
    if (a.freeUntil === null && b.freeUntil === null) return 0;
    if (a.freeUntil === null) return 1;
    if (b.freeUntil === null) return -1;
    return new Date(a.freeUntil).getTime() - new Date(b.freeUntil).getTime();
  });
}

export function sortRoomsBy(rooms: StudyRoom[], order: SortOrder): StudyRoom[] {
  return order === 'soonest' ? sortBySoonestToFillUp(rooms) : sortByLongestAvailable(rooms);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest services/roomFilters.test.ts`
Expected: PASS (11 tests total - 8 existing + 3 new).

- [ ] **Step 5: Add `sortOrder` state to `useStudyRooms`**

In `hooks/useStudyRooms.ts`, find:

```ts
import {
  DEFAULT_ROOM_FILTERS,
  RoomFilters,
  filterRooms,
  sortByLongestAvailable,
} from '../services/roomFilters';
```

replace with:

```ts
import {
  DEFAULT_ROOM_FILTERS,
  RoomFilters,
  SortOrder,
  filterRooms,
  sortRoomsBy,
} from '../services/roomFilters';
```

Find:

```ts
  const [filters, setFilters] = useState<RoomFilters>(DEFAULT_ROOM_FILTERS);
```

replace with:

```ts
  const [filters, setFilters] = useState<RoomFilters>(DEFAULT_ROOM_FILTERS);
  const [sortOrder, setSortOrder] = useState<SortOrder>('longest');
```

Find:

```ts
  const visibleRooms = useMemo(() => {
    const wantBookable = tab === 'bookable';
    const scoped = rooms.filter((room) => room.bookable === wantBookable);
    const filtered = filterRooms(scoped, filters);
    return wantBookable ? sortByLongestAvailable(filtered) : filtered;
  }, [rooms, tab, filters]);
```

replace with:

```ts
  const visibleRooms = useMemo(() => {
    const wantBookable = tab === 'bookable';
    const scoped = rooms.filter((room) => room.bookable === wantBookable);
    const filtered = filterRooms(scoped, filters);
    return wantBookable ? sortRoomsBy(filtered, sortOrder) : filtered;
  }, [rooms, tab, filters, sortOrder]);
```

Find the `return` statement:

```ts
  return {
    loadState,
    tab,
    setTab,
    filters,
    setSearch,
    setMinCapacity,
    setWhiteboardOnly,
    visibleRooms,
    reload: load,
  };
```

replace with:

```ts
  return {
    loadState,
    tab,
    setTab,
    filters,
    setSearch,
    setMinCapacity,
    setWhiteboardOnly,
    sortOrder,
    setSortOrder,
    visibleRooms,
    reload: load,
  };
```

- [ ] **Step 6: Add the two new translation keys**

In `i18n/translations.ts`, find:

```ts
  studyRoomsEmpty: string;
}
```

replace with:

```ts
  studyRoomsEmpty: string;
  studyRoomsSortLongest: string;
  studyRoomsSortSoonest: string;
}
```

Find (in the `en` object):

```ts
    studyRoomsEmpty: 'No rooms match your filters right now.',
  },
```

replace with:

```ts
    studyRoomsEmpty: 'No rooms match your filters right now.',
    studyRoomsSortLongest: 'Longest available',
    studyRoomsSortSoonest: 'Soonest to fill up',
  },
```

Find (in the `sv` object):

```ts
    studyRoomsEmpty: 'Inga rum matchar dina filter just nu.',
  },
```

replace with:

```ts
    studyRoomsEmpty: 'Inga rum matchar dina filter just nu.',
    studyRoomsSortLongest: 'Längst tillgänglighet',
    studyRoomsSortSoonest: 'Snarast ledigt',
  },
```

- [ ] **Step 7: Add the sort toggle UI to `FilterBar`**

In `components/FilterBar.tsx`, find:

```tsx
export interface FilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  minCapacity: number | null;
  onMinCapacityChange: (minCapacity: number | null) => void;
  whiteboardOnly: boolean;
  onWhiteboardOnlyChange: (whiteboardOnly: boolean) => void;
}
```

replace with:

```tsx
export interface FilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  minCapacity: number | null;
  onMinCapacityChange: (minCapacity: number | null) => void;
  whiteboardOnly: boolean;
  onWhiteboardOnlyChange: (whiteboardOnly: boolean) => void;
  sortOrder?: SortOrder;
  onSortOrderChange?: (order: SortOrder) => void;
  showSort?: boolean;
}
```

Add `SortOrder` to the import from `kar-ui-kit`... actually `SortOrder` comes from `../services/roomFilters`, not `kar-ui-kit` - find the existing import block for `roomFilters`-adjacent types (there isn't one yet in this file; add a new import line right after the `kar-ui-kit` import):

```tsx
import type { SortOrder } from '../services/roomFilters';
```

Find the function signature:

```tsx
const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  minCapacity,
  onMinCapacityChange,
  whiteboardOnly,
  onWhiteboardOnlyChange,
}) => {
```

replace with:

```tsx
const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  minCapacity,
  onMinCapacityChange,
  whiteboardOnly,
  onWhiteboardOnlyChange,
  sortOrder,
  onSortOrderChange,
  showSort = false,
}) => {
```

Find the closing of the `chipRow` `View` (the whiteboard-toggle `Pressable` followed by the closing `</View>` of `chipRow`, then the closing `</View>` of `container`):

```tsx
        <Pressable
          onPress={() => onWhiteboardOnlyChange(!whiteboardOnly)}
          style={[
            styles.chip,
            { borderColor: theme.border },
            whiteboardOnly && { backgroundColor: colors.bla, borderColor: colors.bla },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: whiteboardOnly }}
        >
          <ChalmersText variant="caption1" color={whiteboardOnly ? colors.white : theme.text}>
            {t.studyRoomsWhiteboardBadge}
          </ChalmersText>
        </Pressable>
      </View>
    </View>
  );
};
```

replace with:

```tsx
        <Pressable
          onPress={() => onWhiteboardOnlyChange(!whiteboardOnly)}
          style={[
            styles.chip,
            { borderColor: theme.border },
            whiteboardOnly && { backgroundColor: colors.bla, borderColor: colors.bla },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: whiteboardOnly }}
        >
          <ChalmersText variant="caption1" color={whiteboardOnly ? colors.white : theme.text}>
            {t.studyRoomsWhiteboardBadge}
          </ChalmersText>
        </Pressable>
      </View>

      {showSort && onSortOrderChange && (
        <View style={styles.sortRow}>
          {(['longest', 'soonest'] as SortOrder[]).map((option) => {
            const selected = sortOrder === option;
            return (
              <Pressable
                key={option}
                onPress={() => onSortOrderChange(option)}
                style={[
                  styles.chip,
                  { borderColor: theme.border },
                  selected && { backgroundColor: colors.bla, borderColor: colors.bla },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <ChalmersText variant="caption1" color={selected ? colors.white : theme.text}>
                  {option === 'longest' ? t.studyRoomsSortLongest : t.studyRoomsSortSoonest}
                </ChalmersText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};
```

Find the `styles` object's `chipRow` entry:

```tsx
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
```

Add a new `sortRow` entry immediately after it (same shape, its own row so sort options don't wrap into the filter chips):

```tsx
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
```

- [ ] **Step 8: Wire it into `StudyRoomsScreen`**

In `screens/StudyRoomsScreen.tsx`, find:

```tsx
  const {
    loadState,
    tab,
    setTab,
    filters,
    setSearch,
    setMinCapacity,
    setWhiteboardOnly,
    visibleRooms,
    reload,
  } = useStudyRooms({ repository });
```

replace with:

```tsx
  const {
    loadState,
    tab,
    setTab,
    filters,
    setSearch,
    setMinCapacity,
    setWhiteboardOnly,
    sortOrder,
    setSortOrder,
    visibleRooms,
    reload,
  } = useStudyRooms({ repository });
```

Find:

```tsx
      <FilterBar
        search={filters.search}
        onSearchChange={setSearch}
        minCapacity={filters.minCapacity}
        onMinCapacityChange={setMinCapacity}
        whiteboardOnly={filters.whiteboardOnly}
        onWhiteboardOnlyChange={setWhiteboardOnly}
      />
```

replace with:

```tsx
      <FilterBar
        search={filters.search}
        onSearchChange={setSearch}
        minCapacity={filters.minCapacity}
        onMinCapacityChange={setMinCapacity}
        whiteboardOnly={filters.whiteboardOnly}
        onWhiteboardOnlyChange={setWhiteboardOnly}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        showSort={tab === 'bookable'}
      />
```

- [ ] **Step 9: Add an integration test for the sort toggle**

Append to `screens/StudyRoomsScreen.test.tsx`:

```tsx
test('switching sort order to soonest reorders the bookable rooms', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderScreen();
  });

  const soonestButton = renderer!.root.findByProps({ children: 'Soonest to fill up' });
  await ReactTestRenderer.act(async () => {
    soonestButton.parent!.props.onPress();
  });

  const output = JSON.stringify(renderer!.toJSON());
  const idxMl2 = output.indexOf('ML2');
  const idxEdit5128 = output.indexOf('EDIT 5128');
  const idxEdit3103 = output.indexOf('EDIT 3103');
  const idxSbH3 = output.indexOf('SB-H3');
  expect(idxMl2).toBeLessThan(idxEdit5128);
  expect(idxEdit5128).toBeLessThan(idxEdit3103);
  expect(idxEdit3103).toBeLessThan(idxSbH3);
});
```

- [ ] **Step 10: Verify the full suite**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx tsc --noEmit && npx eslint . && npx jest`
Expected: no type/lint errors; 4 test suites now (the new test brings `StudyRoomsScreen.test.tsx` to 3 tests), all passing.

- [ ] **Step 11: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add services/roomFilters.ts services/roomFilters.test.ts hooks/useStudyRooms.ts components/FilterBar.tsx screens/StudyRoomsScreen.tsx screens/StudyRoomsScreen.test.tsx i18n/translations.ts
git commit -m "feat: add adjustable sort order (longest available / soonest to fill up)"
```

---

### Task 2: Offline queueing for `weekly-evaluation` submissions

**Repo:** `C:\Users\jakob\Karappen\agila\`

**Files:**
- Create: `src/weekly-evaluation/services/offlineQueue.ts`
- Test: `src/weekly-evaluation/services/offlineQueue.test.ts`
- Modify: `src/weekly-evaluation/hooks/useWeeklyEvaluation.ts`

**Interfaces:**
- Consumes: `IEvaluationRepository`, `EvaluationPayload` from `../types/evaluation`.
- Produces: `enqueuePayload(payload: EvaluationPayload): Promise<void>`, `flushQueue(repository: IEvaluationRepository): Promise<number>` (returns count successfully flushed). `useWeeklyEvaluation` calls both - `flushQueue` once on mount (alongside loading questions), `enqueuePayload` when a submit fails.

- [ ] **Step 1: Write the failing test**

```ts
// src/weekly-evaluation/services/offlineQueue.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueuePayload, flushQueue } from './offlineQueue';
import { EvaluationPayload, IEvaluationRepository } from '../types/evaluation';

const payload = (id: string): EvaluationPayload => ({
  notification_id: id,
  program: 'Computer Science',
  study_year: 2,
  submitted_at: '2026-08-02T10:00:00.000Z',
  answers: [],
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('enqueuePayload persists a payload for later flushing', async () => {
  await enqueuePayload(payload('a'));
  const stored = await AsyncStorage.getItem('weekly-evaluation.offline-queue');
  expect(JSON.parse(stored!)).toHaveLength(1);
});

test('flushQueue submits every queued payload and clears the queue on success', async () => {
  await enqueuePayload(payload('a'));
  await enqueuePayload(payload('b'));

  const submitted: string[] = [];
  const repository: IEvaluationRepository = {
    getQuestions: async () => [],
    submitEvaluation: async (p) => {
      submitted.push(p.notification_id);
    },
  };

  const count = await flushQueue(repository);

  expect(count).toBe(2);
  expect(submitted).toEqual(['a', 'b']);
  const stored = await AsyncStorage.getItem('weekly-evaluation.offline-queue');
  expect(JSON.parse(stored!)).toEqual([]);
});

test('flushQueue keeps a payload queued if submission fails', async () => {
  await enqueuePayload(payload('a'));

  const repository: IEvaluationRepository = {
    getQuestions: async () => [],
    submitEvaluation: async () => {
      throw new Error('network down');
    },
  };

  const count = await flushQueue(repository);

  expect(count).toBe(0);
  const stored = await AsyncStorage.getItem('weekly-evaluation.offline-queue');
  expect(JSON.parse(stored!)).toHaveLength(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd "C:\Users\jakob\Karappen\agila" && npx jest src/weekly-evaluation/services/offlineQueue.test.ts`
Expected: FAIL - `Cannot find module './offlineQueue'`

- [ ] **Step 3: Write `offlineQueue.ts`**

```ts
// src/weekly-evaluation/services/offlineQueue.ts
/**
 * services/offlineQueue.ts
 *
 * Minimum-viable "don't lose a submission if it fails" layer: a
 * failed submit is persisted to AsyncStorage; the next successful
 * app start (or manual reload) retries every queued payload once.
 * Not a general offline-sync framework - no background timers, no
 * push-based retry, no queue-viewing UI.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EvaluationPayload, IEvaluationRepository } from '../types/evaluation';

const QUEUE_KEY = 'weekly-evaluation.offline-queue';

async function readQueue(): Promise<EvaluationPayload[]> {
  const stored = await AsyncStorage.getItem(QUEUE_KEY);
  return stored ? JSON.parse(stored) : [];
}

async function writeQueue(queue: EvaluationPayload[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueuePayload(payload: EvaluationPayload): Promise<void> {
  const queue = await readQueue();
  queue.push(payload);
  await writeQueue(queue);
}

/** Attempts to submit every queued payload once. Returns the count that succeeded. */
export async function flushQueue(repository: IEvaluationRepository): Promise<number> {
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  const stillQueued: EvaluationPayload[] = [];
  let succeeded = 0;

  for (const payload of queue) {
    try {
      await repository.submitEvaluation(payload);
      succeeded += 1;
    } catch {
      stillQueued.push(payload);
    }
  }

  await writeQueue(stillQueued);
  return succeeded;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd "C:\Users\jakob\Karappen\agila" && npx jest src/weekly-evaluation/services/offlineQueue.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire it into `useWeeklyEvaluation`**

Find:

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EvaluationPayload,
  IEvaluationRepository,
  Question,
  QuestionAnswer,
} from '../types/evaluation';
```

replace with:

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EvaluationPayload,
  IEvaluationRepository,
  Question,
  QuestionAnswer,
} from '../types/evaluation';
import { enqueuePayload, flushQueue } from '../services/offlineQueue';
```

Find:

```ts
  const loadQuestions = useCallback(async () => {
    setLoadState('loading');
    try {
      const fetched = await repository.getQuestions();
      setQuestions(fetched);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [repository]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);
```

replace with:

```ts
  const loadQuestions = useCallback(async () => {
    setLoadState('loading');
    try {
      const fetched = await repository.getQuestions();
      setQuestions(fetched);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [repository]);

  useEffect(() => {
    loadQuestions();
    flushQueue(repository);
  }, [loadQuestions, repository]);
```

Find:

```ts
    try {
      await repository.submitEvaluation(payload);
      setSubmitState('idle');
      onEvaluationFinished(notificationId);
    } catch {
      setSubmitState('error');
    }
  }, [answers, notificationId, onEvaluationFinished, repository, studentContext]);
```

replace with:

```ts
    try {
      await repository.submitEvaluation(payload);
      setSubmitState('idle');
      onEvaluationFinished(notificationId);
    } catch {
      await enqueuePayload(payload);
      setSubmitState('error');
    }
  }, [answers, notificationId, onEvaluationFinished, repository, studentContext]);
```

- [ ] **Step 6: Verify the full suite**

Run: `cd "C:\Users\jakob\Karappen\agila" && npx tsc --noEmit && npx eslint . && npx jest`
Expected: zero output from `tsc --noEmit`; no lint errors; `__tests__/App.test.tsx` and the new `offlineQueue.test.ts` both pass.

- [ ] **Step 7: Commit**

```bash
cd "C:\Users\jakob\Karappen\agila"
git add src/weekly-evaluation/services/offlineQueue.ts src/weekly-evaluation/services/offlineQueue.test.ts src/weekly-evaluation/hooks/useWeeklyEvaluation.ts
git commit -m "feat: queue failed evaluation submits and retry once on next load"
```

---

### Task 3: `study-rooms` error/retry path test

**Repo:** `C:\Users\jakob\Karappen\study-rooms\`

**Files:**
- Test: `screens/StudyRoomsScreen.test.tsx`

**Interfaces:**
- Consumes: `IStudyRoomRepository` (a throwing test double built inline in the test file - not a new production file, since nothing else needs a "repository that always fails").

- [ ] **Step 1: Add the failing-repository test**

Append to `screens/StudyRoomsScreen.test.tsx`:

```tsx
test('shows an error state with a working retry when the repository rejects', async () => {
  let attempts = 0;
  const failingRepository: import('../types/studyRoom').IStudyRoomRepository = {
    getRooms: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('network down');
      return [];
    },
  };

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <I18nProvider>
          <StudyRoomsScreen repository={failingRepository} />
        </I18nProvider>
      </ThemeProvider>,
    );
  });

  let output = JSON.stringify(renderer!.toJSON());
  expect(output).toContain("Couldn't load study rooms.");

  const retryButton = renderer!.root.findByProps({ children: 'Try again' });
  await ReactTestRenderer.act(async () => {
    retryButton.parent!.props.onPress();
  });

  output = JSON.stringify(renderer!.toJSON());
  expect(output).toContain('No rooms match your filters right now.');
  expect(attempts).toBe(2);
});
```

- [ ] **Step 2: Run and verify**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest screens/StudyRoomsScreen.test.tsx`
Expected: PASS (this test plus the two/three already there).

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add screens/StudyRoomsScreen.test.tsx
git commit -m "test: cover the error/retry path with a failing repository double"
```

---

### Task 4: `study-rooms` UI-driven filter test

**Repo:** `C:\Users\jakob\Karappen\study-rooms\`

**Files:**
- Test: `screens/StudyRoomsScreen.test.tsx`

**Interfaces:** None new - exercises the existing `FilterBar` -> `useStudyRooms` -> `visibleRooms` pipeline end to end, which until now was only covered indirectly (tab default) or at the pure-function level (`roomFilters.test.ts`).

- [ ] **Step 1: Add the test**

Append to `screens/StudyRoomsScreen.test.tsx`:

```tsx
test('typing in the search box filters the visible rooms', async () => {
  const { TextInput } = require('react-native');
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderScreen();
  });

  const searchInput = renderer!.root.findByType(TextInput);
  await ReactTestRenderer.act(async () => {
    searchInput.props.onChangeText('Sven Hultin');
  });

  const output = JSON.stringify(renderer!.toJSON());
  expect(output).toContain('SB-H3');
  expect(output).not.toContain('EDIT 5128');
  expect(output).not.toContain('ML2');
});
```

- [ ] **Step 2: Run and verify**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest screens/StudyRoomsScreen.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add screens/StudyRoomsScreen.test.tsx
git commit -m "test: cover UI-driven search filtering end to end"
```

---

### Task 5: `I18nContext` persistence test in `study-rooms`

**Repo:** `C:\Users\jakob\Karappen\study-rooms\`

**Files:**
- Test: `i18n/I18nContext.test.tsx`

**Interfaces:** None new - tests the existing `I18nProvider`/`useI18n`.

- [ ] **Step 1: Write the test**

```tsx
// i18n/I18nContext.test.tsx
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nProvider, useI18n } from './I18nContext';

function Probe(): React.JSX.Element {
  const { lang, toggleLang } = useI18n();
  return React.createElement('probe' as any, { lang, toggleLang });
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('defaults to sv and persists a toggle to en across remounts', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
  });

  let probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('sv');

  await ReactTestRenderer.act(async () => {
    probe.props.toggleLang();
  });

  probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('en');

  const stored = await AsyncStorage.getItem('study-rooms.language');
  expect(stored).toBe('en');

  // Remount - should read the persisted value back on next launch.
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
  });

  probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('en');
});
```

- [ ] **Step 2: Run and verify**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest i18n/I18nContext.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add i18n/I18nContext.test.tsx
git commit -m "test: cover I18nContext language persistence across remounts"
```

---

### Task 6: `I18nContext` persistence test in `agila`'s `weekly-evaluation`

**Repo:** `C:\Users\jakob\Karappen\agila\`

**Files:**
- Test: `src/weekly-evaluation/i18n/I18nContext.test.tsx`

**Interfaces:** None new - same test shape as Task 5, adapted to this repo's storage key (`weekly-evaluation.language`) and default language (`sv`, per `src/weekly-evaluation/i18n/I18nContext.tsx`'s `DEFAULT_LANGUAGE`).

- [ ] **Step 1: Write the test**

```tsx
// src/weekly-evaluation/i18n/I18nContext.test.tsx
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nProvider, useI18n } from './I18nContext';

function Probe(): React.JSX.Element {
  const { lang, toggleLang } = useI18n();
  return React.createElement('probe' as any, { lang, toggleLang });
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('defaults to sv and persists a toggle to en across remounts', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
  });

  let probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('sv');

  await ReactTestRenderer.act(async () => {
    probe.props.toggleLang();
  });

  probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('en');

  const stored = await AsyncStorage.getItem('weekly-evaluation.language');
  expect(stored).toBe('en');

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
  });

  probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('en');
});
```

- [ ] **Step 2: Run and verify**

Run: `cd "C:\Users\jakob\Karappen\agila" && npx jest src/weekly-evaluation/i18n/I18nContext.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jakob\Karappen\agila"
git add src/weekly-evaluation/i18n/I18nContext.test.tsx
git commit -m "test: cover I18nContext language persistence across remounts"
```

---

### Task 7: Document the auth/session extension point (all three repos)

**Files:**
- Modify: `C:\Users\jakob\Karappen\agila\src\weekly-evaluation\README.md`
- Modify: `C:\Users\jakob\Karappen\study-rooms\README.md`
- Modify: `C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026\README.md` (create the "Known gaps" section if this file doesn't have one yet - check first)

**Interfaces:** None - documentation only, per this plan's Global Constraints.

- [ ] **Step 1: `agila`'s `weekly-evaluation` README**

In the "Known gaps / extension points" section (already touched by the repo-hygiene plan's Task 2), append a bullet:

```markdown
- `IEvaluationRepository` assumes an already-configured client - no
  per-user auth/session identity is threaded through it today. A real
  auth requirement would add a parameter to
  `createSupabaseEvaluationRepository` (e.g. a token provider merged
  into request headers), not something a backend swap gives you for
  free.
```

- [ ] **Step 2: `study-rooms`'s README**

Find the "Known gaps / extension points" section's list and append:

```markdown
- **No auth/session identity** - `IStudyRoomRepository` assumes an
  already-configured client, same as `weekly-evaluation`. A real
  TimeEdit integration requiring per-user identity would add that as
  a new parameter to the repository factory, not something this
  interface currently provides.
```

- [ ] **Step 3: `Chalmers-app-sommaren-2026`'s README**

Check if `C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026\README.md` exists and has a "Known gaps" or similar section. If it doesn't have one, add this section at the end of the file:

```markdown
## Known gaps / extension points

- **No auth/session identity** - `IListingsRepository` assumes an
  already-configured Supabase client (anon key, no per-user session).
  A real auth requirement would add a parameter to
  `createSupabaseListingsRepository`, not something swapping
  implementations gives you for free.
- **No write path for the external submission form** - the "Utomstående
  får fylla i ett formulär för att skapa annons" feature from the
  original spec isn't built; `IListingsRepository` only has
  `fetchAllListings`.
```

If the file already has a "Known gaps" section, append these two bullets to it instead of creating a duplicate section.

- [ ] **Step 4: Commit each repo separately**

```bash
cd "C:\Users\jakob\Karappen\agila"
git add src/weekly-evaluation/README.md
git commit -m "docs: note the missing auth/session extension point"
```

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add README.md
git commit -m "docs: note the missing auth/session extension point"
```

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git add README.md
git commit -m "docs: note the missing auth/session extension point and submission-form gap"
```
