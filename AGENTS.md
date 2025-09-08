# AGENTS.md - OSEA Ocean Theme

## Commands
- **Build JS**: `npm run build` or `node esbuild.config.js`
- **Dev Build**: `npm run dev` (esbuild watch mode)
- **Tailwind CSS**: `npm run tailwind` (watch & compile CSS)
- **Theme Check**: `shopify theme check` (linting)
- **Dev Server**: `shopify theme serve` (requires Shopify CLI)
- **No Tests**: Tests not configured (`npm test` exits with error)

## Architecture
- **Shopify Theme** based on Dawn, built for OSEA skincare brand
- **Layout**: Core theme structure in `layout/` (theme.liquid, password.liquid)
- **Sections**: 47+ reusable sections in `sections/` (headers, footers, product displays, etc.)
- **Snippets**: 108+ reusable components in `snippets/` (icons, product cards, integrations)
- **Templates**: 130+ page templates in `templates/` (JSON format for Online Store 2.0)
- **Assets**: Compiled output in `assets/` (fonts, JS, CSS)
- **Source**: Development files in `src/scripts/` and `src/styles/`

## Code Style
- **CSS Framework**: Tailwind CSS with custom OSEA color palette (seaweed, coral, wave, seafoam, sand, shell)
- **JS Build**: ESBuild with ES2017 target, bundle & minify enabled
- **File Naming**: Kebab-case for Liquid files, camelCase for JS
- **Custom Fonts**: Circular (sans-serif), Canela (serif)
- **Liquid**: Progressive enhancement, minimal JS, server-rendered HTML
- **Colors**: Extensive brand palette with light/medium variants for product-specific themes
- **Icons**: SVG icons via snippets (icon-*.liquid)
- **Integrations**: Klaviyo, Yotpo, Rivo loyalty, Bazaarvoice reviews
