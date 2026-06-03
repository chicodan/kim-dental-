import type { MiddlewareHandler } from "astro";

// For static site generation, we don't need runtime middleware
// Locale is set at build time via setLocale() in each page
export const onRequest: MiddlewareHandler = async (_context, next) => {
  return next();
};
