# Lediga grupprum (Free Study Rooms) — Design

Source: `Kravspecifikationer för idéer till kårappen`, page 2 ("Lediga grupprum").

## Goal

Let students find a free group room or open study area right now, filter
and sort the list, and (eventually) book a room — without waiting on
TimeEdit API access. The module is built and fully usable today against
mock data; swapping in real TimeEdit data later touches exactly one file.

## Module structure

Lives in its own top-level folder, `Karappen/study-rooms/`, as a sibling
to the `agila` app rather than inside it. It follows the same internal
pattern as `agila/src/weekly-evaluation` (standalone, swappable
repository) but is a self-contained package: its own `package.json`,
`tsconfig.json`, `babel.config.js`, and `jest.config.js`, so it
type-checks and tests independently of `agila`. It is not wired into
the `agila` app or built as a runnable RN app on its own (no
`android`/`ios`/entry point) — it's the feature module, ready to be
dropped into whichever host app integrates it.

```
study-rooms/
├── package.json / tsconfig.json / babel.config.js / jest.config.js / jest.setup.js
├── theme/
│   ├── theme.ts                    # copied from weekly-evaluation's theme tokens
│   └── ThemeContext.tsx
├── i18n/
│   ├── translations.ts             # only this module's studyRooms* copy (EN/SV)
│   └── I18nContext.tsx
├── components/
│   ├── ChalmersText.tsx            # copied typography primitive
│   ├── ChalmersButton.tsx          # copied button primitive
│   ├── RoomCard.tsx                # one row: name, building, free-until/static, size, whiteboard, shared badge, book link
│   ├── FilterBar.tsx               # search + building/size/whiteboard filters, sort control
│   └── TabSwitcher.tsx             # "Group rooms" / "Open areas" toggle
├── types/
│   └── studyRoom.ts                # StudyRoom type, IStudyRoomRepository interface
├── services/
│   ├── roomFilters.ts              # pure filter/sort logic
│   ├── MockStudyRoomRepository.ts  # reads fixtures/rooms.json
│   └── fixtures/
│       └── rooms.json              # editable mock room list
├── hooks/
│   └── useStudyRooms.ts            # fetch + filter + sort state
├── screens/
│   └── StudyRoomsScreen.tsx        # top-level screen, owns tab + filter state
└── example/
    └── ExampleUsage.tsx            # standalone wiring demo
```

Because Metro only bundles within a project's own root, this module
cannot import `agila/src/weekly-evaluation`'s theme/i18n across the
folder boundary — the small pieces it needs (brand color/type tokens,
the theme/i18n context providers, `ChalmersText`/`ChalmersButton`) are
copied in rather than shared. This trades a small amount of duplication
now for a module that builds and tests standalone; `translations.ts`
here only carries this module's own `studyRooms*` keys, not the
evaluation module's unrelated copy. No new *kinds* of dependency are
introduced — same React/React Native/async-storage versions as `agila`.

## Data model & repository (the TimeEdit seam)

```ts
interface StudyRoom {
  id: string;
  name: string;
  building: string;
  capacity: number;
  hasWhiteboard: boolean;
  isShared: boolean;
  otherHalfFree?: boolean;   // only meaningful when isShared
  bookable: boolean;         // true = "Group rooms" tab, false = "Open areas" tab
  freeUntil: string | null;  // ISO timestamp; null for open areas (no live data)
  bookingUrl?: string;       // placeholder booking-page URL, only when bookable
}

interface IStudyRoomRepository {
  getRooms(): Promise<StudyRoom[]>;
}
```

One method, one shape. The screen splits the list into two tabs
client-side by `bookable`. `MockStudyRoomRepository` just reads the
bundled JSON fixture. Swapping in a `TimeEditStudyRoomRepository` later
means writing one new class implementing `IStudyRoomRepository` —
zero changes to any component, hook, or screen.

## Screen behavior

- **Two tabs**: "Group rooms" (bookable, live `freeUntil`) and "Open
  areas" (first-come-first-served, same card fields, no booking action).
- **Group rooms tab**: search bar + filter chips (building, min size,
  whiteboard) + sort control. Default sort is **longest-available-first**
  (descending `freeUntil`), per the spec's written requirement (the
  mockup screenshot's "soonest to fill up" label is not used). "Book this
  room →" opens the placeholder generic booking-page URL.
- **Open areas tab**: same filters (building / size / whiteboard) minus
  sort-by-availability (nothing to sort by, since `freeUntil` is null);
  no book button.
- **Shared rooms**: `RoomCard` shows a badge with `otherHalfFree` status
  whenever `isShared` is true.
- All filtering/sorting is client-side over the full room list — no
  pagination or server-side query needed for mock data volumes.

## Error handling

Same shape as `weekly-evaluation`: a failed `getRooms()` call surfaces an
inline error state with a retry action; no offline queueing (there's
nothing to queue — this is a read-only feature).

## Testing

One smoke test per non-trivial piece of logic:
- `useStudyRooms` hook: filtering (building/size/whiteboard) and sorting
  (longest-available-first) produce the expected order/subset given a
  fixed fixture list.
- `MockStudyRoomRepository`: resolves the fixture data unchanged.

## Explicitly deferred (not in this pass)

- **Program-based building sort** ("sortera beroende på var olika
  program oftare håller hus") — needs a building↔program mapping that
  doesn't exist as data yet. Add once that mapping exists.
- **Real TimeEdit integration** — swap `MockStudyRoomRepository` for a
  `TimeEditStudyRoomRepository` once API access is confirmed; also
  enables per-room deep-linked booking instead of the placeholder URL.
- **Live occupancy for open areas** — nothing currently tracks
  first-come space occupancy, so the "Open areas" tab is static
  directory info only (building/size/whiteboard), not live status.
