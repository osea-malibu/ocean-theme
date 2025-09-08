import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    // Configure output directory to match Shopify theme structure
    outDir: 'assets',
    // Empty the output directory before building
    emptyOutDir: false, // Don't empty assets folder (has fonts, etc.)
    // Watch options for build mode
    watch: {
      exclude: ['assets/**']
    },
    // Configure multiple JavaScript entry points
    rollupOptions: {
      input: {
        // Map each JS file to match esbuild's previous output naming
        main: resolve(__dirname, 'src/scripts/main.js'),
        customer: resolve(__dirname, 'src/scripts/customer.js'),
        'ingredient-glossary': resolve(__dirname, 'src/scripts/ingredient-glossary.js'),
        share: resolve(__dirname, 'src/scripts/share.js'),
        facets: resolve(__dirname, 'src/scripts/facets.js'),
        'password-modal': resolve(__dirname, 'src/scripts/password-modal.js'),
        // CSS entry point for Tailwind compilation
        application: resolve(__dirname, 'src/styles/application.css'),
      },
      output: {
        // Configure output naming to match Shopify conventions
        entryFileNames: '[name].min.js',
        assetFileNames: (assetInfo) => {
          // For CSS files, keep original name
          if (assetInfo.name?.endsWith('.css')) {
            return '[name].css';
          }
          return '[name].[ext]';
        },
        chunkFileNames: '[name]-[hash].js',
      },
    },
    // Enable minification
    minify: true,
    // Target ES2017 to match esbuild config
    target: 'es2017',
  },
});
