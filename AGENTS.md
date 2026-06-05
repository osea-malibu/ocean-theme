# AGENTS.md - OSEA Ocean Theme

## Commands
- **Build JS and Tailwind**: `npm run build` (vite build, one-shot)
- **Dev Build**: `npm run dev` (vite build --watch, incremental)
- **Format**: `npm run format` (Prettier)
- **Format Check**: `npm run format:check`
- **Theme Check**: `shopify theme check` (Liquid linting)
- **Dev Server**: `shopify theme dev` (local preview, requires Shopify CLI)
- **No Tests**: Tests not configured (`npm test` exits with error)

## Architecture
- **Shopify Theme** based on Dawn, built for OSEA skincare brand
- **Layout**: Core theme structure in `layout/` (theme.liquid, password.liquid)
- **Sections**: 60+ reusable sections in `sections/` (headers, footers, product displays, etc.)
- **Snippets**: 125+ reusable components in `snippets/` (icons, product cards, integrations)
- **Templates**: 130+ page templates in `templates/` (JSON format for Online Store 2.0)
- **Assets**: Compiled output in `assets/` — do not edit directly, overwritten on build
- **Source**: Development files in `src/scripts/` and `src/styles/`

## Build Pipeline
- **Bundler**: Vite 7 (replaced esbuild — do not use `node esbuild.config.js`)
- **CSS**: Tailwind CSS 4 via `@tailwindcss/vite` plugin
- **JS entry points**: main, customer, facets, cart, cart-drawer, ingredient-glossary, share, password-modal — each outputs to `assets/[name].min.js`
- **CSS entry point**: `src/styles/application.css` → `assets/application.css`

## Code Style
- **CSS Framework**: Tailwind CSS 4 with custom OSEA color palette (seaweed, coral, wave, seafoam, sand, shell)
- **JS**: Vanilla JavaScript with Web Components — no framework
- **File Naming**: Kebab-case
- **Formatting**: Prettier (printWidth: 100, tabWidth: 2)
- **Custom Fonts**: Circular (sans-serif), Canela (serif)
- **Liquid**: Progressive enhancement, minimal JS, server-rendered HTML
- **Metafield conditions**: For list/reference metafields, assign and check `.value` before rendering. Example: `{%- assign items = product.metafields.custom.example.value -%}` then `{%- if items != blank -%}`.

## JavaScript Rules
- Before writing new JS for any interactive element, check if a Web Component class already exists for it. If it does, add methods to the existing class — do not create a parallel implementation.
- Existing Web Components: `ProductForm`, `CartDrawer`, `DetailsDisclosure`, `DetailsModal`, `GlideSlider`, `TabController`, `PredictiveSearch`, `ModalDialog`, `DeferredMedia`, `HorizontalScrollBox`
- JS can be included via compiled Vite bundles, inline `<script>` tags, or `{% javascript %}` Liquid tags — follow whichever pattern is already in use in the file/context you're working in

## Liquid Rules
- Use Shopify Liquid specifically — not generic Liquid. Shopify has unique filters, objects, and tags.
- When uncertain about syntax or available features, check Shopify developer docs (use the docs MCP tool if available)
- Be precise with `{%-` / `-%}` whitespace control in conditionals

## Integrations
Active third-party integrations: Klaviyo, Okendo (reviews), Gorgias (chat), Loop Subscriptions, Rivo (loyalty), Consentmo (GDPR), VWO (A/B testing), Google Tag Manager, Google Ads, and additional marketing pixels. Be careful when working near this code.
