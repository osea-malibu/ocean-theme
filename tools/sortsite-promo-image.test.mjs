import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Liquid } from "liquidjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const engine = new Liquid({ root: `${root}/snippets`, extname: ".liquid" });
engine.registerFilter("image_url", (image) => {
  assert.ok(image?.src, "image_url receives an image, not a metafield wrapper");
  return image.src;
});
const source = await readFile(`${root}/sections/main-collection.liquid`, "utf8");
const start = source.indexOf("assign has_global_tile_content = false");
assert.ok(start >= 0);
const selection = source.slice(start, source.indexOf("-%}", start));
const template = `{% liquid\n${selection}\n%}
  {% render 'collection-promo-tile', promo_tile_image: promo_tile_image,
    promo_tile_url: promo_tile_url, promo_tile_title: collection.title %}`;

const image = { src: "/promo.jpg", width: 1000, height: 1250, aspect_ratio: 0.8, alt: "" };
async function render(localImage, globalImage = null) {
  return engine.parseAndRender(template, {
    settings: {
      enable_global_plp_tile: Boolean(globalImage),
      global_plp_tile_image: globalImage,
      global_plp_tile_url: "/collections/global",
    },
    collection: {
      title: "Body & Skin",
      metafields: {
        custom: { promo_tile_image: localImage ? { value: localImage } : null },
        custom_fields: { promo_tile_url: "/collections/local" },
      },
    },
  });
}

test("local image reference supplies real dimensions and preserves the fallback link name", async () => {
  const html = await render(image);
  assert.match(html, /width="1000"\s+height="1250"/);
  assert.match(html, /href="\/collections\/local"/);
  assert.match(html, /aria-label="Body &amp; Skin"/);
  assert.match(html, /src="\/promo.jpg\s*"/);
});

test("global image setting still takes precedence over a local metafield", async () => {
  const html = await render(image, { ...image, src: "/global.jpg", alt: "Global promo" });
  assert.match(html, /src="\/global.jpg\s*"/);
  assert.match(html, /href="\/collections\/global"/);
  assert.match(html, /alt="Global promo"/);
  assert.doesNotMatch(html, /aria-label=/);
});

for (const overrides of [
  { aspect_ratio: 0 },
  { aspect_ratio: null },
  { aspect_ratio: undefined },
]) {
  test(`intrinsic height remains valid when aspect ratio is ${overrides.aspect_ratio}`, async () => {
    const html = await render({ ...image, ...overrides });
    assert.match(html, /width="1000"\s+height="1250"/);
    assert.doesNotMatch(html, /Liquid error|Infinity|NaN/);
  });
}

test("missing dimensions use the existing 4:5 tile ratio without breaking the image or link", async () => {
  const html = await render({ src: "/promo.jpg", alt: "" });
  const img = html.match(/<img[\s\S]*?>/)[0];
  assert.match(img, /width="352"\s+height="440"/);
  assert.match(html, /href="\/collections\/local"/);
});

test("absent promo image does not render an image", async () => {
  assert.doesNotMatch(await render(null), /<img/);
});
