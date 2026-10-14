import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Liquid } from "liquidjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const engine = new Liquid({ root: `${root}/snippets`, extname: ".liquid", strictFilters: true });
engine.registerFilter("json", (value) => JSON.stringify(value ?? null));
// Local checks supplement Shopify rendering; this filter does not test CDN transformations.
engine.registerFilter("image_url", (image) => image.src);
const source = (await readFile(`${root}/sections/main-product.liquid`, "utf8")).replaceAll(
  "\r\n",
  "\n"
);
const start = source.indexOf("{%- liquid\n  assign schema_variant");
assert.ok(start >= 0, "Find the Product schema selection block");
const end = source.indexOf("</script>", start);
assert.ok(end >= 0, "Find the Product schema block end");
const productTemplate = source.slice(start, end + "</script>".length);

export function fixture() {
  const media = (size) => ({
    src: `//cdn.example.com/${size}.jpg`,
    preview_image: { src: `//cdn.example.com/${size}.jpg`, width: 1200 },
  });
  return {
    id: 1,
    title: "Example Serum",
    vendor: "Example",
    description: "<p>Body serum</p>",
    url: "/products/serum",
    variants: [
      {
        id: 101,
        sku: "SERUM-4",
        title: "4 fl oz",
        option1: "4 fl oz",
        barcode: "675468102971",
        price: 4800,
        available: true,
        url: "/products/serum?variant=101",
        featured_media: media("four-ounce"),
      },
      {
        id: 102,
        sku: "SERUM-1",
        title: "1 fl oz",
        option1: "1 fl oz",
        barcode: "675468102988",
        price: 2200,
        available: true,
        url: "/products/serum?variant=102",
        featured_media: media("one-ounce"),
      },
    ],
    featured_media: media("four-ounce"),
    metafields: {
      my_fields: { white_image_bg: { src: "//cdn.example.com/curated-four-ounce.jpg" } },
      okendo: { summaryData: { reviewCount: 42, reviewAverageValue: 4.8 } },
    },
  };
}

export async function renderSchema(template, product) {
  const html = await engine.parseAndRender(template, {
    product,
    shop: { url: "https://example.com" },
    cart: { currency: { iso_code: "USD" } },
  });
  return [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((match) =>
    JSON.parse(match[1])
  );
}

async function gtin(barcode) {
  const field = await engine.renderFile("structured-data-gtin", { barcode });
  const result = JSON.parse(`{${field}"sentinel":true}`);
  delete result.sentinel;
  return result;
}

for (const barcode of [
  "96385074",
  "00012348",
  "036000291452",
  "675468102971",
  "675468102988",
  "4006381333931",
  "10012345000017",
]) {
  test(`GTIN ${barcode}: length-specific string, whitespace, and corrupted digits`, async () => {
    const expected = { [`gtin${barcode.length}`]: barcode };
    assert.deepEqual(await gtin(barcode), expected);
    assert.deepEqual(await gtin(`  ${barcode}  `), expected);
    for (let index = 0; index < barcode.length; index++) {
      const corrupted =
        barcode.slice(0, index) + ((Number(barcode[index]) + 1) % 10) + barcode.slice(index + 1);
      assert.deepEqual(await gtin(corrupted), {});
    }
  });
}

for (const barcode of [
  undefined,
  null,
  "",
  "  ",
  "0",
  "00000000",
  "000000000000",
  "0000000000000",
  "00000000000000",
  "67546810297",
  "675468102971000",
  "67546810297X",
  "675468 02971",
  "675468-102971",
  "+675468102971",
  "-675468102971",
  "6754681029.1",
  "6.75468102971e11",
  "６７５４６８１０２９７１",
  '\"},\"price\":0',
]) {
  test(`Omit invalid barcode ${JSON.stringify(barcode)}`, async () => {
    assert.deepEqual(await gtin(barcode), {});
  });
}

test("Base page retains curated image and all offers without a size-specific identity", async () => {
  const product = fixture();
  const [before] = await renderSchema(productTemplate, product);
  product.variants[0].available = false;
  const [after] = await renderSchema(productTemplate, product);
  assert.deepEqual(after.image, before.image);
  assert.deepEqual(after.image, ["https://cdn.example.com/curated-four-ounce.jpg"]);
  assert.equal(after.sku, undefined);
  assert.equal(after.gtin12, undefined);
  assert.equal(after.offers.length, 2);
  assert.equal(after.offers[0].availability, "https://schema.org/OutOfStock");
  assert.equal(after.url, "https://example.com/products/serum");
});

test("Selected variant pairs GTIN, SKU, image, stock, and exactly one matching offer", async () => {
  const product = fixture();
  const variant = product.variants[1];
  variant.available = false;
  product.selected_variant = variant;
  const [schema] = await renderSchema(productTemplate, product);
  assert.equal(schema.sku, variant.sku);
  assert.equal(schema.gtin12, variant.barcode);
  assert.equal(schema.url, "https://example.com/products/serum?variant=102");
  assert.deepEqual(schema.image, ["https://cdn.example.com/one-ounce.jpg"]);
  assert.deepEqual(schema.offers, [
    {
      "@type": "Offer",
      sku: variant.sku,
      availability: "https://schema.org/OutOfStock",
      price: 22,
      priceCurrency: "USD",
      url: "https://example.com/products/serum?variant=102",
    },
  ]);
});

test("Offers select by variant ID even when SKUs match or are blank", async () => {
  const product = fixture();
  product.variants[1].sku = product.variants[0].sku;
  product.selected_variant = product.variants[1];
  const [schema] = await renderSchema(productTemplate, product);
  assert.equal(schema.offers.length, 1);
  assert.equal(schema.offers[0].price, 22);
  product.variants[1].sku = "";
  const [blank] = await renderSchema(productTemplate, product);
  assert.equal(blank.offers.length, 1);
  assert.equal(blank.offers[0].price, 22);
});

test("Blank or invalid barcode does not remove a correctly imaged variant's offer", async () => {
  const product = fixture();
  product.selected_variant = product.variants[1];
  for (const barcode of [null, "abc", "675468102989"]) {
    product.selected_variant.barcode = barcode;
    const [schema] = await renderSchema(productTemplate, product);
    assert.equal(schema.gtin12, undefined);
    assert.equal(schema.offers.length, 1);
    assert.equal(schema.offers[0].price, 22);
  }
});

test("Missing selected media retains the base representation without a variant identity", async () => {
  const product = fixture();
  const [base] = await renderSchema(productTemplate, product);
  product.selected_variant = product.variants[1];
  for (const media of [null, { preview_image: null }]) {
    product.selected_variant.featured_media = media;
    const schemas = await renderSchema(productTemplate, product);
    assert.equal(schemas.length, 1);
    assert.deepEqual(schemas[0], base);
  }
});

test("Missing selected media falls back to featured product media when no curated image exists", async () => {
  const product = fixture();
  product.selected_variant = product.variants[1];
  product.selected_variant.featured_media = null;
  product.metafields.my_fields.white_image_bg = null;
  const [schema] = await renderSchema(productTemplate, product);
  assert.deepEqual(schema.image, ["https://cdn.example.com/four-ounce.jpg"]);
  assert.equal(schema.sku, undefined);
  assert.equal(schema.gtin12, undefined);
  assert.equal(schema.url, "https://example.com/products/serum");
  assert.equal(schema.offers.length, 2);
  assert.equal(schema.aggregateRating.ratingCount, "42");
});

test("Missing all images keeps other product information without inventing an image", async () => {
  const product = fixture();
  product.selected_variant = product.variants[1];
  product.selected_variant.featured_media = null;
  product.featured_media = null;
  product.metafields.my_fields.white_image_bg = null;
  const [schema] = await renderSchema(productTemplate, product);
  assert.equal(schema.image, undefined);
  assert.equal(schema.sku, undefined);
  assert.equal(schema.gtin12, undefined);
  assert.equal(schema.offers.length, 2);
  assert.equal(schema.brand.name, product.vendor);
  assert.equal(schema.description, "Body serum");
});

test("Single-variant product may use its product-image fallback with its identity", async () => {
  const product = fixture();
  product.variants = [product.variants[0]];
  product.variants[0].featured_media = null;
  product.selected_variant = product.variants[0];
  const [schema] = await renderSchema(productTemplate, product);
  assert.equal(schema.gtin12, "675468102971");
  assert.equal(schema.offers.length, 1);
  assert.deepEqual(schema.image, ["https://cdn.example.com/curated-four-ounce.jpg"]);
  assert.equal(schema.url, "https://example.com/products/serum?variant=101");
  product.selected_variant = null;
  const [base] = await renderSchema(productTemplate, product);
  assert.equal(base.url, "https://example.com/products/serum");
  assert.equal(base.gtin12, "675468102971");
});

const groupTemplate = await readFile(
  `${root}/snippets/structured-data-undaria-product-group.liquid`,
  "utf8"
);

test("Group pairs each validated identifier with its own image and offer", async () => {
  const product = fixture();
  product.id = 8092623623;
  const [group] = await renderSchema(groupTemplate, product);
  assert.equal(group.productGroupID, "8092623623");
  assert.deepEqual(group.variesBy, ["https://schema.org/size"]);
  assert.equal(group.aggregateRating.ratingCount, 42);
  for (const [index, variant] of product.variants.entries()) {
    const node = group.hasVariant[index];
    assert.equal(node.sku, variant.sku);
    assert.equal(node.gtin12, variant.barcode);
    assert.equal(node.image, `https:${variant.featured_media.preview_image.src}`);
    assert.equal(node.offers.url, `https://example.com${variant.url}`);
    assert.equal(node.offers.price, variant.price / 100);
  }
  product.selected_variant = product.variants[1];
  assert.deepEqual((await renderSchema(groupTemplate, product))[0], group);
  product.variants[0].available = false;
  const [sold] = await renderSchema(groupTemplate, product);
  assert.deepEqual(
    sold.hasVariant.map((node) => node.image),
    group.hasVariant.map((node) => node.image)
  );
  assert.equal(sold.hasVariant[0].offers.availability, "https://schema.org/OutOfStock");
});

test("Group omits invalid GTINs without dropping correctly imaged products", async () => {
  const product = fixture();
  for (const barcode of [null, "abc", "675468102989"]) {
    product.variants[1].barcode = barcode;
    const [group] = await renderSchema(groupTemplate, product);
    assert.equal(group.hasVariant.length, 2);
    assert.equal(group.hasVariant[1].gtin12, undefined);
    assert.equal(group.hasVariant[1].gtin, undefined);
    assert.equal(group.hasVariant[1].offers.price, 22);
  }
});

for (const missingIndex of [0, 1, 2]) {
  test(`Group skips missing image at index ${missingIndex} with valid JSON separators`, async () => {
    const product = fixture();
    product.variants.push({ ...structuredClone(product.variants[0]), id: 103, sku: "THIRD" });
    product.variants[missingIndex].featured_media = null;
    const [group] = await renderSchema(groupTemplate, product);
    assert.equal(group.hasVariant.length, 2);
    assert.ok(group.hasVariant.every((node) => node.image));
    assert.ok(!group.hasVariant.some((node) => node.sku === product.variants[missingIndex].sku));
  });
}

test("Group emits no incomplete markup when every image is missing", async () => {
  const product = fixture();
  for (const variant of product.variants) variant.featured_media = null;
  assert.deepEqual(await renderSchema(groupTemplate, product), []);
});

test("Group does not describe other sizes on an explicitly selected size with missing media", async () => {
  const product = fixture();
  product.selected_variant = product.variants[1];
  product.selected_variant.featured_media = null;
  assert.deepEqual(await renderSchema(groupTemplate, product), []);
});

const combinedStart = source.indexOf("{%- if product.id == 8092623623");
assert.ok(combinedStart >= 0, "Find the Undaria schema switch");
const combinedEnd = source.indexOf("{% schema %}", combinedStart);
assert.ok(combinedEnd >= 0, "Find the combined schema block end");
const combined = source.slice(combinedStart, combinedEnd);

test("Combined section emits one group for Undaria and one Product for other products", async () => {
  const product = fixture();
  product.id = 8092623623;
  const [group] = await renderSchema(combined, product);
  assert.equal(group["@type"], "ProductGroup");
  product.id = 1;
  product.selected_variant = product.variants[1];
  const schemas = await renderSchema(combined, product);
  assert.equal(schemas.length, 1);
  assert.equal(schemas[0]["@type"], "Product");
  assert.equal(schemas[0].gtin12, "675468102988");
  assert.equal(schemas[0].offers.length, 1);
});

test("Combined switch preserves distinct missing-media policies without competing Product blocks", async () => {
  const product = fixture();
  product.id = 8092623623;
  product.selected_variant = product.variants[1];
  product.selected_variant.featured_media = null;
  assert.deepEqual(await renderSchema(combined, product), []);
  product.selected_variant = null;
  const family = await renderSchema(combined, product);
  assert.equal(family.length, 1);
  assert.equal(family[0]["@type"], "ProductGroup");
  assert.equal(family[0].hasVariant.length, 1);
  assert.equal(family[0].hasVariant[0].sku, "SERUM-4");
  product.id = 1;
  product.selected_variant = product.variants[1];
  const ordinary = await renderSchema(combined, product);
  assert.equal(ordinary.length, 1);
  assert.equal(ordinary[0]["@type"], "Product");
  assert.equal(ordinary[0].sku, undefined);
  assert.equal(ordinary[0].gtin12, undefined);
  assert.equal(ordinary[0].url, "https://example.com/products/serum");
  assert.equal(ordinary[0].offers.length, 2);
});
