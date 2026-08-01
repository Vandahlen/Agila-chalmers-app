# Kårappen Profile Icons — Design

Source: `KAR-Grafisk profil-020726-075626.pdf` (the official Kårappen
graphic profile), pages 2-3 ("Ikoner").

## Goal

The graphic profile specifies a small icon set (search, filter,
language flags, plus arrows/plus/cross/settings/favorite/geotag/foot/
inbox/eye, none of which have a consumer yet). Retrofit real icon
components — instead of plain text or emoji — into the three places
across the three Kårappen-related repos that already have a UI
concept an icon belongs on: search inputs, filter chip rows, and
language toggles.

The PDF is a raster screenshot of an Adobe XD mockup, not exported
vector source — there is no exact path data to copy. Icons are
therefore hand-authored SVG components approximating each glyph's
shape (magnifying glass, sliders, flag pair), not a pixel-exact trace
of the original file.

## Scope

Only icons with a real consumer today, across three separate repos
(no shared package between them — each repo duplicates its own
copies, same pattern already used for theme/i18n):

| Icon | Repo | Where it attaches |
|---|---|---|
| Search (magnifying glass) | `study-rooms` | Leading icon inside `FilterBar`'s search `TextInput` |
| Filter (sliders) | `study-rooms` | Small label icon above/beside the capacity+whiteboard filter chips |
| Search (magnifying glass) | `Chalmers-app-sommaren-2026` | Leading icon inside its existing search `TextInput` |
| Language (UK/SE flag pair) | `agila` (`weekly-evaluation`) | Replaces the raw flag emoji (🇬🇧/🇸🇪) in `App.tsx`'s language toggle |
| Language (UK/SE flag pair) | `Chalmers-app-sommaren-2026` | Replaces the plain text "EN"/"SV" toggle button with flag icons |

**Explicitly not built now** (no real consumer exists to attach them
to): Menyikoner (the mockup's Home/Food/Event/Gym nav-bar example is
illustrative, not a requirement), Pilar (arrows), Plus, Kryss (cross),
Inställningar (settings), Favorit (heart), Geotag (pin), Fot
(footprint), Inkorg (inbox), Öga (eye). Add these later as an
extension point when a screen actually needs one.

## Dependency

`react-native-svg` is added to each repo that gets an icon (`agila`,
`study-rooms`, `Chalmers-app-sommaren-2026`) — none of the three have
it or any other icon/SVG library today. Icons are `Svg`/`Path`/
`Circle`/`Line` primitives, matching the existing "primitive
component" pattern (`ChalmersText`/`ChalmersButton`).

**Native step required for two of the three repos.** `agila` and
`Chalmers-app-sommaren-2026` both have real `android`/`ios` native
project folders — after `npm install react-native-svg`, an iOS build
needs `pod install` and both platforms need a rebuild before the
icons render on a device/simulator/emulator. This is a manual step
the user runs themselves; it isn't verifiable by an automated
type-check or Jest run. `study-rooms` has no native project (jest/tsc
only), so adding the dependency there is a pure JS/type-check concern
with no native step.

## Component shape

Each repo gets its own copy of a small `IconProps` contract, matching
that repo's existing primitive-component conventions (theme-aware
color, default size):

```ts
interface IconProps {
  size?: number;   // default 20
  color?: string;  // defaults to the repo's theme.subText or theme.text
}
```

- **`SearchIcon`** — `study-rooms`, `Chalmers-app-sommaren-2026`. A
  circle plus a short diagonal line (magnifying glass), stroke-only,
  matching each repo's `theme.subText` by default.
- **`FilterIcon`** — `study-rooms` only. Three horizontal lines of
  decreasing length with a small circle "handle" offset on
  alternating sides (the standard sliders/filter glyph).
- **`FlagUK`** / **`FlagSE`** — `agila`, `Chalmers-app-sommaren-2026`.
  Small rectangular flag icons (Union Jack cross pattern / Swedish
  cross on blue), rendered as a pair in the language toggle exactly
  where the emoji/text currently sit — same opacity-dims-the-inactive-
  one treatment the current UI already has.

## Integration per repo

- **`study-rooms`**: `SearchIcon` renders inside `FilterBar`'s
  `TextInput` row (leading position); `FilterIcon` renders as a small
  label icon next to the existing capacity/whiteboard chip row. Both
  are purely additive to `FilterBar.tsx` — no prop-shape changes to
  `FilterBar`'s existing consumers.
- **`agila` (`weekly-evaluation`)**: `App.tsx`'s language toggle
  (`styles.langToggle` `TouchableOpacity`) swaps its two
  `ChalmersText` children (rendering flag emoji) for `<FlagUK />` /
  `<FlagSE />`, keeping the existing `langFlagInactive` opacity style
  applied to whichever isn't active.
- **`Chalmers-app-sommaren-2026`**: the search `TextInput` gets a
  leading `SearchIcon` (same treatment as `study-rooms`); the
  `langToggle` button's plain "EN"/"SV" `Text` is replaced with the
  `FlagUK`/`FlagSE` pair, same dim-the-inactive-one treatment.

## Testing

These are small, pure presentational SVG components — no dedicated
icon-only test files, matching how `ChalmersButton`/`ChalmersText`
aren't unit-tested individually either. Verification is:
- `npx tsc --noEmit` in each repo (confirms the components compile
  and prop types line up).
- The existing screen/App smoke test in each repo (`study-rooms`'s
  `StudyRoomsScreen.test.tsx`, `agila`'s `__tests__/App.test.tsx`) is
  re-run to confirm nothing breaks by rendering an `Svg` tree instead
  of `Text`/emoji — `Chalmers-app-sommaren-2026` gets a same-shape
  smoke test added if one doesn't already exist for its `App.tsx`.

## Out of scope

- The remaining ~10 profile icons with no current consumer (see
  Scope above).
- Any shared icon package between the three repos — each stays a
  self-contained duplicate, consistent with the existing theme/i18n
  duplication pattern.
- Pixel-exact reproduction of the original XD file's icon artwork —
  not possible without the source file; these are approximations of
  the same concept/silhouette.
