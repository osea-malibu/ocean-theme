function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function getCurrency() {
  return window.Shopify?.currency?.active || window.Shopify?.currency?.shop_currency || "USD";
}

function getCartAddItem(response) {
  if (!response) return {};
  return Array.isArray(response.items) ? response.items[0] || {} : response;
}

function getCartAddItemData(response) {
  const item = getCartAddItem(response);
  const price = item.final_price ?? item.price;

  return {
    productId: item.product_id,
    variantId: item.variant_id ?? item.id,
    productTitle: item.product_title ?? item.title,
    price: price != null ? price / 100 : undefined,
    itemBrand: item.vendor,
    itemCategory: item.product_type,
    quantity: item.quantity,
  };
}

export function getCartAnalyticsData(element, overrides = {}) {
  const dataset = element?.dataset || {};
  const cartItem = getCartAddItemData(overrides.cartAddResponse);

  return {
    event: overrides.event ?? dataset.analyticsEvent,
    source: overrides.source ?? dataset.analyticsSource,
    module: overrides.module ?? dataset.analyticsModule,
    productId: overrides.productId ?? cartItem.productId ?? dataset.analyticsProductId,
    variantId: overrides.variantId ?? cartItem.variantId ?? dataset.analyticsVariantId,
    productTitle: overrides.productTitle ?? cartItem.productTitle ?? dataset.analyticsProductTitle,
    price: overrides.price ?? cartItem.price ?? dataset.analyticsPrice,
    itemBrand: overrides.itemBrand ?? cartItem.itemBrand ?? dataset.analyticsItemBrand,
    itemCategory: overrides.itemCategory ?? cartItem.itemCategory ?? dataset.analyticsItemCategory,
    quantity: overrides.quantity ?? cartItem.quantity ?? dataset.analyticsQuantity ?? 1,
    checked: overrides.checked,
    includeEcommerce: overrides.includeEcommerce,
    currency: overrides.currency ?? dataset.analyticsCurrency,
  };
}

export function pushCartDrawerAnalyticsEvent(eventName, data = {}) {
  if (!eventName || typeof window === "undefined") return;

  const price = parseNumber(data.price);
  const quantity = parseNumber(data.quantity) || 1;
  const moduleName = data.module;
  const includeEcommerce = data.includeEcommerce !== false;

  const payload = {
    event: eventName,
    source: data.source || "cart_drawer",
    module: moduleName,
    product_id: data.productId,
    variant_id: data.variantId,
    product_title: data.productTitle,
    price,
    checked: data.checked,
  };

  window.dataLayer = window.dataLayer || [];

  if (includeEcommerce) {
    const item = compactObject({
      item_name: data.productTitle,
      item_id: data.productId,
      item_variant: data.variantId,
      price,
      quantity,
      item_brand: data.itemBrand,
      item_category: data.itemCategory,
      item_list_name: moduleName,
    });

    payload.ecommerce = {
      currency: data.currency || getCurrency(),
      items: [item],
    };

    window.dataLayer.push({ ecommerce: null });
  }

  window.dataLayer.push(compactObject(payload));
}
