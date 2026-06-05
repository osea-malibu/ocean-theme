# CLAUDE.md — OSEA Ocean Theme

## Project Overview

Custom Shopify theme for OSEA Malibu, built on Dawn (Online Store 2.0). Powers the DTC storefront at oseamalibu.com. The theme is connected to GitHub — `main` auto-deploys to production.

**Team:** Erin Wilder (erin.wilder@oseamalibu.com) and Jun Kuan (jun.kuan@oseamalibu.com / @junkuan-oseamalibu).

---

## Branch & Deployment Model

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys via GitHub Shopify connection |
| `main2`, `main3` | Kept in sync with main; used by marketing team for promotion previews |
| Feature branches | Local dev + Shopify preview themes; deleted after merging |

**Workflow:** Work on feature branches. Preview locally with `shopify theme dev`. If storefront preview is needed, push the branch as a separate Shopify theme, review, then delete after merge.

---

## Commands

```bash
npm run build          # Build JS bundles + Tailwind CSS (one-shot)
npm run dev            # Build in watch mode (incremental, for local development)
npm run format         # Format all files with Prettier
npm run format:check   # Check formatting without writing

shopify theme dev      # Local dev server with live preview (requires Shopify CLI)
shopify theme check    # Liquid linting
```

No tests are configured.

---

## Architecture

### Directory Structure

```
ocean-theme/
├── src/
│   ├── scripts/       # Source JS (entry points + modules)
│   └── styles/        # Source CSS (Tailwind + custom)
├── assets/            # Compiled output (do not edit directly)
├── sections/          # Shopify sections (Liquid + JSON schema)
├── snippets/          # Reusable Liquid components
├── templates/         # Page templates (JSON for OS 2.0)
├── layout/            # Master layouts (theme.liquid, checkout.liquid)
├── config/            # Theme settings schema + data
└── locales/           # i18n translation files (20+ languages)
```

### Build Pipeline

**Vite** builds all source files from `src/` into `assets/`. Do not edit compiled files in `assets/` directly.

**JS entry points** (each outputs to `assets/[name].min.js`):
- `main.js` — global scripts loaded on every page
- `customer.js` — customer account pages
- `facets.js` — collection filtering
- `cart.js` — cart page
- `cart-drawer.js` — slide-in cart drawer
- `ingredient-glossary.js` — ingredient glossary page
- `share.js` — share functionality
- `password-modal.js` — password page

**CSS entry point:** `src/styles/application.css` → `assets/application.css`
- Imports all source CSS files
- Tailwind 4 scans Liquid files via `@source` directives in `application.css`

### Tech Stack

- **Templating:** Shopify Liquid (Online Store 2.0)
- **CSS:** Tailwind CSS 4 via `@tailwindcss/vite` plugin
- **JS:** Vanilla JavaScript with Web Components (no framework)
- **Fonts:** Circular (sans-serif), Canela (serif) — WOFF2, preloaded in theme.liquid
- **Formatting:** Prettier (printWidth: 100, tabWidth: 2)

---

## JavaScript Conventions

### Use existing class components — do not create parallel implementations

The theme uses Web Components (custom elements). Most interactive UI already has a corresponding JS class. **Before writing new JS for an element, check whether a class already exists for it.** If it does, add methods and functionality to that existing class — do not create a new class or script for the same element.

Existing Web Components include: `ProductForm`, `CartDrawer`, `DetailsDisclosure`, `DetailsModal`, `GlideSlider`, `TabController`, `PredictiveSearch`, `ModalDialog`, `DeferredMedia`, `HorizontalScrollBox`.

### JavaScript inclusion strategies

JavaScript in this theme is included in multiple ways. This is intentional — follow whichever pattern is already in use for the context you're working in, and be consistent:

1. **Compiled JS bundles** (`src/scripts/`) — for reusable logic and Web Component classes
2. **Inline `<script>` tags** in Liquid files — for page-specific, one-off JS tied to server-rendered data
3. **Shopify `{% javascript %}` tags** in sections — for section-scoped JS

The goal is coherence: it should be easy to understand where code lives and why. When in doubt, match what already exists in the file or section you're working in.

---

## Liquid Conventions

### Use Shopify Liquid — not generic Liquid

Shopify Liquid has unique filters, objects, and tags that differ from standard Liquid. Always use Shopify-specific functionality when available. When uncertain about syntax or available filters/objects, **check the Shopify developer docs** — Shopify frequently updates its Liquid features and the model's training data may be out of date.

### Conditionals and whitespace control

Shopify Liquid conditional behavior has nuances. Be precise with `{%-` / `-%}` whitespace control. Avoid rendering empty markup by assigning and checking values before output.

### Metafields — always assign `.value` for complex types

For list, reference, or other complex metafield types, assign `.value` before checking or rendering:

```liquid
{%- assign items = product.metafields.custom.example.value -%}
{%- if items != blank -%}
  ...
{%- endif -%}
```

Checking the metafield object directly (without `.value`) can result in empty markup being rendered even when the metafield is cleared.

---

## CSS / Tailwind Conventions

### Brand color palette

Custom color families defined in `src/styles/theme.css`:
- `seaweed`, `coral`, `wave`, `seafoam`, `sand`, `shell` — each with shades 100–800
- Product-specific color tokens in `src/styles/product-palette.css` (e.g., `--color-aas-light`)

Use Tailwind utility classes: `bg-seaweed-700`, `text-coral-500`, `border-wave-300`, etc.

### Safelist

If a Tailwind class is generated dynamically from Liquid/JS (Tailwind can't detect it at build time), add it to `src/styles/safelist.css` so it's included in the compiled output.

### Responsive breakpoints

Mobile-first. Custom breakpoints: `2xs` (25rem), `xs` (30rem), `sm` (40rem), `md` (48rem), `lg` (64rem), `xl` (80rem), `2xl` (96rem).

---

## Third-Party Integrations

The following integrations are active in the theme. Be careful when working near this code — changes can affect tracking, compliance, or third-party functionality:

- **Klaviyo** — email/SMS forms, back-in-stock widgets
- **Okendo** — product reviews
- **Gorgias** — chat widget (positioned above sticky ATC)
- **Loop Subscriptions** — bundle/subscription management (affects cart)
- **Rivo** — loyalty program
- **Consentmo** — GDPR consent
- **VWO** — A/B testing
- **Google Tag Manager** — analytics container
- **Google Ads + additional marketing pixels** — tracking

The tracking/pixel setup is complex. When touching `layout/theme.liquid`, `snippets/data-layer.liquid`, or any `{% render %}` calls for these integrations, flag any structural changes before making them.

---

## Shopify Documentation

**Always check Shopify docs before writing Liquid, using Shopify APIs, or working with Shopify-specific features.** Do not rely solely on training data — Shopify updates its platform frequently and the model's knowledge may be outdated.

Use the `search_docs_chunks` tool (available via the Shopify MCP integration) to look up current Shopify Liquid objects, filters, tags, and API behavior before implementing. This applies to:
- Liquid filters, objects, and tags
- Storefront and Admin API usage
- Section/block schema options
- Metafield types and access patterns
- Cart, product, and collection object properties

---

## Key Gotchas

- **Never edit files in `assets/` directly.** They are overwritten on every build.
- **Shopify docs over training data.** Shopify Liquid and the Admin API change frequently. When in doubt, look it up.
- **`main` is live production.** Never commit directly to main. Always use a feature branch.
- **`main2` / `main3` are marketing preview themes** — coordinate before rebasing or force-pushing those branches.
- **Vite base path is `""`** — chunk imports must be relative URLs for Shopify's CDN to resolve them correctly. Do not change this.
- **`emptyOutDir: false`** in Vite config — intentional, preserves fonts and vendor JS in `assets/` that Vite doesn't own.
