import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Liquid } from "liquidjs";

const source = await readFile(
  new URL("../sections/collection-comparison-matrix.liquid", import.meta.url),
  "utf8"
);
// Shopify generates form markup server-side. Adapt only that tag and omit unrelated
// snippet output; exercise the real section's loops, IDs, variant fields and buttons.
const template = source
  .replace(/{%-?\s*schema\s*-?%}[\s\S]*$/, "")
  .replace(/{%-?\s*render\s[\s\S]*?-?%}/g, "")
  .replace(/{%-?\s*form 'product',[\s\S]*?-?%}/g, '<form id="{{ product_form_id }}">')
  .replace(/{%-?\s*endform\s*-?%}/g, "</form>");
const engine = new Liquid();
engine.registerFilter("image_url", () => "/fixture.jpg");
engine.registerFilter("t", (key) => key);

const product = (id, available = true) => ({
  id,
  title: `Product ${id}`,
  selected_or_first_available_variant: { id: id * 10, available },
  metafields: { custom: {} },
});

async function render(products, sectionId = "matrix") {
  // LiquidJS arrays use length, while this Shopify reference-list lookup uses count.
  products.count = products.length;
  return engine.parseAndRender(template, {
    collection: { metafields: { custom: { comparison_matrix_products: { value: products } } } },
    section: { id: sectionId, settings: {} },
    settings: { cart_type: "drawer" },
  });
}

for (const products of [[], [product(1)], [product(1), product(2, false), product(1)]]) {
  test(`matrix with ${products.length} products has unique IDs and correct per-form variants`, async () => {
    const html = await render(products);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, "IDs are unique across both rendered layouts");
    const forms = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)];
    assert.equal(forms.length, products.length * 2);
    forms.forEach(([form], index) => {
      const expected = products[index % products.length];
      assert.match(form, new RegExp(`name="id" value="${expected.id * 10}"`));
      assert.equal(
        /<button[^>]*\sdisabled[\s>]/.test(form),
        !expected.selected_or_first_available_variant.available
      );
      assert.match(form, /name="properties\[_is_subscription\]" value="false"/);
      assert.match(form, /type="submit"/);
    });
  });
}

test("separate section instances do not share product form or button-container IDs", async () => {
  const html = (await render([product(1)], "matrix-a")) + (await render([product(1)], "matrix-b"));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((id) => id !== "comparison"); // Existing navigation anchor is outside this fix.
  assert.equal(new Set(ids).size, ids.length);
});
