import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "", // <-- critical: makes chunk imports relative (e.g. ./chunk-xxx.js)
  plugins: [tailwindcss()],
  build: {
    outDir: "assets",
    emptyOutDir: false, // Don't empty assets folder (has fonts, etc.)
    rollupOptions: {
      input: {
        // Map each JS file to match esbuild's previous output naming
        main: resolve(__dirname, "src/scripts/main.js"),
        customer: resolve(__dirname, "src/scripts/customer.js"),
        "ingredient-glossary": resolve(__dirname, "src/scripts/ingredient-glossary.js"),
        share: resolve(__dirname, "src/scripts/share.js"),
        facets: resolve(__dirname, "src/scripts/facets.js"),
        "password-modal": resolve(__dirname, "src/scripts/password-modal.js"),
        // CSS entry point for Tailwind compilation
        application: resolve(__dirname, "src/styles/application.css"),
      },
      output: {
        entryFileNames: "[name].min.js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) return "[name].css";
          return "[name][extname]"; // use [extname] (includes the dot) to be safe
        },
      },
    },
    minify: true,
    target: "es2017",
  },
});
