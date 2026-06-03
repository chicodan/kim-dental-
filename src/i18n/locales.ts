// Temporarily disabled Korean locale - not ready for launch
export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Helper to get the opposite locale for language switching
// Temporarily disabled - Korean not ready for launch
// export function getAlternateLocale(currentLocale: Locale): Locale {
//   return currentLocale === "en" ? "ko" : "en";
// }

// Helper to get locale display name
// Temporarily disabled - Korean not ready for launch
// export function getLocaleName(locale: Locale): string {
//   return locale === "en" ? "English" : "한국어";
// }

// Force English-only mode by overriding getLocale
import { overwriteGetLocale } from "../paraglide/runtime.js";

// Override getLocale to always return English
overwriteGetLocale(() => {
  return "en";
});
