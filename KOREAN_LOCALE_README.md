# Korean Locale Re-enablement Guide

This document explains how to re-enable Korean locale support when it's ready for launch.

## What Was Disabled

The Korean locale has been temporarily disabled to force English-only mode. All Korean files and configurations remain intact but are commented out.

## Files Modified

### 1. `src/components/Header.astro`

- Commented out `LanguageSwitcher` import and usage
- Added runtime override import

### 2. `src/i18n/locales.ts`

- Changed `LOCALES` array to only include `["en"]`
- Commented out `getAlternateLocale` and `getLocaleName` functions

### 3. `project.inlang/settings.json`

- Commented out `"ko"` in the locales array

### 4. `src/pages/index.astro`

- Simplified language detection to always redirect to English
- Removed Korean-specific logic

### 5. `src/i18n/locales.ts`

- Added runtime override to force `getLocale()` to always return `"en"`

### 6. Multiple component files

- Added runtime override import to force English-only mode

## How to Re-enable Korean

### Step 1: Remove Runtime Override

Remove the runtime override code from `src/i18n/locales.ts`:

```typescript
// Remove these lines:
import { overwriteGetLocale } from "../paraglide/runtime.js";

overwriteGetLocale(() => {
  return "en";
});
```

### Step 2: Restore Locales Configuration

In `src/i18n/locales.ts`:

```typescript
export const LOCALES = ["en", "ko"] as const;
// Uncomment the helper functions
export function getAlternateLocale(currentLocale: Locale): Locale {
  return currentLocale === "en" ? "ko" : "en";
}

export function getLocaleName(locale: Locale): string {
  return locale === "en" ? "English" : "한국어";
}
```

### Step 3: Restore Project Configuration

In `project.inlang/settings.json`:

```json
"locales": [
  "en",
  "ko"
]
```

### Step 4: Re-enable Language Switcher

In `src/components/Header.astro`:

```typescript
// Uncomment the import
import LanguageSwitcher from './LanguageSwitcher.astro';

// Uncomment both usage instances
<LanguageSwitcher />
```

### Step 5: Restore Language Detection

In `src/pages/index.astro`:

```typescript
import { DEFAULT_LOCALE, LOCALES } from "../i18n/locales";

// Restore the original language detection logic
var supported = ["en", "ko"];
var nav =
  (navigator.languages && navigator.languages[0]) || navigator.language || "";
var code = String(nav).toLowerCase().split("-")[0];
if (code === "ko" || nav.toLowerCase().includes("ko")) {
  location.replace("/ko/");
} else {
  location.replace("/en/");
}
```

### Step 6: Remove Runtime Override Code

Remove the runtime override code from `src/i18n/locales.ts`.

## Verification

After re-enabling:

1. Korean URLs should work (e.g., `/ko/about`)
2. Language switcher should appear in header
3. Site should detect Korean browser preferences
4. All Korean message files should be loaded

## Notes

- All Korean message files in `messages/ko.json` remain intact
- Korean service content in `src/data/services.ts` remains intact
- Korean page templates remain intact
- This is a "soft delete" - nothing was permanently removed
