# Accessibility Content Checker

This checker scans recently updated Shopify content for content-authored accessibility patterns that can become SortSite findings.

The first version is read-only and report-only. It does not edit Shopify content or theme files.

## Checks

- Vague link/button labels such as `here`, `click here`, `read more`, and `learn more`.
- Empty links or buttons.
- Accessible names that do not include the visible link/button text.
- Missing or empty image `alt` text.
- Image `alt` text that looks like a file name.
- Empty headings.

## GitHub Action

The workflow is `.github/workflows/accessibility-content-check.yml`.

It is manual-only for the first phase and can be run from the GitHub Actions tab.

Required GitHub secrets:

- `SHOPIFY_SHOP_DOMAIN`
- `SHOPIFY_ADMIN_TOKEN`
- `SHOPIFY_STOREFRONT_DOMAIN`

Optional GitHub secret:

- `SHOPIFY_API_VERSION` defaults to `2026-07` when omitted.

The Shopify app should be read-only and include these Admin API scopes:

- `read_products`
- `read_content` or `read_online_store_pages`
- `read_files`

## Local Dry Run

Run the fixture scan:

```bash
npm run accessibility:content:fixture
```

Run against Shopify after adding local environment variables:

```bash
npm run accessibility:content
```

Optional variables:

- `LOOKBACK_HOURS`: defaults to `48`.
- `CONTENT_CHECK_LIMIT`: defaults to `25`.
- `SHOPIFY_API_VERSION`: defaults to `2026-07`.

