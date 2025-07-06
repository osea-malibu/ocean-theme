# Product Card Migration Guide

## Overview

This guide helps you migrate from the deprecated `product-card.liquid` to the new specialized product card snippets.

## Quick Reference

| Use Case               | Old Snippet    | New Snippet                  |
| ---------------------- | -------------- | ---------------------------- |
| Simple product display | `product-card` | `product-card-basic`         |
| Products with variants | `product-card` | `product-card-with-variants` |
| Compact grid layout    | `product-card` | `product-card-compact`       |
| Featured products      | `product-card` | `product-card-featured`      |
| PDP link cards         | `product-card` | `product-card-pdp-link`      |

## Migration Examples

### 1. Simple Product Display

**Before:**

```liquid
{% render 'product-card',
  card_product: product,
  section_id: section.id,
  show_secondary_image_on_hover: true
%}
```

**After:**

```liquid
{% render 'product-card-basic',
  card_product: product,
  section_id: section.id,
  show_secondary_image_on_hover: true
%}
```

### 2. Products with Variant Pickers

**Before:**

```liquid
{% render 'product-card',
  card_product: product,
  section_id: section.id,
  variant_picker_type: 'button',
  default_to_mini: true,
  show_secondary_image_on_hover: true
%}
```

**After:**

```liquid
{% render 'product-card-with-variants',
  card_product: product,
  section_id: section.id,
  variant_picker_type: 'button',
  default_to_mini: true,
  show_secondary_image_on_hover: true
%}
```

### 3. Compact Grid Layout

**Before:**

```liquid
{% render 'product-card',
  card_product: product,
  section_id: section.id,
  card_class: 'w-44 shrink-0',
  image_class: '!bg-white',
  name_class: '2xs:text-sm'
%}
```

**After:**

```liquid
{% render 'product-card-compact',
  card_product: product,
  section_id: section.id,
  card_class: 'w-44 shrink-0',
  image_class: '!bg-white',
  name_class: '2xs:text-sm'
%}
```

### 4. Featured Products with Reviews

**Before:**

```liquid
{% render 'product-card',
  card_product: product,
  section_id: section.id,
  show_reviews: true,
  show_benefits: true,
  show_secondary_image_on_hover: false
%}
```

**After:**

```liquid
{% render 'product-card-featured',
  card_product: product,
  section_id: section.id,
  show_reviews: true,
  show_benefits: true,
  show_secondary_image_on_hover: false
%}
```

### 5. PDP Link Cards

**Before:**

```liquid
{% render 'product-card',
  card_product: product,
  section_id: section.id,
  is_pdp_link: true,
  pdp_link_label: 'View Details'
%}
```

**After:**

```liquid
{% render 'product-card-pdp-link',
  card_product: product,
  section_id: section.id,
  pdp_link_label: 'View Details'
%}
```

## Parameter Mapping

### Common Parameters (All Snippets)

| Parameter                       | Type    | Description                                  |
| ------------------------------- | ------- | -------------------------------------------- |
| `card_product`                  | Object  | Product object (required)                    |
| `section_id`                    | String  | Section ID for unique identifiers (required) |
| `show_secondary_image_on_hover` | Boolean | Show hover image (optional)                  |
| `card_class`                    | String  | CSS classes for card container (optional)    |
| `image_class`                   | String  | CSS classes for image container (optional)   |
| `name_class`                    | String  | CSS classes for product name (optional)      |
| `description_class`             | String  | CSS classes for description (optional)       |
| `badge_class`                   | String  | CSS classes for badge (optional)             |
| `hide_badge`                    | Boolean | Hide badge (optional)                        |
| `remove_linking`                | Boolean | Remove product links (optional)              |
| `remove_lazy_loading`           | Boolean | Remove lazy loading (optional)               |

### product-card-with-variants.liquid

| Parameter                | Type    | Description                                |
| ------------------------ | ------- | ------------------------------------------ |
| `variant_picker_type`    | String  | 'button', 'dropdown', or 'none' (optional) |
| `variant_picker_classes` | String  | CSS classes for variant picker (optional)  |
| `default_to_mini`        | Boolean | Default to travel size (optional)          |
| `default_to_jumbo`       | Boolean | Default to jumbo size (optional)           |

### product-card-compact.liquid

| Parameter    | Type    | Description           |
| ------------ | ------- | --------------------- |
| `show_price` | Boolean | Show price (optional) |

### product-card-featured.liquid

| Parameter              | Type    | Description                             |
| ---------------------- | ------- | --------------------------------------- |
| `show_reviews`         | Boolean | Show star reviews (optional)            |
| `show_benefits`        | Boolean | Show benefits icons (optional)          |
| `custom_badge_html`    | String  | Custom HTML for badge (optional)        |
| `custom_badge_classes` | String  | CSS classes for custom badge (optional) |

### product-card-pdp-link.liquid

| Parameter        | Type   | Description                                 |
| ---------------- | ------ | ------------------------------------------- |
| `pdp_link_label` | String | Custom label for PDP link button (optional) |

## Breaking Changes

### Removed Parameters

The following parameters are no longer supported in the new snippets:

- `button_class` - Button styling is now handled internally
- `product_form_class` - Form styling is now handled internally
- `image_element_class` - Image styling is now handled internally
- `subscription` - Subscription logic moved to buy button snippets
- `percent_discount` - Badge logic simplified
- `is_pdp_link` - Use `product-card-pdp-link` instead
- `pdp_link_label` - Use `product-card-pdp-link` with `pdp_link_label` parameter
- `hide_atc` - Use `product-card-basic` instead
- `plp_card` - Use `product-card-compact` instead
- `title_text` - Use custom title in product data
- `short_description_text` - Use custom description in product data
- `custom_badge_html` - Only available in `product-card-featured`
- `custom_badge_classes` - Only available in `product-card-featured`

### Behavior Changes

- Add-to-cart functionality is now placeholder until buy button branch merges
- Variant picker styling is more consistent across snippets
- Image sizing is optimized for each use case
- Badge positioning is standardized

## Migration Checklist

### Before Migration

- [ ] Identify all usages of `product-card.liquid`
- [ ] Determine the appropriate new snippet for each usage
- [ ] Test the new snippet in isolation
- [ ] Plan migration order (start with simple cases)

### During Migration

- [ ] Update snippet name
- [ ] Remove unsupported parameters
- [ ] Test functionality
- [ ] Verify styling
- [ ] Check for console errors

### After Migration

- [ ] Test all affected pages
- [ ] Verify responsive behavior
- [ ] Check accessibility
- [ ] Validate performance
- [ ] Update documentation

## Troubleshooting

### Common Issues

**Issue:** Missing add-to-cart functionality
**Solution:** This is expected until the buy button branch merges. The new snippets have placeholder buttons.

**Issue:** Styling looks different
**Solution:** The new snippets have more consistent styling. Adjust CSS classes if needed.

**Issue:** Variant picker not working
**Solution:** Ensure you're using `product-card-with-variants` for products with variants.

**Issue:** Badge not showing
**Solution:** Check if the product has badges and ensure `hide_badge` is not set to `true`.

### Getting Help

- Check the test plan for specific testing scenarios
- Review the deprecation plan for timeline information
- Contact the development team for support

## Best Practices

### Choose the Right Snippet

- Use `product-card-basic` for simple displays
- Use `product-card-with-variants` for products with options
- Use `product-card-compact` for grid layouts
- Use `product-card-featured` for highlighted products
- Use `product-card-pdp-link` for PDP navigation

### Performance Considerations

- The new snippets are optimized for their specific use cases
- Compact snippets load faster
- Lazy loading is enabled by default
- Images are sized appropriately for each context

### Maintainability

- Each snippet has a single responsibility
- Changes to one snippet don't affect others
- Easier to debug and customize
- Better code organization
