import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Liquid } from "liquidjs";

const source = await readFile(
  new URL("../sections/collection-banner.liquid", import.meta.url),
  "utf8"
);
const template = source.replace(/{%-?\s*schema\s*-?%}[\s\S]*$/, "");
const engine = new Liquid();
engine.registerFilter("asset_url", (value) => value);

async function render(description) {
  return engine.parseAndRender(template, {
    section: { settings: { show_collection_description: true } },
    collection: { title: "Body Care", description, metafields: { custom: {} } },
  });
}

for (const description of ["Plain description", "<em>Inline</em> text", ""]) {
  test(`preserves banner typography for inline content: ${description || "empty"}`, async () => {
    const html = await render(description);
    assert.ok(
      html.includes(`<div class="tracking-wide lg:text-lg xl:text-xl">${description}</div>`)
    );
  });
}

for (const tag of [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "div",
  "table",
  "blockquote",
  "section",
]) {
  test(`accepts ${tag} HTML without adding inherited banner typography`, async () => {
    const description = `<${tag}>Rich content</${tag}>`;
    const html = await render(description);
    assert.ok(html.includes(`<div>${description}</div>`));
    assert.ok(!html.includes(`<p class="tracking-wide lg:text-lg xl:text-xl">${description}`));
  });
}

test("recognizes block tags with attributes", async () => {
  const description = '<p class="merchant-copy">First paragraph</p><p>Second paragraph</p>';
  assert.ok((await render(description)).includes(`<div>${description}</div>`));
});
