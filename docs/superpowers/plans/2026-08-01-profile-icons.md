# Kårappen Profile Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace text/emoji stand-ins with real hand-authored SVG icons (search, filter, language flags) in the three places across three separate repos that already have a UI concept an icon belongs on.

**Architecture:** Each repo gets its own small icon components (`react-native-svg` primitives: `Svg`/`Circle`/`Line`/`Rect`) following that repo's existing "primitive component" conventions. No shared package between repos — each is a self-contained duplicate, same pattern as the existing theme/i18n duplication. Three independent tasks, one per repo; none depends on another.

**Tech Stack:** `react-native-svg` (new dependency in all three repos — none currently have an icon/SVG library). React Native 0.86 / React 19.2.3 in all three (already aligned).

## Global Constraints

- Icons are hand-authored approximations of each glyph's concept (magnifying glass, sliders, flag pair) — the source PDF is a raster mockup screenshot, not exported vector data, so there is no exact path data to reproduce.
- Only these icons get built, only where a real consumer already exists today (per the design spec): Search + Filter in `study-rooms`; Language flags in `agila`'s `weekly-evaluation`; Search + Language flags in `Chalmers-app-sommaren-2026`. No other profile icon (arrows, plus, cross, settings, favorite, geotag, foot, inbox, eye, the Menyikoner nav example) gets built in this pass.
- `SearchIcon`/`FilterIcon` take a **required** `color` prop (callers always pass a theme color — `theme.subText`) and an optional `size` (default `20`) and `style`. Do not hardcode a fallback color inside the icon component — that would duplicate a token that already lives in each repo's `theme.ts`.
- `FlagUK`/`FlagSE` take an optional `size` (default `20`) and `style` only — no `color` prop, since national flag colors are fixed, not theme-tinted.
- `agila` and `Chalmers-app-sommaren-2026` have real native `android`/`ios` folders — adding `react-native-svg` is a native dependency there. After `npm install`, an iOS build needs `pod install` and both platforms need a rebuild before icons render on device/simulator/emulator. **This plan's tasks do not attempt to run `pod install` or a native build** — that's a manual step for the user afterward. Verification in these tasks is `npx tsc --noEmit` and the existing Jest smoke test only. `study-rooms` has no native project, so this concern doesn't apply there.
- Follow each repo's existing file organization: `study-rooms` and `Chalmers-app-sommaren-2026` get a flat `components/` folder (new for the latter, since its `App.tsx` currently has no component files); `agila` adds to the existing `src/weekly-evaluation/components/` folder alongside `ChalmersText`/`ChalmersButton`.

---

### Task 1: Search + Filter icons in `study-rooms`

**Repo:** `C:\Users\jakob\Karappen\study-rooms\`

**Files:**
- Create: `components/SearchIcon.tsx`
- Create: `components/FilterIcon.tsx`
- Modify: `components/FilterBar.tsx`

**Interfaces:**
- Produces: `SearchIconProps { size?: number; color: string; style?: StyleProp<ViewStyle> }`, `FilterIconProps` (same shape). `FilterBar.tsx` is the only consumer.

- [ ] **Step 1: Install the dependency**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npm install react-native-svg`
Expected: adds `react-native-svg` to `dependencies` in `package.json` and `package-lock.json`, installs cleanly with 0 vulnerabilities.

- [ ] **Step 2: Write `SearchIcon.tsx`**

```tsx
// components/SearchIcon.tsx
/**
 * components/SearchIcon.tsx
 *
 * Magnifying-glass icon, matching the Kårappen graphic profile's
 * "Sök" icon concept (hand-authored - the profile PDF is a raster
 * mockup screenshot, not exported vector source).
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

export interface SearchIconProps {
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

const SearchIcon: React.FC<SearchIconProps> = ({ size = 20, color, style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Circle cx="10" cy="10" r="6" stroke={color} strokeWidth={2} />
    <Line x1="14.5" y1="14.5" x2="20" y2="20" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default SearchIcon;
```

- [ ] **Step 3: Write `FilterIcon.tsx`**

```tsx
// components/FilterIcon.tsx
/**
 * components/FilterIcon.tsx
 *
 * Sliders/filter icon, matching the Kårappen graphic profile's
 * "Filter" icon concept (hand-authored - see SearchIcon.tsx).
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

export interface FilterIconProps {
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

const FilterIcon: React.FC<FilterIconProps> = ({ size = 20, color, style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="8" cy="6" r="2.2" fill={color} />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="16" cy="12" r="2.2" fill={color} />
    <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="11" cy="18" r="2.2" fill={color} />
  </Svg>
);

export default FilterIcon;
```

- [ ] **Step 4: Wire both icons into `FilterBar.tsx`**

Replace the entire current contents of `components/FilterBar.tsx` with:

```tsx
// components/FilterBar.tsx
/**
 * components/FilterBar.tsx
 *
 * Search + building/size/whiteboard filters. Capacity uses a fixed
 * set of preset thresholds rather than a free-form number input,
 * matching the spec's "storlek" filter without needing a stepper.
 */
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import ChalmersText from './ChalmersText';
import SearchIcon from './SearchIcon';
import FilterIcon from './FilterIcon';
import { colors, radii, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

const CAPACITY_OPTIONS: Array<number | null> = [null, 2, 4, 8];

export interface FilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  minCapacity: number | null;
  onMinCapacityChange: (minCapacity: number | null) => void;
  whiteboardOnly: boolean;
  onWhiteboardOnlyChange: (whiteboardOnly: boolean) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  minCapacity,
  onMinCapacityChange,
  whiteboardOnly,
  onWhiteboardOnlyChange,
}) => {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchRow,
          { borderColor: theme.border, backgroundColor: theme.inputBg },
        ]}
      >
        <SearchIcon size={16} color={theme.subText} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={t.studyRoomsSearchPlaceholder}
          placeholderTextColor={theme.subText}
          style={[styles.search, { color: theme.text }]}
          accessibilityLabel={t.studyRoomsSearchPlaceholder}
        />
      </View>

      <View style={styles.chipRow}>
        <FilterIcon size={16} color={theme.subText} style={styles.filterIcon} />
        {CAPACITY_OPTIONS.map((option) => {
          const selected = minCapacity === option;
          return (
            <Pressable
              key={String(option)}
              onPress={() => onMinCapacityChange(option)}
              style={[
                styles.chip,
                { borderColor: theme.border },
                selected && { backgroundColor: colors.bla, borderColor: colors.bla },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <ChalmersText variant="caption1" color={selected ? colors.white : theme.text}>
                {option === null ? t.studyRoomsCapacityAny : t.studyRoomsCapacityAtLeast(option)}
              </ChalmersText>
            </Pressable>
          );
        })}

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

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  search: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterIcon: {
    marginRight: spacing.xs / 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
});

export default FilterBar;
```

- [ ] **Step 5: Type-check and run the full suite**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx tsc --noEmit && npx jest`
Expected: no type errors; all 3 suites / 10 tests still pass (the layout change doesn't alter any room name text the tests assert on).

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add package.json package-lock.json components/SearchIcon.tsx components/FilterIcon.tsx components/FilterBar.tsx
git commit -m "feat: add search and filter icons to FilterBar"
```

---

### Task 2: Language flag icons in `agila` (`weekly-evaluation`)

**Repo:** `C:\Users\jakob\Karappen\agila\`

**Files:**
- Create: `src/weekly-evaluation/components/FlagUK.tsx`
- Create: `src/weekly-evaluation/components/FlagSE.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Produces: `FlagIconProps { size?: number; style?: StyleProp<ViewStyle> }` (defined identically in both files - two tiny components, not worth sharing a types file for). `App.tsx` is the only consumer.

- [ ] **Step 1: Install the dependency**

Run: `cd "C:\Users\jakob\Karappen\agila" && npm install react-native-svg`
Expected: adds `react-native-svg` to `dependencies`, installs cleanly. Note for the user afterward (do not attempt yourself): iOS needs `pod install` and both platforms need a rebuild before this renders on device/simulator.

- [ ] **Step 2: Write `FlagUK.tsx`**

```tsx
// src/weekly-evaluation/components/FlagUK.tsx
/**
 * components/FlagUK.tsx
 *
 * Simplified UK flag icon for the language toggle, matching the
 * Kårappen graphic profile's "Språk" icon concept (hand-authored -
 * the profile PDF is a raster mockup screenshot, not exported vector
 * source). Fixed national-flag colors - not theme-tinted.
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

export interface FlagIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const FlagUK: React.FC<FlagIconProps> = ({ size = 20, style }) => (
  <Svg width={size * 1.4} height={size} viewBox="0 0 28 20" style={style}>
    <Rect x="0" y="0" width="28" height="20" fill="#00247D" />
    <Line x1="0" y1="0" x2="28" y2="20" stroke="#FFFFFF" strokeWidth={4} />
    <Line x1="28" y1="0" x2="0" y2="20" stroke="#FFFFFF" strokeWidth={4} />
    <Line x1="0" y1="0" x2="28" y2="20" stroke="#CF142B" strokeWidth={2} />
    <Line x1="28" y1="0" x2="0" y2="20" stroke="#CF142B" strokeWidth={2} />
    <Line x1="14" y1="0" x2="14" y2="20" stroke="#FFFFFF" strokeWidth={6} />
    <Line x1="0" y1="10" x2="28" y2="10" stroke="#FFFFFF" strokeWidth={6} />
    <Line x1="14" y1="0" x2="14" y2="20" stroke="#CF142B" strokeWidth={3} />
    <Line x1="0" y1="10" x2="28" y2="10" stroke="#CF142B" strokeWidth={3} />
  </Svg>
);

export default FlagUK;
```

- [ ] **Step 3: Write `FlagSE.tsx`**

```tsx
// src/weekly-evaluation/components/FlagSE.tsx
/**
 * components/FlagSE.tsx
 *
 * Simplified Swedish flag icon for the language toggle - see
 * FlagUK.tsx for context. Fixed national-flag colors - not
 * theme-tinted.
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export interface FlagIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const FlagSE: React.FC<FlagIconProps> = ({ size = 20, style }) => (
  <Svg width={size * 1.4} height={size} viewBox="0 0 28 20" style={style}>
    <Rect x="0" y="0" width="28" height="20" fill="#006AA7" />
    <Rect x="10" y="0" width="4" height="20" fill="#FECC00" />
    <Rect x="0" y="8" width="28" height="4" fill="#FECC00" />
  </Svg>
);

export default FlagSE;
```

- [ ] **Step 4: Wire the flags into `App.tsx`**

Add these two imports to `App.tsx`, directly after the existing `ChalmersText` import:

```ts
import FlagUK from './src/weekly-evaluation/components/FlagUK';
import FlagSE from './src/weekly-evaluation/components/FlagSE';
```

Then find this block (the language toggle's two flag-emoji children):

```tsx
                <ChalmersText style={lang !== 'en' ? styles.langFlagInactive : undefined}>
                  {'\u{1F1EC}\u{1F1E7}'}
                </ChalmersText>
                <ChalmersText style={lang !== 'sv' ? styles.langFlagInactive : undefined}>
                  {'\u{1F1F8}\u{1F1EA}'}
                </ChalmersText>
```

Replace it with:

```tsx
                <FlagUK style={lang !== 'en' ? styles.langFlagInactive : undefined} />
                <FlagSE style={lang !== 'sv' ? styles.langFlagInactive : undefined} />
```

- [ ] **Step 5: Type-check and run the existing test**

Run: `cd "C:\Users\jakob\Karappen\agila" && npx tsc --noEmit && npx jest`
Expected: no type errors; `__tests__/App.test.tsx`'s "renders correctly" smoke test still passes (it only asserts the tree renders without throwing).

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\jakob\Karappen\agila"
git add package.json package-lock.json src/weekly-evaluation/components/FlagUK.tsx src/weekly-evaluation/components/FlagSE.tsx App.tsx
git commit -m "feat: replace language toggle flag emoji with SVG flag icons"
```

---

### Task 3: Search + language flag icons in `Chalmers-app-sommaren-2026`

**Repo:** `C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026\`

**Files:**
- Create: `components/SearchIcon.tsx`
- Create: `components/FlagUK.tsx`
- Create: `components/FlagSE.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Produces: `SearchIconProps { size?: number; color: string; style?: StyleProp<ViewStyle> }`, `FlagIconProps { size?: number; style?: StyleProp<ViewStyle> }` (defined in `FlagUK.tsx` and duplicated identically in `FlagSE.tsx`, same as Task 2 - these two repos don't share files with each other either). `App.tsx` is the only consumer of all three.

- [ ] **Step 1: Install the dependency**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npm install react-native-svg`
Expected: adds `react-native-svg` to `dependencies`, installs cleanly. Note for the user afterward (do not attempt yourself): iOS needs `pod install` and both platforms need a rebuild before this renders on device/simulator.

- [ ] **Step 2: Write `components/SearchIcon.tsx`**

```tsx
// components/SearchIcon.tsx
/**
 * components/SearchIcon.tsx
 *
 * Magnifying-glass icon, matching the Kårappen graphic profile's
 * "Sök" icon concept (hand-authored - the profile PDF is a raster
 * mockup screenshot, not exported vector source).
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

export interface SearchIconProps {
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

const SearchIcon: React.FC<SearchIconProps> = ({ size = 20, color, style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Circle cx="10" cy="10" r="6" stroke={color} strokeWidth={2} />
    <Line x1="14.5" y1="14.5" x2="20" y2="20" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default SearchIcon;
```

- [ ] **Step 3: Write `components/FlagUK.tsx`**

```tsx
// components/FlagUK.tsx
/**
 * components/FlagUK.tsx
 *
 * Simplified UK flag icon for the language toggle, matching the
 * Kårappen graphic profile's "Språk" icon concept (hand-authored -
 * see SearchIcon.tsx). Fixed national-flag colors - not theme-tinted.
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

export interface FlagIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const FlagUK: React.FC<FlagIconProps> = ({ size = 20, style }) => (
  <Svg width={size * 1.4} height={size} viewBox="0 0 28 20" style={style}>
    <Rect x="0" y="0" width="28" height="20" fill="#00247D" />
    <Line x1="0" y1="0" x2="28" y2="20" stroke="#FFFFFF" strokeWidth={4} />
    <Line x1="28" y1="0" x2="0" y2="20" stroke="#FFFFFF" strokeWidth={4} />
    <Line x1="0" y1="0" x2="28" y2="20" stroke="#CF142B" strokeWidth={2} />
    <Line x1="28" y1="0" x2="0" y2="20" stroke="#CF142B" strokeWidth={2} />
    <Line x1="14" y1="0" x2="14" y2="20" stroke="#FFFFFF" strokeWidth={6} />
    <Line x1="0" y1="10" x2="28" y2="10" stroke="#FFFFFF" strokeWidth={6} />
    <Line x1="14" y1="0" x2="14" y2="20" stroke="#CF142B" strokeWidth={3} />
    <Line x1="0" y1="10" x2="28" y2="10" stroke="#CF142B" strokeWidth={3} />
  </Svg>
);

export default FlagUK;
```

- [ ] **Step 4: Write `components/FlagSE.tsx`**

```tsx
// components/FlagSE.tsx
/**
 * components/FlagSE.tsx
 *
 * Simplified Swedish flag icon for the language toggle - see
 * FlagUK.tsx for context. Fixed national-flag colors - not
 * theme-tinted.
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export interface FlagIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const FlagSE: React.FC<FlagIconProps> = ({ size = 20, style }) => (
  <Svg width={size * 1.4} height={size} viewBox="0 0 28 20" style={style}>
    <Rect x="0" y="0" width="28" height="20" fill="#006AA7" />
    <Rect x="10" y="0" width="4" height="20" fill="#FECC00" />
    <Rect x="0" y="8" width="28" height="4" fill="#FECC00" />
  </Svg>
);

export default FlagSE;
```

- [ ] **Step 5: Wire the icons into `App.tsx`**

Add these three imports to `App.tsx`, directly after the existing `DatabaseAdapter` import:

```ts
import SearchIcon from './components/SearchIcon';
import FlagUK from './components/FlagUK';
import FlagSE from './components/FlagSE';
```

Then find this block (the header's language toggle):

```tsx
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
        <TouchableOpacity
          onPress={toggleLang}
          style={styles.langToggle}
          accessibilityRole="button"
          accessibilityLabel={t.langToggle}
        >
          <Text style={[styles.langFlag, lang !== 'en' && styles.langFlagInactive]}>🇬🇧</Text>
          <Text style={[styles.langFlag, lang !== 'sv' && styles.langFlagInactive]}>🇸🇪</Text>
        </TouchableOpacity>
      </View>
```

Replace it with:

```tsx
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
        <TouchableOpacity
          onPress={toggleLang}
          style={styles.langToggle}
          accessibilityRole="button"
          accessibilityLabel={t.langToggle}
        >
          <FlagUK style={lang !== 'en' ? styles.langFlagInactive : undefined} />
          <FlagSE style={lang !== 'sv' ? styles.langFlagInactive : undefined} />
        </TouchableOpacity>
      </View>
```

Then find this block (the search input):

```tsx
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.inputBg, color: theme.text }]}
          placeholder={t.search}
          placeholderTextColor={theme.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
```

Replace it with:

```tsx
      <View style={[styles.searchContainer, styles.searchRow, { backgroundColor: theme.inputBg }]}>
        <SearchIcon size={16} color={theme.subText} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t.search}
          placeholderTextColor={theme.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
```

Then find this block in the `StyleSheet.create` call (the now-unused `langFlag` style, and the `searchContainer`/`searchInput` styles that need to move their border-radius/background/padding split between the row and the input):

```tsx
  langFlag: { fontSize: 20 },
  langFlagInactive: { opacity: 0.35 },
```

Replace it with (dropping the now-unused `langFlag` entry):

```tsx
  langFlagInactive: { opacity: 0.35 },
```

Then find:

```tsx
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchInput: { borderRadius: 8, padding: 12, fontFamily: FONT.regular, fontSize: 13 },
```

Replace it with:

```tsx
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: FONT.regular, fontSize: 13 },
```

- [ ] **Step 6: Type-check and run the existing test**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx tsc --noEmit && npx jest`
Expected: no type errors; `__tests__/App.test.tsx` still passes.

- [ ] **Step 7: Commit**

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git add package.json package-lock.json components/SearchIcon.tsx components/FlagUK.tsx components/FlagSE.tsx App.tsx
git commit -m "feat: add search icon and replace language toggle with SVG flag icons"
```
