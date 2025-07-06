# Product Card Refactoring Test Plan

## Overview

This document outlines the testing requirements for the product card refactoring that replaced the monolithic `product-card.liquid` with specialized snippets.

## Updated Sections to Test

### 1. main-collection.liquid

**New Snippets Used:**

- `product-card-with-variants` (normal products)
- `product-card-basic` (hidden/linked-out products)

**Test Scenarios:**

- [ ] Collection page loads without errors
- [ ] Product cards display correctly with images, titles, descriptions
- [ ] Variant pickers work for products with multiple variants
- [ ] Add-to-cart buttons function (placeholder until buy button branch merges)
- [ ] Products with `hide_atc: true` show basic cards without buttons
- [ ] Products with `remove_linking: true` don't have clickable links
- [ ] Lazy loading works for products after first 3
- [ ] Product badges display correctly
- [ ] Hover effects work (if enabled)

### 2. product-recommendations.liquid

**New Snippets Used:**

- `product-card-basic`

**Test Scenarios:**

- [ ] Recommendations load dynamically
- [ ] Product cards display correctly
- [ ] Secondary image hover works (if enabled)
- [ ] Cards are properly styled with custom classes
- [ ] No add-to-cart functionality (basic cards)

### 3. product-grid.liquid

**New Snippets Used:**

- `product-card-with-variants` (normal products)
- `product-card-pdp-link` (PDP link products)

**Test Scenarios:**

- [ ] Grid displays products correctly
- [ ] Variant pickers work for products with variants
- [ ] PDP link cards show "View product" button instead of add-to-cart
- [ ] Custom image classes apply correctly
- [ ] Subscription products work correctly
- [ ] Different variant picker types (button/dropdown) work

### 4. featured-collections.liquid

**New Snippets Used:**

- `product-card-featured`

**Test Scenarios:**

- [ ] Featured collections slider works
- [ ] Product cards show reviews (if enabled)
- [ ] Benefits icons display (if product has benefits metafield)
- [ ] Enhanced styling applies correctly
- [ ] Tab navigation works between collections
- [ ] Arrow navigation works
- [ ] Dot indicators work

### 5. main-search.liquid

**New Snippets Used:**

- `product-card-basic`

**Test Scenarios:**

- [ ] Search results display correctly
- [ ] Product cards show in search results
- [ ] Non-product results (articles, pages) display correctly
- [ ] Pagination works
- [ ] Filtering works (if enabled)

### 6. multicolumn.liquid

**New Snippets Used:**

- `product-card-compact` (horizontal scroll)
- `product-card-pdp-link` (PDP link blocks)
- `product-card-featured` (featured blocks)
- `product-card-with-variants` (variant blocks)

**Test Scenarios:**

- [ ] Horizontal scroll product slider works
- [ ] Compact cards display correctly in small spaces
- [ ] PDP link blocks show correct button text
- [ ] Featured blocks show reviews and benefits
- [ ] Variant blocks show variant pickers
- [ ] Custom badge HTML displays correctly
- [ ] All block types render without errors

### 7. product-routine.liquid

**New Snippets Used:**

- `product-card-with-variants`

**Test Scenarios:**

- [ ] Routine products display with step numbers
- [ ] Variant pickers work for routine products
- [ ] Step badges display correctly
- [ ] Product color theming works

### 8. main-article.liquid

**New Snippets Used:**

- `product-card-basic`

**Test Scenarios:**

- [ ] Inline product blocks render in article content
- [ ] Product cards display with correct styling
- [ ] No add-to-cart functionality (basic cards)

## Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Device Testing

- [ ] Desktop (1920x1080+)
- [ ] Tablet (768px-1024px)
- [ ] Mobile (320px-767px)
- [ ] Large screens (1440px+)

## Performance Testing

- [ ] Page load times are acceptable
- [ ] No console errors
- [ ] Images load correctly
- [ ] Lazy loading works as expected

## Accessibility Testing

- [ ] Screen readers can navigate product cards
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Alt text is present for images
- [ ] ARIA labels are correct

## Edge Cases

- [ ] Products without images
- [ ] Products without descriptions
- [ ] Products with very long titles
- [ ] Products with special characters in titles
- [ ] Out-of-stock products
- [ ] Gift cards
- [ ] Products with many variants
- [ ] Products with subscription options

## Notes

- Add-to-cart functionality is currently placeholder until the buy button branch merges
- The old `product-card.liquid` is preserved for other theme branches
- All new snippets are backward compatible with existing parameters
