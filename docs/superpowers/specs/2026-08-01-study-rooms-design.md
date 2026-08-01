# Lediga grupprum (Free Study Rooms) — Design

Source: `Kravspecifikationer för idéer till kårappen`, page 2 ("Lediga grupprum").

## Goal

Let students find a free group room or open study area right now, filter
and sort the list, and (eventually) book a room — without waiting on
TimeEdit API access. The module is built and fully usable today against
mock data; swapping in real TimeEdit data later touches exactly one file.

## Module structure

Mirrors the existing `weekly-evaluation` module's pattern (standalone,
swappable repository, shared theme/i18n):

```
src/study-rooms/
├── types/
│   └── studyRoom.ts               # StudyRoom type, IStudyRoomRepository interface
├── services/
│   ├── MockStudyRoomRepository.ts # reads fixtures/rooms.json
│   └── fixtures/
│       └── rooms.json             # editable mock room list
├── hooks/
│   └── useStudyRooms.ts           # fetch + filter + sort state
├── components/
│   ├── RoomCard.tsx               # one row: name, building, free-until/static, size, whiteboard, shared badge, book link
│   ├── FilterBar.tsx              # search + building/size/whiteboard filters, sort control
│   └── TabSwitcher.tsx            # "Group rooms" / "Open areas" toggle
├── screens/
│   └── StudyRoomsScreen.tsx       # top-level screen, owns tab + filter state
└── example/
    └── ExampleUsage.tsx           # standalone wiring demo, like weekly-evaluation's
```

The module imports the **existing** `ThemeContext` and `I18nContext` from
`src/weekly-evaluation/theme` and `src/weekly-evaluation/i18n` rather than
duplicating them — those providers already wrap the whole app in
`App.tsx`, they're not evaluation-specific. No new npm dependencies. No
navigation library exists in this app, so — same as `weekly-evaluation` —
this stays a standalone screen the host app wires in later; it is not
bolted onto the real `App.tsx`.

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
