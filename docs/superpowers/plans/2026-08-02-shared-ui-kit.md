# Shared UI Kit Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop hand-duplicating `theme.ts`, `ThemeContext.tsx`, `ChalmersText`, `ChalmersButton`, and the icon set across `agila`, `study-rooms`, and `Chalmers-app-sommaren-2026`. A diff across the three repos already shows real drift (missing exports, different comments) despite being "the same" file - this plan makes there be exactly one copy.

**Architecture:** A new sibling repo, `kar-ui-kit`, holds the design-system primitives as a real package. Each consuming repo adds it as a local `file:` dependency (`"kar-ui-kit": "file:../kar-ui-kit"`) - this works for sibling folders on the same machine without needing npm workspaces (which would require restructuring the three existing, independent git repos into one) or a private registry. Each consumer then deletes its local duplicate files and imports from the package instead.

**Tech Stack:** No new *kinds* of dependency - `kar-ui-kit` is jest/tsc-only (no native android/ios), same pattern as `study-rooms`'s original scaffold. `react-native-svg` becomes a peer dependency of `kar-ui-kit` (each consumer already has it installed from the icons work).

## Global Constraints

- `kar-ui-kit` includes: theme tokens (`theme.ts`), the theme context (`ThemeContext.tsx`), `ChalmersText`, `ChalmersButton`, and the four icons (`SearchIcon`, `FilterIcon`, `FlagUK`, `FlagSE`). It does **not** include i18n (`I18nContext`/`translations`) - translation dictionaries are inherently app-specific (each app's `Translation` interface has entirely different keys), and genericizing the context over an app-supplied type is a separate, bigger design decision than "extract what's already identical." i18n stays duplicated per app for now.
- `agila`'s copy is the canonical source for `theme.ts`/`ThemeContext.tsx`/`ChalmersText.tsx`/`ChalmersButton.tsx` - it's the most complete version (has the `theme` default export, the `Theme` type, and fuller inline comments that `study-rooms`'s copy lost in transcription). Confirmed via diff before writing this plan.
- `Chalmers-app-sommaren-2026` does not use `ChalmersText`/`ChalmersButton` anywhere - it renders raw RN `Text`/`TouchableOpacity` with its own inline `getTheme()` (a different, smaller shape than `kar-ui-kit`'s `ThemeTokens`). Migrating its rendering to use `ChalmersText`/`ChalmersButton` and unifying its theme shape is real scope creep beyond "stop duplicating identical files" - **out of scope for this plan**. Its migration task only replaces its three icon files (`SearchIcon.tsx`, `FlagUK.tsx`, `FlagSE.tsx`, which already are byte-identical or near-identical duplicates) with the shared package - its theme/color constants stay as they are today.
- Every migration task must leave its repo's full test suite passing and `tsc --noEmit` clean before committing - this is a mechanical extraction, not a behavior change, so nothing should break.
- Do this plan's tasks in order - Task 1 must land before Tasks 2-4, since they depend on `kar-ui-kit` existing.

---

### Task 1: Scaffold `kar-ui-kit`

**Repo:** `C:\Users\jakob\Karappen\kar-ui-kit\` (new, its own git repo)

**Files:**
- Create: `package.json`, `tsconfig.json`, `babel.config.js`, `jest.config.js`
- Create: `theme/theme.ts`, `theme/ThemeContext.tsx`
- Create: `components/ChalmersText.tsx`, `components/ChalmersButton.tsx`
- Create: `components/icons/SearchIcon.tsx`, `components/icons/FilterIcon.tsx`, `components/icons/FlagUK.tsx`, `components/icons/FlagSE.tsx`
- Create: `index.ts`
- Create: `README.md`

**Interfaces:**
- Produces: `colors`, `fontFamily`, `typography`, `spacing`, `radii`, `ThemeTokens`, `getTheme(isDark: boolean): ThemeTokens`, `theme` (default-shaped object), `Theme` type; `ThemeProvider`, `useTheme(): ThemeTokens`; `ChalmersText` (props: `variant?`, `color?`, `style?`, `children`, native `TextProps`); `ChalmersButton` (props: `label`, `onPress`, `variant?: 'primary' | 'secondary'`, `disabled?`, `loading?`, `style?`, `testID?`); `SearchIconProps { size?: number; color: string; style?: StyleProp<ViewStyle> }`, `FilterIconProps` (same shape); `FlagIconProps { size?: number; style?: StyleProp<ViewStyle> }`. All re-exported from `index.ts`. Tasks 2-4 import from this package.

- [ ] **Step 1: Create the folder and `package.json`**

```json
// C:\Users\jakob\Karappen\kar-ui-kit\package.json
{
  "name": "kar-ui-kit",
  "version": "0.0.1",
  "private": true,
  "main": "index.ts",
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "peerDependencies": {
    "react": "19.2.3",
    "react-native": "0.86.0",
    "react-native-svg": "^15.15.5"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@babel/preset-env": "^7.25.3",
    "@babel/runtime": "^7.25.0",
    "@react-native/babel-preset": "0.86.0",
    "@react-native/eslint-config": "0.86.0",
    "@react-native/jest-preset": "^0.86.0",
    "@react-native/typescript-config": "0.86.0",
    "@types/jest": "^29.5.13",
    "@types/react": "^19.2.0",
    "@types/react-test-renderer": "^19.1.0",
    "eslint": "^8.19.0",
    "jest": "^29.6.3",
    "react": "19.2.3",
    "react-native": "0.86.0",
    "react-native-svg": "^15.15.5",
    "react-test-renderer": "19.2.3",
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">= 22.11.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`, `babel.config.js`, `jest.config.js`, `.eslintrc.js`**

```json
// tsconfig.json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "types": ["jest"]
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules"]
}
```

```js
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

```js
// jest.config.js
module.exports = {
  preset: '@react-native/jest-preset',
};
```

```js
// .eslintrc.js
module.exports = {
  root: true,
  extends: '@react-native',
};
```

- [ ] **Step 3: Create `theme/theme.ts`** (canonical version, from `agila`)

```ts
// theme/theme.ts
/**
 * theme/theme.ts
 *
 * Centralized design tokens from the Chalmers Studentkår
 * "Grafisk profil" (Kårappen). Every color and type style used
 * across the Kårappen family of apps is pulled from this file -
 * do not hardcode hex values or font sizes elsewhere.
 *
 * Brand colors, spacing, radii and font families are constant
 * across light/dark. Surface colors (background, card, text, etc)
 * are scheme-dependent - use getTheme(isDark) or the useTheme()
 * hook (theme/ThemeContext.tsx) to read them, never these directly.
 */

import { TextStyle } from 'react-native';

export const colors = {
  bla: '#00ACFF', // Primary brand accent, unread indicators, primary buttons
  lila: '#843690',
  rod: '#D8004D',
  mattRod: '#F8686D',
  orange: '#F86600',
  varmGra: '#634C3D',
  gron: '#27AD72',
  turkos: '#7CCDC2',

  // Functional / neutral tokens (not in the source palette table,
  // but required by the button/disabled specs in the profile).
  white: '#FFFFFF',
  black: '#1A1A1A', // dark background used for icon bars / headings in the profile
  disabledBackground: '#E0E0E0',
  disabledText: 'rgba(26, 26, 26, 0.4)',
} as const;

export const fontFamily = {
  regular: 'OpenSans-Regular',
  medium: 'OpenSans-Medium',
  semiBold: 'OpenSans-SemiBold',
  bold: 'OpenSans-Bold',
} as const;

/**
 * Typography scale, matching the profile spec exactly:
 * Titel 30pt, H1 20pt, H2 16pt, Subheading 11pt,
 * Paragraph1 16pt, Paragraph2 13pt, Caption1 12pt, Caption2 10pt, Label 10pt.
 *
 * Deliberately has no `color` - text color depends on light/dark
 * scheme, and is applied at render time by ChalmersText via
 * useTheme(). `label` keeps its orange color since that's a fixed
 * brand accent, not a surface color.
 */
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

/**
 * Surface tokens that flip between light and dark. Dark `card`
 * intentionally reuses the brand's warm-gray (`colors.varmGra`) as
 * a surface color, matching the kårapp host's own dark theme.
 */
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

export const theme = { colors, fontFamily, typography, spacing, radii };

export type Theme = typeof theme;
export default theme;
```

- [ ] **Step 4: Create `theme/ThemeContext.tsx`**

```tsx
// theme/ThemeContext.tsx
/**
 * theme/ThemeContext.tsx
 *
 * Provides scheme-dependent design tokens (see getTheme in theme.ts)
 * to whichever app imports this package, via useColorScheme().
 * Dark mode always follows the device setting - there is no
 * in-app override.
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

- [ ] **Step 5: Create `components/ChalmersText.tsx`**

```tsx
// components/ChalmersText.tsx
/**
 * components/ChalmersText.tsx
 *
 * Typography primitive that maps directly onto the profile's
 * named text styles (Titel, Heading 1/2, Paragraph 1/2, etc).
 *
 * Defaults to the current theme's text color (light/dark aware).
 * Variants with a fixed brand color baked in (e.g. `label`) keep
 * that color unless the `color` prop overrides it.
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
    <Text
      style={[baseStyle, { color: resolvedColor }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default ChalmersText;
```

- [ ] **Step 6: Create `components/ChalmersButton.tsx`**

```tsx
// components/ChalmersButton.tsx
/**
 * components/ChalmersButton.tsx
 *
 * Button primitive implementing the three button states from the
 * profile: Primärknapp (filled pill), Sekundärknapp (text link),
 * and Disable (muted, reduced-opacity).
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

- [ ] **Step 7: Create the four icon components**

```tsx
// components/icons/SearchIcon.tsx
/**
 * components/icons/SearchIcon.tsx
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

```tsx
// components/icons/FilterIcon.tsx
/**
 * components/icons/FilterIcon.tsx
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

```tsx
// components/icons/FlagUK.tsx
/**
 * components/icons/FlagUK.tsx
 *
 * Simplified UK flag icon for language toggles, matching the
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

```tsx
// components/icons/FlagSE.tsx
/**
 * components/icons/FlagSE.tsx
 *
 * Simplified Swedish flag icon for language toggles - see
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

- [ ] **Step 8: Create the barrel export `index.ts`**

```ts
// index.ts
export * from './theme/theme';
export * from './theme/ThemeContext';
export { default as ChalmersText } from './components/ChalmersText';
export type { ChalmersTextProps, ChalmersTextVariant } from './components/ChalmersText';
export { default as ChalmersButton } from './components/ChalmersButton';
export type { ChalmersButtonProps, ChalmersButtonVariant } from './components/ChalmersButton';
export { default as SearchIcon } from './components/icons/SearchIcon';
export type { SearchIconProps } from './components/icons/SearchIcon';
export { default as FilterIcon } from './components/icons/FilterIcon';
export type { FilterIconProps } from './components/icons/FilterIcon';
export { default as FlagUK } from './components/icons/FlagUK';
export { default as FlagSE } from './components/icons/FlagSE';
export type { FlagIconProps } from './components/icons/FlagUK';
```

- [ ] **Step 9: Create `README.md`**

```markdown
# kar-ui-kit

Shared Chalmers Studentkår ("Kårappen") design-system primitives -
theme tokens, `ChalmersText`, `ChalmersButton`, and a small hand-
authored icon set. Consumed by `agila`, `study-rooms`, and
`Chalmers-app-sommaren-2026` as a local `file:` dependency.

## Using this package

In a consuming repo's `package.json`:

```json
"dependencies": {
  "kar-ui-kit": "file:../kar-ui-kit"
}
```

Then `npm install` and import what you need:

```ts
import { ThemeProvider, useTheme, ChalmersText, ChalmersButton, SearchIcon, FlagUK, FlagSE } from 'kar-ui-kit';
```

After editing anything in this package, consuming repos need to
re-run `npm install` to pick up the change (a `file:` dependency is
copied/symlinked at install time, not live-watched).

## What's NOT here

i18n (`I18nContext`/`translations`) stays duplicated per consuming
app - each app's `Translation` interface has entirely different
keys, so there's nothing to share yet beyond the pattern itself.
```

- [ ] **Step 10: Install and verify**

Run: `cd "C:\Users\jakob\Karappen\kar-ui-kit" && npm install`
Expected: installs cleanly.

Run: `cd "C:\Users\jakob\Karappen\kar-ui-kit" && npx tsc --noEmit && npx eslint . && npx jest --passWithNoTests`
Expected: no type errors, no lint errors, jest reports no test files found but exits 0 (no tests exist yet for this package - it's pure transcription from already-tested code in the consuming repos).

- [ ] **Step 11: Initialize git and commit**

```bash
cd "C:\Users\jakob\Karappen\kar-ui-kit"
git init
git add -A
git commit -m "chore: scaffold kar-ui-kit with theme, ChalmersText/Button, and icons"
```

---

### Task 2: Migrate `study-rooms` to consume `kar-ui-kit`

**Repo:** `C:\Users\jakob\Karappen\study-rooms\`

**Files:**
- Modify: `package.json`
- Delete: `theme/theme.ts`, `theme/ThemeContext.tsx`, `components/ChalmersText.tsx`, `components/ChalmersButton.tsx`, `components/SearchIcon.tsx`, `components/FilterIcon.tsx`
- Modify: every file that imports any of the deleted files (`components/FilterBar.tsx`, `components/RoomCard.tsx`, `components/TabSwitcher.tsx`, `screens/StudyRoomsScreen.tsx`, `example/ExampleUsage.tsx`)

**Interfaces:**
- Consumes: everything `kar-ui-kit`'s `index.ts` exports (Task 1).
- Produces: nothing new - this task only changes import sources, not behavior or exported shapes.

- [ ] **Step 1: Add the dependency**

In `package.json`, find:

```json
  "dependencies": {
    "@react-native-async-storage/async-storage": "^3.1.1",
    "react": "19.2.3",
    "react-native": "0.86.0",
    "react-native-svg": "^15.15.5"
  },
```

Replace with:

```json
  "dependencies": {
    "@react-native-async-storage/async-storage": "^3.1.1",
    "kar-ui-kit": "file:../kar-ui-kit",
    "react": "19.2.3",
    "react-native": "0.86.0",
    "react-native-svg": "^15.15.5"
  },
```

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npm install`
Expected: installs cleanly, `kar-ui-kit` appears in `node_modules`.

- [ ] **Step 2: Delete the now-duplicated files**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git rm theme/theme.ts theme/ThemeContext.tsx components/ChalmersText.tsx components/ChalmersButton.tsx components/SearchIcon.tsx components/FilterIcon.tsx
```

(The empty `theme/` folder disappearing is fine - `i18n/I18nContext.tsx` and `i18n/translations.ts` stay, they're not being touched.)

- [ ] **Step 3: Update every remaining import**

In each of these five files, replace imports of the deleted files with a single import from `kar-ui-kit`. The exact old import lines to find and their replacements:

`components/FilterBar.tsx` - find:
```tsx
import ChalmersText from './ChalmersText';
import SearchIcon from './SearchIcon';
import FilterIcon from './FilterIcon';
import { colors, radii, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
```
replace with:
```tsx
import { ChalmersText, SearchIcon, FilterIcon, colors, radii, spacing, useTheme } from 'kar-ui-kit';
```

`components/RoomCard.tsx` - find:
```tsx
import ChalmersText from './ChalmersText';
import { colors, radii, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
```
replace with:
```tsx
import { ChalmersText, colors, radii, spacing, useTheme } from 'kar-ui-kit';
```

`components/TabSwitcher.tsx` - find:
```tsx
import ChalmersText from './ChalmersText';
import { colors, radii, spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
```
replace with:
```tsx
import { ChalmersText, colors, radii, spacing, useTheme } from 'kar-ui-kit';
```

`screens/StudyRoomsScreen.tsx` - find:
```tsx
import ChalmersText from '../components/ChalmersText';
import ChalmersButton from '../components/ChalmersButton';
import { spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
```
replace with:
```tsx
import { ChalmersText, ChalmersButton, spacing, useTheme } from 'kar-ui-kit';
```

`example/ExampleUsage.tsx` - find:
```tsx
import { ThemeProvider } from '../theme/ThemeContext';
```
replace with:
```tsx
import { ThemeProvider } from 'kar-ui-kit';
```

(`screens/StudyRoomsScreen.test.tsx` imports `ThemeProvider` from `'../theme/ThemeContext'` too - update it the same way, to `'kar-ui-kit'`.)

- [ ] **Step 4: Verify**

Run: `cd "C:\Users\jakob\Karappen\study-rooms" && npx tsc --noEmit && npx eslint . && npx jest`
Expected: no type errors, no lint errors, all 3 suites / 10 tests still pass (pure import-path change, no behavior difference).

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\jakob\Karappen\study-rooms"
git add -A
git commit -m "refactor: consume kar-ui-kit instead of duplicated theme/ChalmersText/icons"
```

---

### Task 3: Migrate `agila`'s `weekly-evaluation` module to consume `kar-ui-kit`

**Repo:** `C:\Users\jakob\Karappen\agila\`

**Files:**
- Modify: `package.json`
- Delete: `src/weekly-evaluation/theme/theme.ts`, `src/weekly-evaluation/theme/ThemeContext.tsx`, `src/weekly-evaluation/components/ChalmersText.tsx`, `src/weekly-evaluation/components/ChalmersButton.tsx`, `src/weekly-evaluation/components/FlagUK.tsx`, `src/weekly-evaluation/components/FlagSE.tsx`
- Modify: every file that imports any of the deleted files (`src/weekly-evaluation/components/NotificationItem.tsx`, `src/weekly-evaluation/components/EvaluationIntroCard.tsx`, `src/weekly-evaluation/components/QuestionInput.tsx`, `src/weekly-evaluation/screens/WeeklyEvaluationScreen.tsx`, `App.tsx`)

**Interfaces:**
- Consumes: `kar-ui-kit`'s exports (Task 1). Same import-path-only change as Task 2 - no behavior change.

- [ ] **Step 1: Add the dependency**

Add to `package.json`'s `dependencies` (alphabetized among the existing entries):
```json
"kar-ui-kit": "file:../kar-ui-kit",
```

Run: `cd "C:\Users\jakob\Karappen\agila" && npm install`

- [ ] **Step 2: Delete the now-duplicated files**

```bash
cd "C:\Users\jakob\Karappen\agila"
git rm src/weekly-evaluation/theme/theme.ts src/weekly-evaluation/theme/ThemeContext.tsx src/weekly-evaluation/components/ChalmersText.tsx src/weekly-evaluation/components/ChalmersButton.tsx src/weekly-evaluation/components/FlagUK.tsx src/weekly-evaluation/components/FlagSE.tsx
```

- [ ] **Step 3: Update every remaining import**

Read each of the five consumer files first to find their exact current import lines for the deleted files (they follow the same relative-path pattern as `study-rooms`'s consumers did before Task 2: `from './ChalmersText'`, `from '../theme/theme'`, `from '../theme/ThemeContext'`, or `from './FlagUK'`/`'./FlagSE'` in `App.tsx`). Replace each with a single consolidated import from `kar-ui-kit`, keeping every other import in that file unchanged - e.g. in `App.tsx`, the `import FlagUK from './src/weekly-evaluation/components/FlagUK';` and `import FlagSE from ...FlagSE';` lines become `import { FlagUK, FlagSE } from 'kar-ui-kit';`, and similarly for `ChalmersText`/`ThemeProvider` already imported there.

- [ ] **Step 4: Verify**

Run: `cd "C:\Users\jakob\Karappen\agila" && npx tsc --noEmit && npx eslint . && npx jest`
Expected: zero output from `tsc --noEmit` (this repo's typecheck is fully clean as of the repo-hygiene plan's Task 1); no lint errors; `__tests__/App.test.tsx` still passes.

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\jakob\Karappen\agila"
git add -A
git commit -m "refactor: consume kar-ui-kit instead of duplicated theme/ChalmersText/flags"
```

---

### Task 4: Migrate `Chalmers-app-sommaren-2026`'s icons to `kar-ui-kit`

**Repo:** `C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026\`

**Files:**
- Modify: `package.json`
- Delete: `components/SearchIcon.tsx`, `components/FlagUK.tsx`, `components/FlagSE.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `SearchIcon`, `FlagUK`, `FlagSE` from `kar-ui-kit` (Task 1). Per this plan's Global Constraints, this repo's own theme/color constants and its lack of `ChalmersText`/`ChalmersButton` usage are **not** touched - only the three icon files, which are already near-identical duplicates of the shared package's versions.

- [ ] **Step 1: Add the dependency**

Add to `package.json`'s `dependencies`:
```json
"kar-ui-kit": "file:../kar-ui-kit",
```

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npm install`

- [ ] **Step 2: Delete the now-duplicated icon files**

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git rm components/SearchIcon.tsx components/FlagUK.tsx components/FlagSE.tsx
```

- [ ] **Step 3: Update the import in `App.tsx`**

Find:

```tsx
import SearchIcon from './components/SearchIcon';
import FlagUK from './components/FlagUK';
import FlagSE from './components/FlagSE';
```

Replace with:

```tsx
import { SearchIcon, FlagUK, FlagSE } from 'kar-ui-kit';
```

- [ ] **Step 4: Verify**

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx tsc --noEmit | grep -v "^chalmers-admin/" | (! grep .); echo "exit: $?"`
Expected: `exit: 0` (no new errors outside the pre-existing, unrelated `chalmers-admin/` ones).

Run: `cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026" && npx jest`
Expected: both suites still pass.

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\jakob\Karappen\Chalmers-app-sommaren-2026"
git add -A
git commit -m "refactor: consume kar-ui-kit's icons instead of local duplicates"
```
