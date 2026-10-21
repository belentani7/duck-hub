import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Project Pages lives under /duck-hub/; local/fullstack routing stays at /.
  base: process.env.GITHUB_ACTIONS === "true" ? "/duck-hub/" : "/",
  site: process.env.GITHUB_ACTIONS === "true" ? "https://belentani7.github.io" : undefined,
  outDir: "./dist/public",
  output: "static",
  build: { format: "directory", assets: "_astro" },
  vite: { plugins: [tailwindcss()] },
});
