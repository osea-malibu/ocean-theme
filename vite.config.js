import { defineConfig } from "vite";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    target: "es2017",
    outDir: "assets",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        theme: resolve(__dirname, "src/styles/theme.css"),
        global: resolve(__dirname, "src/scripts/global.js"),
        "bundle-builder": resolve(__dirname, "src/scripts/bundle-builder.js"),
        customer: resolve(__dirname, "src/scripts/customer.js"),
        "ingredient-glossary": resolve(__dirname, "src/scripts/ingredient-glossary.js"),
        share: resolve(__dirname, "src/scripts/share.js"),
        facets: resolve(__dirname, "src/scripts/facets.js"),
        "password-modal": resolve(__dirname, "src/scripts/password-modal.js"),
      },
      output: {
        entryFileNames: "[name].min.js",
        chunkFileNames: "[name].min.js",
        assetFileNames: "[name][extname]",
        manualChunks: undefined,
      },
    },
  },
});
