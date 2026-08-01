# Lediga Grupprum (Free Study Rooms) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `study-rooms` package (its own top-level folder at `C:\Users\jakob\Karappen\study-rooms\`, a sibling to `agila`) that lists bookable group rooms and first-come-first-served open study areas, with search/filter/sort, backed by a mock repository that can be swapped for a real TimeEdit-backed one later without touching any UI code.

**Architecture:** Follows the same internal pattern as `agila/src/weekly-evaluation` (an `IStudyRoomRepository` interface with a mock JSON-fixture implementation, a `useStudyRooms` hook holding all fetch/filter/sort state, presentational components, a top-level screen) but as a **self-contained package**: its own `package.json`/`tsconfig.json`/`babel.config.js`/`jest.config.js`, with its own copies of the small theme/i18n/typography pieces it needs, since Metro can't bundle across the folder boundary into `agila`. Filtering/sorting logic is pulled into plain functions so it's unit-testable without rendering React.

**Tech Stack:** React Native 0.86 (TypeScript, strict mode), Jest + `@react-native/jest-preset` + `react-test-renderer` (no `@testing-library/react-native` — do not add it), `@react-native-async-storage/async-storage` for persisted language choice. Same versions as `agila`'s `package.json`. This package is not a runnable RN app (no `android`/`ios`/entry point) — it type-checks and tests standalone; a host app wires `StudyRoomsScreen` in later.

## Global Constraints

- Location: everything lives under `C:\Users\jakob\Karappen\study-rooms\`, **not** inside `agila`. It is a sibling folder, its own package.
- No dependency *kinds* beyond what `agila` already uses (React, React Native, async-storage, Jest/RN jest preset, TypeScript) — same versions, copied into this package's own `package.json`.
- This package duplicates (does not import cross-folder) `agila`'s theme tokens, `ThemeContext`, `I18nContext`, `ChalmersText`, and `ChalmersButton` — copied in Task 1/2, adapted only to this folder's relative import paths. Do not attempt a cross-project import back into `agila/src/weekly-evaluation`.
- `translations.ts` in this package carries **only** this module's `studyRooms*` keys — not `agila`'s unrelated evaluation copy.
- All colors/type styles come from this package's own `theme/theme.ts` tokens — never hardcode hex values.
- All user-facing copy goes through this package's `Translation` interface, in both `en` and `sv`.
- Default sort for bookable rooms is **longest-available-first** (descending `freeUntil`) — the spec's written requirement; the mockup screenshot's "soonest to fill up" label is explicitly not used.
- The "Book this room" action opens a placeholder generic booking URL (not a room-specific TimeEdit deep link) — that comes later once TimeEdit access exists.
- Explicitly out of scope for this plan (per the design doc): program-based building sort, real TimeEdit integration, live occupancy data for open study areas, wiring into the real `agila` app.

---

### Task 0: Scaffold the package

**Files:**
- Create: `C:\Users\jakob\Karappen\study-rooms\package.json`
- Create: `C:\Users\jakob\Karappen\study-rooms\tsconfig.json`
- Create: `C:\Users\jakob\Karappen\study-rooms\babel.config.js`
- Create: `C:\Users\jakob\Karappen\study-rooms\jest.config.js`
- Create: `C:\Users\jakob\Karappen\study-rooms\jest.setup.js`

**Interfaces:**
- Produces: a folder that `npm install` and `npx jest` / `npx tsc --noEmit` succeed in with zero source files (a trivial passing test), which every later task builds on.

- [ ] **Step 1: Create the folder and `package.json`**

```json
// C:\Users\jakob\Karappen\study-rooms\package.json
{
  "name": "study-rooms",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "^3.1.1",
    "react": "19.2.3",
    "react-native": "0.86.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@babel/preset-env": "^7.25.3",
    "@babel/runtime": "^7.25.0",
    "@react-native/babel-preset": "0.86.0",
    "@react-native/jest-preset": "^0.86.0",
    "@react-native/typescript-config": "0.86.0",
    "@types/jest": "^29.5.13",
    "@types/react": "^19.2.0",
    "@types/react-test-renderer": "^19.1.0",
    "jest": "^29.6.3",
    "react-test-renderer": "19.2.3",
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">= 22.11.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
// C:\Users\jakob\Karappen\study-rooms\tsconfig.json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "types": ["jest"]
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules"]
}
```

- [ ] **Step 3: Create `babel.config.js`**

```js
// C:\Users\jakob\Karappen\study-rooms\babel.config.js
module.exports = {
  presets: ['@react-native/babel-preset'],
};
```

- [ ] **Step 4: Create `jest.config.js` and `jest.setup.js`**

```js
// C:\Users\jakob\Karappen\study-rooms\jest.config.js
module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
```

```js
// C:\Users\jakob\Karappen\study-rooms\jest.setup.js
/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);
```

- [ ] **Step 5: Install dependencies**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npm install`
Expected: installs cleanly, creates `node_modules` and `package-lock.json`

- [ ] **Step 6: Write and run a trivial smoke test to prove the toolchain works**

```ts
// C:\Users\jakob\Karappen\study-rooms\smoke.test.ts
test('jest + typescript toolchain works', () => {
  expect(1 + 1).toBe(2);
});
```

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest`
Expected: PASS (1 test)

Then delete `smoke.test.ts` — it was only to prove the scaffold works, not a real test of this module.

- [ ] **Step 7: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git init
git add package.json tsconfig.json babel.config.js jest.config.js jest.setup.js
git commit -m "chore: scaffold study-rooms package"
```

(If the user wants this folder inside an existing git repo instead of its own, confirm before running `git init` — this plan assumes it's a new standalone repo since it's a new sibling folder outside `agila`.)

---

### Task 1: Copy and adapt theme tokens

**Files:**
- Create: `study-rooms/theme/theme.ts`
- Create: `study-rooms/theme/ThemeContext.tsx`

**Interfaces:**
- Produces: `colors`, `fontFamily`, `typography`, `spacing`, `radii`, `ThemeTokens`, `getTheme(isDark: boolean): ThemeTokens` (from `theme.ts`); `ThemeProvider`, `useTheme(): ThemeTokens` (from `ThemeContext.tsx`). Every later component/screen task imports `useTheme` and the token exports.

- [ ] **Step 1: Write `theme.ts`** (copied from `agila/src/weekly-evaluation/theme/theme.ts`, unchanged apart from the file header — these are generic Chalmers Studentkår brand tokens, not evaluation-specific)

```ts
// study-rooms/theme/theme.ts
/**
 * theme/theme.ts
 *
 * Centralized design tokens from the Chalmers Studentkår
 * "Grafisk profil" (Kårappen). Every color and type style used in
 * this module is pulled from this file - do not hardcode hex
 * values or font sizes elsewhere.
 *
 * Copied from agila/src/weekly-evaluation/theme/theme.ts - this
 * package is self-contained and cannot import across the folder
 * boundary into agila. Keep both copies in sync if the brand
 * profile changes.
 */

import { TextStyle } from 'react-native';

export const colors = {
  bla: '#00ACFF',
  lila: '#843690',
  rod: '#D8004D',
  mattRod: '#F8686D',
  orange: '#F86600',
  varmGra: '#634C3D',
  gron: '#27AD72',
  turkos: '#7CCDC2',

  white: '#FFFFFF',
  black: '#1A1A1A',
  disabledBackground: '#E0E0E0',
  disabledText: 'rgba(26, 26, 26, 0.4)',
} as const;

export const fontFamily = {
  regular: 'OpenSans-Regular',
  medium: 'OpenSans-Medium',
  semiBold: 'OpenSans-SemiBold',
  bold: 'OpenSans-Bold',
} as const;

export const typography: Record<string, TextStyle> = {
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
  },
  heading1: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
  },
  heading2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },
  subheading1: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  paragraph1: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
  },
  paragraph2: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
  caption1: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
  caption2: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    color: colors.orange,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  pill: 999,
  card: 12,
  sm: 6,
} as const;

export interface ThemeTokens {
  background: string;
  card: string;
  text: string;
  subText: string;
  border: string;
  inputBg: string;
  disabledBackground: string;
  disabledText: string;
  selectedTint: string;
  badgeBg: string;
  pressed: string;
  primary: string;
}

export function getTheme(isDark: boolean): ThemeTokens {
  return {
    background: isDark ? '#121212' : colors.white,
    card: isDark ? colors.varmGra : colors.white,
    text: isDark ? colors.white : colors.black,
    subText: isDark ? '#A0A0A0' : colors.varmGra,
    border: isDark ? '#333333' : colors.disabledBackground,
    inputBg: isDark ? '#2C2C2C' : '#F3F4F6',
    disabledBackground: isDark ? '#3A3A3A' : colors.disabledBackground,
    disabledText: isDark ? 'rgba(255, 255, 255, 0.4)' : colors.disabledText,
    selectedTint: isDark ? 'rgba(0, 172, 255, 0.2)' : '#EAF7FF',
    badgeBg: isDark ? 'rgba(39, 173, 114, 0.2)' : '#EAF9F1',
    pressed: isDark ? '#2A2A2A' : '#F5F9FC',
    primary: colors.bla,
  };
}
```

- [ ] **Step 2: Write `ThemeContext.tsx`**

```tsx
// study-rooms/theme/ThemeContext.tsx
/**
 * theme/ThemeContext.tsx
 *
 * Provides scheme-dependent design tokens to this package via
 * useColorScheme() - dark mode always follows the device setting.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, ThemeTokens } from './theme';

const ThemeContext = createContext<ThemeTokens>(getTheme(false));

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const isDark = useColorScheme() === 'dark';
  const value = useMemo(() => getTheme(isDark), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
```

- [ ] **Step 3: Type-check**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add theme/theme.ts theme/ThemeContext.tsx
git commit -m "feat: add theme tokens and ThemeContext"
```

---

### Task 2: i18n and shared typography/button primitives

**Files:**
- Create: `study-rooms/i18n/translations.ts`
- Create: `study-rooms/i18n/I18nContext.tsx`
- Create: `study-rooms/components/ChalmersText.tsx`
- Create: `study-rooms/components/ChalmersButton.tsx`

**Interfaces:**
- Consumes: `typography`, `colors`, `radii`, `spacing` (Task 1); `useTheme` (Task 1).
- Produces: `Language`, `Translation`, `translations` (from `translations.ts`); `I18nProvider`, `useI18n(): { t: Translation; lang: Language; toggleLang: () => void }` (from `I18nContext.tsx`); `ChalmersText` (props: `variant?`, `color?`, `style?`, `children`, plus native `TextProps`); `ChalmersButton` (props: `label`, `onPress`, `variant?: 'primary' | 'secondary'`, `disabled?`, `loading?`, `style?`, `testID?`). Tasks 5-6 use `useI18n`, `ChalmersText`, and `ChalmersButton`.

- [ ] **Step 1: Write `translations.ts`** (only this module's copy — not `agila`'s evaluation strings)

```ts
// study-rooms/i18n/translations.ts
/**
 * i18n/translations.ts
 *
 * Every user-facing string in the study-rooms module, in English and
 * Swedish.
 */

export type Language = 'en' | 'sv';

export interface Translation {
  studyRoomsTitle: string;
  studyRoomsTabBookable: string;
  studyRoomsTabOpen: string;
  studyRoomsSearchPlaceholder: string;
  studyRoomsCapacityAny: string;
  studyRoomsCapacityAtLeast: (capacity: number) => string;
  studyRoomsCapacityLabel: (capacity: number) => string;
  studyRoomsWhiteboardBadge: string;
  studyRoomsFreeUntil: (time: string) => string;
  studyRoomsOtherHalfFree: string;
  studyRoomsOtherHalfTaken: string;
  studyRoomsBookButton: string;
  studyRoomsLoadError: string;
  studyRoomsTryAgain: string;
  studyRoomsEmpty: string;
}

export const translations: Record<Language, Translation> = {
  en: {
    studyRoomsTitle: 'Free study rooms',
    studyRoomsTabBookable: 'Group rooms',
    studyRoomsTabOpen: 'Open areas',
    studyRoomsSearchPlaceholder: 'Search by building or room',
    studyRoomsCapacityAny: 'Any size',
    studyRoomsCapacityAtLeast: (capacity) => `${capacity}+`,
    studyRoomsCapacityLabel: (capacity) => `Fits ${capacity}`,
    studyRoomsWhiteboardBadge: 'Whiteboard',
    studyRoomsFreeUntil: (time) => `Free until ${time}`,
    studyRoomsOtherHalfFree: 'Shared room · other half free',
    studyRoomsOtherHalfTaken: 'Shared room · other half taken',
    studyRoomsBookButton: 'Book this room ->',
    studyRoomsLoadError: "Couldn't load study rooms.",
    studyRoomsTryAgain: 'Try again',
    studyRoomsEmpty: 'No rooms match your filters right now.',
  },
  sv: {
    studyRoomsTitle: 'Lediga grupprum',
    studyRoomsTabBookable: 'Grupprum',
    studyRoomsTabOpen: 'Öppna ytor',
    studyRoomsSearchPlaceholder: 'Sök på byggnad eller rum',
    studyRoomsCapacityAny: 'Valfri storlek',
    studyRoomsCapacityAtLeast: (capacity) => `${capacity}+`,
    studyRoomsCapacityLabel: (capacity) => `Plats för ${capacity}`,
    studyRoomsWhiteboardBadge: 'Whiteboard',
    studyRoomsFreeUntil: (time) => `Ledigt fram till ${time}`,
    studyRoomsOtherHalfFree: 'Delat grupprum · andra halvan ledig',
    studyRoomsOtherHalfTaken: 'Delat grupprum · andra halvan upptagen',
    studyRoomsBookButton: 'Boka rummet ->',
    studyRoomsLoadError: 'Kunde inte hämta lediga grupprum.',
    studyRoomsTryAgain: 'Försök igen',
    studyRoomsEmpty: 'Inga rum matchar dina filter just nu.',
  },
};
```

- [ ] **Step 2: Write `I18nContext.tsx`**

```tsx
// study-rooms/i18n/I18nContext.tsx
/**
 * i18n/I18nContext.tsx
 *
 * Exposes the active translation dictionary and a toggleLang
 * function. Renders no language switcher of its own - a host app
 * calls toggleLang from wherever its own navigation places one.
 * Choice is persisted so it survives app restarts.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, Translation, translations } from './translations';

const STORAGE_KEY = 'study-rooms.language';
const DEFAULT_LANGUAGE: Language = 'sv';

export interface I18nContextValue {
  t: Translation;
  lang: Language;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  t: translations[DEFAULT_LANGUAGE],
  lang: DEFAULT_LANGUAGE,
  toggleLang: () => {},
});

export interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [lang, setLang] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'sv') {
        setLang(stored);
      }
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Language = prev === 'en' ? 'sv' : 'en';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ t: translations[lang], lang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
```

- [ ] **Step 3: Write `ChalmersText.tsx`** (copied from `agila/src/weekly-evaluation/components/ChalmersText.tsx`, unchanged apart from import paths)

```tsx
// study-rooms/components/ChalmersText.tsx
/**
 * components/ChalmersText.tsx
 *
 * Typography primitive mapping onto the profile's named text styles
 * (Titel, Heading 1/2, Paragraph 1/2, etc). Defaults to the current
 * theme's text color; variants with a fixed brand color (e.g.
 * `label`) keep it unless the `color` prop overrides it.
 */
import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { typography } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

export type ChalmersTextVariant = keyof typeof typography;

export interface ChalmersTextProps extends TextProps {
  variant?: ChalmersTextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const ChalmersText: React.FC<ChalmersTextProps> = ({
  variant = 'paragraph1',
  color,
  style,
  children,
  ...rest
}) => {
  const baseStyle = typography[variant];
  const theme = useTheme();
  const resolvedColor = color ?? baseStyle.color ?? theme.text;

  return (
    <Text style={[baseStyle, { color: resolvedColor }, style]} {...rest}>
      {children}
    </Text>
  );
};

export default ChalmersText;
```

- [ ] **Step 4: Write `ChalmersButton.tsx`** (copied from `agila/src/weekly-evaluation/components/ChalmersButton.tsx`, unchanged apart from import paths)

```tsx
// study-rooms/components/ChalmersButton.tsx
/**
 * components/ChalmersButton.tsx
 *
 * Button primitive implementing Primärknapp (filled pill),
 * Sekundärknapp (text link), and Disable states from the profile.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import ChalmersText from './ChalmersText';
import { colors, radii, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

export type ChalmersButtonVariant = 'primary' | 'secondary';

export interface ChalmersButtonProps {
  label: string;
  onPress: () => void;
  variant?: ChalmersButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ChalmersButton: React.FC<ChalmersButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;
  const theme = useTheme();

  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={styles.secondaryContainer}
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        <ChalmersText
          variant="paragraph1"
          color={isDisabled ? theme.disabledText : colors.bla}
        >
          {label}
        </ChalmersText>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.primaryContainer,
        isDisabled && { backgroundColor: theme.disabledBackground },
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <ChalmersText
          variant="paragraph1"
          color={isDisabled ? theme.disabledText : colors.white}
          style={styles.primaryLabel}
        >
          {label}
        </ChalmersText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  primaryContainer: {
    backgroundColor: colors.bla,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontWeight: '600',
  },
  secondaryContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChalmersButton;
```

- [ ] **Step 5: Type-check**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add i18n/translations.ts i18n/I18nContext.tsx components/ChalmersText.tsx components/ChalmersButton.tsx
git commit -m "feat: add i18n and ChalmersText/ChalmersButton primitives"
```

---

### Task 3: Types, fixture data, and the mock repository

**Files:**
- Create: `study-rooms/types/studyRoom.ts`
- Create: `study-rooms/services/fixtures/rooms.json`
- Create: `study-rooms/services/MockStudyRoomRepository.ts`
- Test: `study-rooms/services/MockStudyRoomRepository.test.ts`

**Interfaces:**
- Produces: `StudyRoom` type, `IStudyRoomRepository` interface, `MockStudyRoomRepository` class, `createMockStudyRoomRepository(): IStudyRoomRepository` factory. Later tasks import these from `../types/studyRoom` and `../services/MockStudyRoomRepository`.

- [ ] **Step 1: Write the types file**

```ts
// study-rooms/types/studyRoom.ts
/**
 * types/studyRoom.ts
 *
 * Shared types for the Free Study Rooms ("Lediga grupprum") module.
 */

/**
 * A bookable group room or an open/first-come study area. `bookable`
 * distinguishes the two: bookable rooms have a live `freeUntil` and a
 * `bookingUrl`; open areas have neither (nothing tracks their live
 * occupancy yet), and are directory info only.
 */
export interface StudyRoom {
  id: string;
  name: string;
  building: string;
  capacity: number;
  hasWhiteboard: boolean;
  isShared: boolean;
  /** Only meaningful when `isShared` is true. */
  otherHalfFree?: boolean;
  bookable: boolean;
  /** ISO 8601 timestamp; null for open areas (no live booking data). */
  freeUntil: string | null;
  /** Only present when `bookable` is true. */
  bookingUrl?: string;
}

/**
 * Repository contract for the study rooms data layer. The mock
 * implementation reads a bundled JSON fixture; swap in a
 * TimeEdit-backed implementation of this same interface once API
 * access is confirmed - no other file in this module needs to change.
 */
export interface IStudyRoomRepository {
  getRooms(): Promise<StudyRoom[]>;
}
```

- [ ] **Step 2: Write the fixture data**

```json
// study-rooms/services/fixtures/rooms.json
[
  {
    "id": "edit-5128",
    "name": "EDIT 5128",
    "building": "EDIT",
    "capacity": 6,
    "hasWhiteboard": true,
    "isShared": false,
    "bookable": true,
    "freeUntil": "2026-08-01T14:30:00.000Z",
    "bookingUrl": "https://example.chalmers.se/book"
  },
  {
    "id": "ml2",
    "name": "ML2",
    "building": "Maskin",
    "capacity": 4,
    "hasWhiteboard": false,
    "isShared": true,
    "otherHalfFree": false,
    "bookable": true,
    "freeUntil": "2026-08-01T12:15:00.000Z",
    "bookingUrl": "https://example.chalmers.se/book"
  },
  {
    "id": "sb-h3",
    "name": "SB-H3",
    "building": "Sven Hultin",
    "capacity": 10,
    "hasWhiteboard": true,
    "isShared": false,
    "bookable": true,
    "freeUntil": "2026-08-01T17:00:00.000Z",
    "bookingUrl": "https://example.chalmers.se/book"
  },
  {
    "id": "edit-3103",
    "name": "EDIT 3103",
    "building": "EDIT",
    "capacity": 2,
    "hasWhiteboard": true,
    "isShared": true,
    "otherHalfFree": true,
    "bookable": true,
    "freeUntil": "2026-08-01T15:45:00.000Z",
    "bookingUrl": "https://example.chalmers.se/book"
  },
  {
    "id": "vasa-a",
    "name": "Vasa A",
    "building": "Vasa",
    "capacity": 8,
    "hasWhiteboard": false,
    "isShared": false,
    "bookable": false,
    "freeUntil": null
  },
  {
    "id": "kh-atrium",
    "name": "Kärnhuset Atrium",
    "building": "Kärnhuset",
    "capacity": 20,
    "hasWhiteboard": false,
    "isShared": false,
    "bookable": false,
    "freeUntil": null
  },
  {
    "id": "ml-lounge",
    "name": "Maskin Lounge",
    "building": "Maskin",
    "capacity": 12,
    "hasWhiteboard": true,
    "isShared": false,
    "bookable": false,
    "freeUntil": null
  }
]
```

- [ ] **Step 3: Write the mock repository**

```ts
// study-rooms/services/MockStudyRoomRepository.ts
/**
 * services/MockStudyRoomRepository.ts
 *
 * Standing in for a TimeEdit-backed repository until API access is
 * confirmed - reads a bundled fixture instead of calling a live
 * schedule. Swap this for a TimeEditStudyRoomRepository implementing
 * the same IStudyRoomRepository interface once that access exists;
 * no other file in this module needs to change.
 */
import { IStudyRoomRepository, StudyRoom } from '../types/studyRoom';
import fixtureRooms from './fixtures/rooms.json';

export class MockStudyRoomRepository implements IStudyRoomRepository {
  async getRooms(): Promise<StudyRoom[]> {
    return fixtureRooms as StudyRoom[];
  }
}

export function createMockStudyRoomRepository(): IStudyRoomRepository {
  return new MockStudyRoomRepository();
}
```

- [ ] **Step 4: Write the failing test**

```ts
// study-rooms/services/MockStudyRoomRepository.test.ts
import { createMockStudyRoomRepository } from './MockStudyRoomRepository';

test('resolves the fixture room list', async () => {
  const repository = createMockStudyRoomRepository();
  const rooms = await repository.getRooms();

  expect(rooms.length).toBe(7);
  expect(rooms[0]).toMatchObject({ id: 'edit-5128', building: 'EDIT', bookable: true });
  expect(rooms.some((r) => r.bookable === false)).toBe(true);
});
```

- [ ] **Step 5: Run test to verify it fails, then passes**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest services/MockStudyRoomRepository.test.ts`
Expected: FAIL first if the test is written before Steps 1-3 exist (`Cannot find module`); once Steps 1-3 are in place, re-run and expect PASS.

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add types/studyRoom.ts services/fixtures/rooms.json services/MockStudyRoomRepository.ts services/MockStudyRoomRepository.test.ts
git commit -m "feat: add types, fixture data, and mock repository"
```

---

### Task 4: Pure filter and sort logic

**Files:**
- Create: `study-rooms/services/roomFilters.ts`
- Test: `study-rooms/services/roomFilters.test.ts`

**Interfaces:**
- Consumes: `StudyRoom` from `../types/studyRoom` (Task 3).
- Produces: `RoomFilters` interface, `DEFAULT_ROOM_FILTERS` constant, `filterRooms(rooms: StudyRoom[], filters: RoomFilters): StudyRoom[]`, `sortByLongestAvailable(rooms: StudyRoom[]): StudyRoom[]`. The hook in Task 5 imports all four.

- [ ] **Step 1: Write the failing tests**

```ts
// study-rooms/services/roomFilters.test.ts
import { StudyRoom } from '../types/studyRoom';
import { DEFAULT_ROOM_FILTERS, filterRooms, sortByLongestAvailable } from './roomFilters';

const room = (overrides: Partial<StudyRoom>): StudyRoom => ({
  id: 'r',
  name: 'Room',
  building: 'EDIT',
  capacity: 4,
  hasWhiteboard: false,
  isShared: false,
  bookable: true,
  freeUntil: null,
  ...overrides,
});

describe('filterRooms', () => {
  const rooms = [
    room({ id: 'a', name: 'EDIT 5128', building: 'EDIT', capacity: 6, hasWhiteboard: true }),
    room({ id: 'b', name: 'ML2', building: 'Maskin', capacity: 4, hasWhiteboard: false }),
    room({ id: 'c', name: 'SB-H3', building: 'Sven Hultin', capacity: 10, hasWhiteboard: true }),
  ];

  test('with default filters returns every room unchanged', () => {
    expect(filterRooms(rooms, DEFAULT_ROOM_FILTERS)).toEqual(rooms);
  });

  test('search matches building or name, case-insensitively', () => {
    const result = filterRooms(rooms, { ...DEFAULT_ROOM_FILTERS, search: 'edit' });
    expect(result.map((r) => r.id)).toEqual(['a']);
  });

  test('minCapacity excludes rooms below the threshold', () => {
    const result = filterRooms(rooms, { ...DEFAULT_ROOM_FILTERS, minCapacity: 6 });
    expect(result.map((r) => r.id)).toEqual(['a', 'c']);
  });

  test('whiteboardOnly excludes rooms without a whiteboard', () => {
    const result = filterRooms(rooms, { ...DEFAULT_ROOM_FILTERS, whiteboardOnly: true });
    expect(result.map((r) => r.id)).toEqual(['a', 'c']);
  });

  test('filters combine with AND semantics', () => {
    const result = filterRooms(rooms, {
      search: 'maskin',
      minCapacity: 6,
      whiteboardOnly: false,
    });
    expect(result).toEqual([]);
  });
});

describe('sortByLongestAvailable', () => {
  test('orders by descending freeUntil, nulls last', () => {
    const rooms = [
      room({ id: 'soon', freeUntil: '2026-08-01T12:00:00.000Z' }),
      room({ id: 'open', freeUntil: null }),
      room({ id: 'longest', freeUntil: '2026-08-01T18:00:00.000Z' }),
    ];

    expect(sortByLongestAvailable(rooms).map((r) => r.id)).toEqual([
      'longest',
      'soon',
      'open',
    ]);
  });

  test('does not mutate the input array', () => {
    const rooms = [room({ id: 'a', freeUntil: '2026-08-01T12:00:00.000Z' })];
    const originalOrder = [...rooms];
    sortByLongestAvailable(rooms);
    expect(rooms).toEqual(originalOrder);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest services/roomFilters.test.ts`
Expected: FAIL - `Cannot find module './roomFilters'`

- [ ] **Step 3: Write the implementation**

```ts
// study-rooms/services/roomFilters.ts
/**
 * services/roomFilters.ts
 *
 * Pure filtering/sorting over a StudyRoom list, kept separate from
 * useStudyRooms so this logic is unit-testable without rendering
 * React.
 */
import { StudyRoom } from '../types/studyRoom';

export interface RoomFilters {
  search: string;
  minCapacity: number | null;
  whiteboardOnly: boolean;
}

export const DEFAULT_ROOM_FILTERS: RoomFilters = {
  search: '',
  minCapacity: null,
  whiteboardOnly: false,
};

export function filterRooms(rooms: StudyRoom[], filters: RoomFilters): StudyRoom[] {
  const search = filters.search.trim().toLowerCase();

  return rooms.filter((room) => {
    if (
      search &&
      !room.building.toLowerCase().includes(search) &&
      !room.name.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (filters.minCapacity !== null && room.capacity < filters.minCapacity) {
      return false;
    }
    if (filters.whiteboardOnly && !room.hasWhiteboard) {
      return false;
    }
    return true;
  });
}

export function sortByLongestAvailable(rooms: StudyRoom[]): StudyRoom[] {
  return [...rooms].sort((a, b) => {
    if (a.freeUntil === null && b.freeUntil === null) return 0;
    if (a.freeUntil === null) return 1;
    if (b.freeUntil === null) return -1;
    return new Date(b.freeUntil).getTime() - new Date(a.freeUntil).getTime();
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest services/roomFilters.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add services/roomFilters.ts services/roomFilters.test.ts
git commit -m "feat: add pure filter and sort logic"
```

---

### Task 5: `useStudyRooms` hook

**Files:**
- Create: `study-rooms/hooks/useStudyRooms.ts`

**Interfaces:**
- Consumes: `IStudyRoomRepository`, `StudyRoom` (Task 3); `RoomFilters`, `DEFAULT_ROOM_FILTERS`, `filterRooms`, `sortByLongestAvailable` (Task 4).
- Produces: `LoadState` (`'loading' | 'ready' | 'error'`), `RoomTab` (`'bookable' | 'open'`), `UseStudyRoomsArgs { repository: IStudyRoomRepository }`, and `useStudyRooms(args)` returning `{ loadState, tab, setTab, filters, setSearch, setMinCapacity, setWhiteboardOnly, visibleRooms, reload }`. Task 6 (`TabSwitcher`) imports `RoomTab`; Task 7 (`StudyRoomsScreen`) imports `useStudyRooms` and every field of its return value.

No dedicated unit test for this task — it is thin wiring over the
already-tested `roomFilters` functions (Task 4), and its behavior is
exercised end-to-end by the `StudyRoomsScreen` integration test in
Task 7.

- [ ] **Step 1: Write the hook**

```ts
// study-rooms/hooks/useStudyRooms.ts
/**
 * hooks/useStudyRooms.ts
 *
 * All data-fetching, tab, and filter state for the study rooms
 * screen. StudyRoomsScreen only renders what this hook exposes - it
 * holds no business logic of its own.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IStudyRoomRepository, StudyRoom } from '../types/studyRoom';
import {
  DEFAULT_ROOM_FILTERS,
  RoomFilters,
  filterRooms,
  sortByLongestAvailable,
} from '../services/roomFilters';

export type LoadState = 'loading' | 'ready' | 'error';
export type RoomTab = 'bookable' | 'open';

export interface UseStudyRoomsArgs {
  repository: IStudyRoomRepository;
}

export function useStudyRooms({ repository }: UseStudyRoomsArgs) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [tab, setTab] = useState<RoomTab>('bookable');
  const [filters, setFilters] = useState<RoomFilters>(DEFAULT_ROOM_FILTERS);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const fetched = await repository.getRooms();
      setRooms(fetched);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [repository]);

  useEffect(() => {
    load();
  }, [load]);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setMinCapacity = useCallback((minCapacity: number | null) => {
    setFilters((prev) => ({ ...prev, minCapacity }));
  }, []);

  const setWhiteboardOnly = useCallback((whiteboardOnly: boolean) => {
    setFilters((prev) => ({ ...prev, whiteboardOnly }));
  }, []);

  const visibleRooms = useMemo(() => {
    const wantBookable = tab === 'bookable';
    const scoped = rooms.filter((room) => room.bookable === wantBookable);
    const filtered = filterRooms(scoped, filters);
    return wantBookable ? sortByLongestAvailable(filtered) : filtered;
  }, [rooms, tab, filters]);

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
}
```

- [ ] **Step 2: Type-check**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add hooks/useStudyRooms.ts
git commit -m "feat: add useStudyRooms hook"
```

---

### Task 6: Presentational components

**Files:**
- Create: `study-rooms/components/TabSwitcher.tsx`
- Create: `study-rooms/components/FilterBar.tsx`
- Create: `study-rooms/components/RoomCard.tsx`

**Interfaces:**
- Consumes: `RoomTab` (Task 5); `StudyRoom` (Task 3); `Translation` fields (Task 2); `ChalmersText`, `useTheme`, `useI18n`, `colors`/`radii`/`spacing` (Tasks 1-2).
- Produces: `TabSwitcherProps { tab: RoomTab; onChange: (tab: RoomTab) => void }`, `FilterBarProps { search, onSearchChange, minCapacity, onMinCapacityChange, whiteboardOnly, onWhiteboardOnlyChange }`, `RoomCardProps { room: StudyRoom }`. Task 7 (`StudyRoomsScreen`) renders all three with these exact prop shapes.

No dedicated component tests — exercised by the `StudyRoomsScreen`
integration test in Task 7.

- [ ] **Step 1: Write `TabSwitcher`**

```tsx
// study-rooms/components/TabSwitcher.tsx
/**
 * components/TabSwitcher.tsx
 *
 * Toggles between the "Group rooms" (bookable) and "Open areas"
 * (first-come-first-served) tabs.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ChalmersText from './ChalmersText';
import { colors, radii, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { RoomTab } from '../hooks/useStudyRooms';

export interface TabSwitcherProps {
  tab: RoomTab;
  onChange: (tab: RoomTab) => void;
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({ tab, onChange }) => {
  const theme = useTheme();
  const { t } = useI18n();

  const renderTab = (value: RoomTab, label: string) => {
    const selected = tab === value;
    return (
      <Pressable
        key={value}
        onPress={() => onChange(value)}
        style={[styles.tab, selected && { backgroundColor: colors.bla }]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        testID={`tab-${value}`}
      >
        <ChalmersText variant="paragraph2" color={selected ? colors.white : theme.text}>
          {label}
        </ChalmersText>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      {renderTab('bookable', t.studyRoomsTabBookable)}
      {renderTab('open', t.studyRoomsTabOpen)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});

export default TabSwitcher;
```

- [ ] **Step 2: Write `FilterBar`**

```tsx
// study-rooms/components/FilterBar.tsx
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
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder={t.studyRoomsSearchPlaceholder}
        placeholderTextColor={theme.subText}
        style={[
          styles.search,
          { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text },
        ]}
        accessibilityLabel={t.studyRoomsSearchPlaceholder}
      />

      <View style={styles.chipRow}>
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
  search: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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

- [ ] **Step 3: Write `RoomCard`**

```tsx
// study-rooms/components/RoomCard.tsx
/**
 * components/RoomCard.tsx
 *
 * One row in the study rooms list: name, building, capacity,
 * whiteboard flag, shared-room badge, and (for bookable rooms) a
 * free-until time plus a "Book this room" link. Shows the full card
 * in the feed - per the spec, nothing here requires "clicking in"
 * for full info.
 */
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import ChalmersText from './ChalmersText';
import { colors, radii, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { StudyRoom } from '../types/studyRoom';

export interface RoomCardProps {
  room: StudyRoom;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const theme = useTheme();
  const { t } = useI18n();

  const handleBookPress = () => {
    if (room.bookingUrl) {
      Linking.openURL(room.bookingUrl);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <ChalmersText variant="heading2">{room.name}</ChalmersText>
      <ChalmersText variant="paragraph2" color={theme.subText}>
        {room.building}
      </ChalmersText>

      <View style={styles.metaRow}>
        <ChalmersText variant="caption1" color={theme.subText}>
          {t.studyRoomsCapacityLabel(room.capacity)}
        </ChalmersText>
        {room.hasWhiteboard && (
          <ChalmersText variant="caption1" color={theme.subText}>
            {t.studyRoomsWhiteboardBadge}
          </ChalmersText>
        )}
        {room.freeUntil && (
          <ChalmersText variant="caption1" color={colors.gron}>
            {t.studyRoomsFreeUntil(formatTime(room.freeUntil))}
          </ChalmersText>
        )}
      </View>

      {room.isShared && (
        <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
          <ChalmersText variant="caption2" color={theme.subText}>
            {room.otherHalfFree ? t.studyRoomsOtherHalfFree : t.studyRoomsOtherHalfTaken}
          </ChalmersText>
        </View>
      )}

      {room.bookable && room.bookingUrl && (
        <Pressable onPress={handleBookPress} accessibilityRole="button">
          <ChalmersText variant="paragraph2" color={colors.bla}>
            {t.studyRoomsBookButton}
          </ChalmersText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
});

export default RoomCard;
```

- [ ] **Step 4: Type-check**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add components/TabSwitcher.tsx components/FilterBar.tsx components/RoomCard.tsx
git commit -m "feat: add TabSwitcher, FilterBar, and RoomCard components"
```

---

### Task 7: `StudyRoomsScreen`, example wiring, module README

**Files:**
- Create: `study-rooms/screens/StudyRoomsScreen.tsx`
- Test: `study-rooms/screens/StudyRoomsScreen.test.tsx`
- Create: `study-rooms/example/ExampleUsage.tsx`
- Create: `study-rooms/README.md`

**Interfaces:**
- Consumes: `useStudyRooms` (Task 5); `TabSwitcher`, `FilterBar`, `RoomCard` (Task 6); `IStudyRoomRepository`, `createMockStudyRoomRepository` (Task 3); `ThemeProvider` (Task 1); `I18nProvider` (Task 2).
- Produces: `StudyRoomsScreenProps { repository: IStudyRoomRepository }` and the `StudyRoomsScreen` component - the integration point a host app renders.

- [ ] **Step 1: Write the failing integration test**

```tsx
// study-rooms/screens/StudyRoomsScreen.test.tsx
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import StudyRoomsScreen from './StudyRoomsScreen';
import { createMockStudyRoomRepository } from '../services/MockStudyRoomRepository';
import { ThemeProvider } from '../theme/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';

function renderScreen(): ReactTestRenderer.ReactTestRenderer {
  const repository = createMockStudyRoomRepository();
  return ReactTestRenderer.create(
    <ThemeProvider>
      <I18nProvider>
        <StudyRoomsScreen repository={repository} />
      </I18nProvider>
    </ThemeProvider>,
  );
}

test('shows bookable rooms by default, longest-available-first', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderScreen();
  });

  const output = JSON.stringify(renderer!.toJSON());
  expect(output).toContain('EDIT 5128');
  expect(output).toContain('SB-H3');
  expect(output).not.toContain('Vasa A');

  const idxSbH3 = output.indexOf('SB-H3');
  const idxEdit3103 = output.indexOf('EDIT 3103');
  const idxEdit5128 = output.indexOf('EDIT 5128');
  const idxMl2 = output.indexOf('ML2');
  expect(idxSbH3).toBeLessThan(idxEdit3103);
  expect(idxEdit3103).toBeLessThan(idxEdit5128);
  expect(idxEdit5128).toBeLessThan(idxMl2);
});

test('switching to the open areas tab shows non-bookable rooms', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = renderScreen();
  });

  // findAllByType(Pressable) cannot match RN's memo-wrapped Pressable
  // under React 19 + react-test-renderer 19.2.3 (a fiber-internals
  // incompatibility, unrelated to this screen's wiring) - look the tab
  // button up by testID instead. TabSwitcher renders `testID={`tab-${value}`}`
  // on each tab Pressable.
  const openTabButton = renderer!.root.findByProps({ testID: 'tab-open' });
  await ReactTestRenderer.act(async () => {
    openTabButton.props.onPress();
  });

  const output = JSON.stringify(renderer!.toJSON());
  expect(output).toContain('Vasa A');
  expect(output).not.toContain('EDIT 5128');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest screens/StudyRoomsScreen.test.tsx`
Expected: FAIL - `Cannot find module './StudyRoomsScreen'`

- [ ] **Step 3: Write `StudyRoomsScreen`**

```tsx
// study-rooms/screens/StudyRoomsScreen.tsx
/**
 * screens/StudyRoomsScreen.tsx
 *
 * Top-level "Lediga grupprum" screen: owns tab/filter state via
 * useStudyRooms and renders the bookable-rooms / open-areas list.
 */
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import ChalmersText from '../components/ChalmersText';
import ChalmersButton from '../components/ChalmersButton';
import { spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useStudyRooms } from '../hooks/useStudyRooms';
import { IStudyRoomRepository, StudyRoom } from '../types/studyRoom';
import RoomCard from '../components/RoomCard';
import TabSwitcher from '../components/TabSwitcher';
import FilterBar from '../components/FilterBar';

export interface StudyRoomsScreenProps {
  repository: IStudyRoomRepository;
}

const StudyRoomsScreen: React.FC<StudyRoomsScreenProps> = ({ repository }) => {
  const theme = useTheme();
  const { t } = useI18n();
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ChalmersText variant="heading1" style={styles.title}>
        {t.studyRoomsTitle}
      </ChalmersText>

      <TabSwitcher tab={tab} onChange={setTab} />

      <FilterBar
        search={filters.search}
        onSearchChange={setSearch}
        minCapacity={filters.minCapacity}
        onMinCapacityChange={setMinCapacity}
        whiteboardOnly={filters.whiteboardOnly}
        onWhiteboardOnlyChange={setWhiteboardOnly}
      />

      {loadState === 'error' && (
        <View style={styles.centered}>
          <ChalmersText color={theme.subText}>{t.studyRoomsLoadError}</ChalmersText>
          <ChalmersButton label={t.studyRoomsTryAgain} onPress={reload} variant="secondary" />
        </View>
      )}

      {loadState === 'ready' && visibleRooms.length === 0 && (
        <View style={styles.centered}>
          <ChalmersText color={theme.subText}>{t.studyRoomsEmpty}</ChalmersText>
        </View>
      )}

      <FlatList
        data={visibleRooms}
        keyExtractor={(room: StudyRoom) => room.id}
        renderItem={({ item }) => <RoomCard room={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    paddingBottom: spacing.lg,
  },
});

export default StudyRoomsScreen;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest screens/StudyRoomsScreen.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the example usage file**

```tsx
// study-rooms/example/ExampleUsage.tsx
/**
 * example/ExampleUsage.tsx
 *
 * Illustrative standalone wiring, not a required file. Shows how a
 * host app would render StudyRoomsScreen inside this package's own
 * Theme/I18n providers.
 */
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import StudyRoomsScreen from '../screens/StudyRoomsScreen';
import { createMockStudyRoomRepository } from '../services/MockStudyRoomRepository';
import { ThemeProvider } from '../theme/ThemeContext';
import { I18nProvider } from '../i18n/I18nContext';

const repository = createMockStudyRoomRepository();

function StudyRoomsExample(): React.JSX.Element {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SafeAreaView style={styles.safeArea}>
          <StudyRoomsScreen repository={repository} />
        </SafeAreaView>
      </I18nProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

export default StudyRoomsExample;
```

- [ ] **Step 6: Write the module README**

```markdown
<!-- study-rooms/README.md -->
# Free Study Rooms Module

Standalone React Native (TypeScript) package for Chalmers Studentkår
that lists bookable group rooms and first-come-first-served open study
areas. Lives as its own top-level folder, a sibling to the `agila` app
rather than inside it - it type-checks and tests independently and is
not wired into `agila` (no `android`/`ios`/entry point). A host app
integrates it by rendering `StudyRoomsScreen` with a repository.

## Folder structure

```
study-rooms/
├── package.json / tsconfig.json / babel.config.js / jest.config.js
├── theme/
│   ├── theme.ts                       # Chalmers brand tokens (copied from agila/weekly-evaluation)
│   └── ThemeContext.tsx
├── i18n/
│   ├── translations.ts                # this module's own EN/SV copy only
│   └── I18nContext.tsx
├── components/
│   ├── ChalmersText.tsx               # copied typography primitive
│   ├── ChalmersButton.tsx             # copied button primitive
│   ├── TabSwitcher.tsx                # Group rooms / Open areas toggle
│   ├── FilterBar.tsx                  # search + building/size/whiteboard filters
│   └── RoomCard.tsx                   # one room row, full info, no "click in"
├── types/
│   └── studyRoom.ts                   # StudyRoom, IStudyRoomRepository
├── services/
│   ├── roomFilters.ts                 # pure filter/sort logic
│   ├── MockStudyRoomRepository.ts     # reads fixtures/rooms.json
│   └── fixtures/
│       └── rooms.json                 # editable mock room list
├── hooks/
│   └── useStudyRooms.ts               # fetch + tab + filter state
├── screens/
│   └── StudyRoomsScreen.tsx           # top-level screen
└── example/
    └── ExampleUsage.tsx               # illustrative wiring, not a required file
```

## Why this is a separate folder from `agila`

Metro only bundles within a project's own root, so this package can't
cross-import `agila/src/weekly-evaluation`'s theme/i18n/typography
components. The small pieces it needs are copied in instead
(`theme/theme.ts`, `theme/ThemeContext.tsx`, `components/ChalmersText.tsx`,
`components/ChalmersButton.tsx`) - keep both copies in sync if the
Chalmers brand profile changes. `i18n/translations.ts` here only
carries this module's own `studyRooms*` keys, not `agila`'s unrelated
evaluation copy.

## Repository pattern (the TimeEdit seam)

Nothing outside `services/MockStudyRoomRepository.ts` knows the data is
mocked. Every component/hook depends only on `IStudyRoomRepository`:

```ts
interface IStudyRoomRepository {
  getRooms(): Promise<StudyRoom[]>;
}
```

Once TimeEdit API access is confirmed, add a
`TimeEditStudyRoomRepository` implementing this same interface and pass
it to `StudyRoomsScreen` instead of `createMockStudyRoomRepository()` -
no component, hook, or filter/sort logic needs to change.

To hand-edit the mock room list (buildings, sizes, whiteboards, shared
status), just edit `services/fixtures/rooms.json` - no code changes
needed.

## Running

```bash
npm install
npm test        # jest
npm run typecheck  # tsc --noEmit
```

## Known gaps / extension points

- **Program-based building sort** ("sortera beroende på var olika
  program oftare håller hus") is not implemented - it needs a
  building↔program mapping that doesn't exist as data yet.
- **Real TimeEdit integration** - see "Repository pattern" above.
- **Live occupancy for open study areas** - nothing currently tracks
  first-come space occupancy, so the "Open areas" tab is static
  directory info (building/size/whiteboard) only.
- **Integration into `agila`** - this package isn't wired into the
  `agila` app yet; that's a separate step once a host navigation
  structure exists there.
```

- [ ] **Step 7: Run the full test suite and type-check**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx jest && npx tsc --noEmit`
Expected: all suites pass, no type errors

- [ ] **Step 8: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add screens/StudyRoomsScreen.tsx screens/StudyRoomsScreen.test.tsx example/ExampleUsage.tsx README.md
git commit -m "feat: add StudyRoomsScreen, example wiring, and module README"
```
