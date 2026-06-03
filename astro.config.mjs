import { defineConfig } from "astro/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  build: {
    format: "file",
    inlineStylesheets: "always",
  },
  compressHTML: true,
  image: {
    experimentalLayout: "constrained",
  },
  vite: {
    plugins: [
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
      }),
    ],
  },
  integrations: [react()],
});
