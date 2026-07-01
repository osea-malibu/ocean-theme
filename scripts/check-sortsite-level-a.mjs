import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const failures = [];
const passes = [];
const notes = [];

const liveTargets = [
  "/",
  "/collections/all?page=3",
  "/collections/all?page=4",
  "/collections/discount-collection?page=3",
  "/pages/clinical-results-face-moisturizers",
  "/pages/customer-care",
  "/pages/customer-care?tab=2",
  "/pages/careers",
  "/products/ocean-cleansing-mudd",
  "/products/vagus-nerve-pillow-mist-travel-size",
  "/blogs/wellness-blog/bio-retinol-myths-debunked",
  "/blogs/wellness-blog/the-secret-to-fuller-looking-lips",
  "/blogs/wellness-blog/this-lip-mask-is-a-dream-come-true",
  "/blogs/wellness-blog/top-14-facts-about-seaweed",
  "/blogs/wellness-blog/words-of-wisdom-on-mother-s-day",
  "/blogs/wellness-blog/sunscreen-myths-debunked",
];

if (args.help) {
  printHelp();
  process.exit(0);
}

await main();

async function main() {
  runStaticChecks();

  if (args.htmlDir) {
    runHtmlDirectoryChecks(args.htmlDir);
  }

  if (args.baseUrl) {
    await runLiveChecks(args.baseUrl, args.paths || liveTargets);
  }

  printResults();
  process.exitCode = failures.length > 0 ? 1 : 0;
}

function runStaticChecks() {
  const pkg = JSON.parse(readRel("package.json"));
  pass(
    "package script exists",
    pkg.scripts?.["check:a11y:level-a"] === "node scripts/check-sortsite-level-a.mjs",
    "Expected package.json to expose npm run check:a11y:level-a."
  );

  const cardProduct = readRel("snippets/card-product.liquid");
  pass(
    "waitlist links include product-specific accessible names",
    /data-bis-plp[\s\S]*aria-label="Join the waitlist for {{ title_accessible_text \| escape }}"/.test(
      cardProduct
    ),
    'Expected data-bis-plp links to include aria-label="Join the waitlist for ...".'
  );
  pass(
    "product card links can receive duplicate-title context",
    cardProduct.includes("product_link_label_suffix") &&
      cardProduct.includes("title_accessible_text") &&
      cardProduct.includes("product page"),
    "Expected card-product to support a product_link_label_suffix in accessible link names."
  );

  const mainCollection = readRel("sections/main-collection.liquid");
  pass(
    "collection cards pass duplicate-title context only when needed",
    mainCollection.includes("duplicate_product_title_count") &&
      mainCollection.includes("product_link_label_suffix: product_link_label_suffix"),
    "Expected main-collection to pass product_link_label_suffix for duplicate product titles."
  );

  const multicolumn = readRel("sections/multicolumn.liquid");
  pass(
    "multicolumn linked images support image_aria_label",
    multicolumn.includes("image_link_aria_label") &&
      multicolumn.includes('"id": "image_aria_label"'),
    "Expected multicolumn linked images to support an image_aria_label setting."
  );

  const pageBanner = readRel("sections/page-banner.liquid");
  pass(
    "page banner avoids nested heading markup",
    pageBanner.includes("block.settings.heading contains '<h'"),
    "Expected page-banner to render explicit heading HTML without nesting it inside another h1."
  );

  const indexJson = parseThemeJson("templates/index.json");
  const indexSettings = collectSettings(indexJson);
  pass(
    "home hero aria labels contain visible labels",
    indexSettings.some(
      (settings) =>
        typeof settings.paragraph === "string" &&
        settings.paragraph.includes('aria-label="Shop Body Serum: Hyaluronic Body Serum"') &&
        settings.paragraph.includes('aria-label="Shop Face Serum: Hyaluronic Sea Serum"')
    ),
    "Expected home hero product links to include visible button text in aria-label."
  );
  pass(
    "home Our Family linked image has an accessible name",
    indexSettings.some(
      (settings) =>
        settings.image_link === "shopify://pages/our-family" &&
        settings.image_aria_label === "Our family story"
    ),
    "Expected the linked Our Family home image to set image_aria_label."
  );

  const clinicalJson = parseThemeJson("templates/page.clinicals-face.json");
  const clinicalSettings = collectSettings(clinicalJson);
  const marineProductLink = "shopify://products/marine-screen-spf-50-mineral-sunscreen";
  pass(
    "clinical Marine Screen jump link has a distinct accessible name",
    clinicalSettings.some(
      (settings) =>
        typeof settings.heading === "string" &&
        settings.heading.includes("Jump to Marine Screen SPF 50 Mineral Sunscreen clinical results")
    ),
    "Expected the Marine Screen navigation link to describe that it jumps to clinical results."
  );
  pass(
    "clinical Marine Screen product image links are named as shop links",
    clinicalSettings.filter(
      (settings) =>
        settings.image_link === marineProductLink &&
        settings.image_aria_label === "Shop Marine Screen SPF 50 Mineral Sunscreen"
    ).length >= 5,
    'Expected Marine Screen product image links to have image_aria_label="Shop Marine Screen SPF 50 Mineral Sunscreen".'
  );
  pass(
    "clinical Marine Screen CTA labels match their actual product destination",
    clinicalSettings.filter(
      (settings) =>
        settings.link === marineProductLink &&
        settings.button_label === "Learn More" &&
        settings.button_aria_label === "Learn More about Marine Screen SPF 50 Mineral Sunscreen"
    ).length >= 2,
    "Expected Marine Screen Learn More buttons to name Marine Screen, not Dream Night Cream."
  );
}

async function runLiveChecks(baseUrl, paths) {
  if (typeof fetch !== "function") {
    fail("live checks unavailable", "This Node runtime does not provide global fetch.");
    return;
  }

  for (const path of paths) {
    const url = new URL(path, normalizeBaseUrl(baseUrl)).toString();
    let html;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        fail(`fetch ${path}`, `Expected 2xx response, got ${response.status} for ${url}.`);
        continue;
      }
      html = await response.text();
    } catch (error) {
      fail(`fetch ${path}`, error.message);
      continue;
    }

    runRenderedChecks(path, html);
  }
}

function runHtmlDirectoryChecks(htmlDir) {
  const absoluteDir = resolve(root, htmlDir);
  if (!existsSync(absoluteDir)) {
    fail("html directory exists", `No directory found at ${absoluteDir}.`);
    return;
  }

  for (const file of listHtmlFiles(absoluteDir)) {
    const html = readFileSync(file, "utf8");
    runGenericRenderedChecks(relative(root, file), html);
  }
}

function runRenderedChecks(path, html) {
  const normalizedPath = path.split("?")[0];

  if (normalizedPath === "/") {
    checkHomeLabels(path, html);
  }

  if (
    normalizedPath === "/collections/all" ||
    normalizedPath === "/collections/discount-collection"
  ) {
    checkWaitlistLinks(path, html);
    checkDuplicateProductTitleLinks(path, html);
  }

  if (normalizedPath === "/pages/clinical-results-face-moisturizers") {
    checkClinicalMarineLinks(path, html);
  }

  if (normalizedPath === "/pages/customer-care") {
    checkGorgiasPseudoLinks(path, html);
  }

  if (isContentCleanupTarget(normalizedPath)) {
    runGenericRenderedChecks(path, html);
  }
}

function runGenericRenderedChecks(label, html) {
  checkEmptyHeadings(label, html);
  checkBlankLinks(label, html);
  checkInvalidLists(label, html);
  checkGorgiasPseudoLinks(label, html);
}

function checkHomeLabels(label, html) {
  const interactiveItems = [...findElements("a", html), ...findElements("button", html)];

  for (const item of interactiveItems) {
    const visible = visibleText(item.body);
    const ariaLabel = getAttr(item.attrs, "aria-label");

    if (visible === "Shop Body Serum") {
      pass(
        `${label} Shop Body Serum label-in-name`,
        ariaLabel?.includes("Shop Body Serum"),
        'Expected aria-label to include visible text "Shop Body Serum".'
      );
    }

    if (visible === "Shop Face Serum") {
      pass(
        `${label} Shop Face Serum label-in-name`,
        ariaLabel?.includes("Shop Face Serum"),
        'Expected aria-label to include visible text "Shop Face Serum".'
      );
    }
  }

  for (const anchor of findElements("a", html)) {
    const href = getAttr(anchor.attrs, "href") || "";
    if (href.includes("/pages/our-family")) {
      pass(
        `${label} Our Family image link has accessible name`,
        accessibleName(anchor).length > 0,
        "Expected every /pages/our-family link to have text, aria-label, or image alt text."
      );
    }
  }
}

function checkWaitlistLinks(label, html) {
  const waitlistLinks = findElements("a", html).filter((anchor) =>
    hasAttr(anchor.attrs, "data-bis-plp")
  );

  for (const link of waitlistLinks) {
    const name = accessibleName(link);
    pass(
      `${label} waitlist link names product`,
      /^Join the waitlist for\s+\S+/.test(name),
      `Expected waitlist accessible name to start with "Join the waitlist for"; got "${name}".`
    );
  }
}

function checkDuplicateProductTitleLinks(label, html) {
  const productLinks = findElements("a", html).filter((anchor) => {
    const href = getAttr(anchor.attrs, "href") || "";
    return href.includes("/products/");
  });
  const byName = new Map();

  for (const anchor of productLinks) {
    const name = accessibleName(anchor);
    if (!name) continue;
    const href = getAttr(anchor.attrs, "href") || "";
    const destinations = byName.get(name) || new Set();
    destinations.add(href.split("?")[0]);
    byName.set(name, destinations);
  }

  for (const [name, destinations] of byName) {
    if (name.includes("Undaria Algae") && name.includes("Body Lotion Travel Size")) {
      pass(
        `${label} duplicate Body Lotion Travel Size product names are disambiguated`,
        destinations.size === 1,
        `Accessible name "${name}" points to multiple destinations: ${[...destinations].join(
          ", "
        )}.`
      );
    }
  }
}

function checkClinicalMarineLinks(label, html) {
  const anchors = findElements("a", html);
  const jumpLinks = anchors.filter((anchor) =>
    (getAttr(anchor.attrs, "href") || "").includes("#/marine-screen-spf-50-mineral-sunscreen")
  );
  const productLinks = anchors.filter((anchor) =>
    (getAttr(anchor.attrs, "href") || "").includes(
      "/products/marine-screen-spf-50-mineral-sunscreen"
    )
  );

  for (const link of jumpLinks) {
    const name = accessibleName(link);
    pass(
      `${label} Marine Screen jump link describes clinical results`,
      name.includes("Jump to Marine Screen SPF 50 Mineral Sunscreen clinical results"),
      `Expected Marine Screen jump link to describe clinical results; got "${name}".`
    );
  }

  for (const link of productLinks) {
    const name = accessibleName(link);
    pass(
      `${label} Marine Screen product link describes product destination`,
      /Marine Screen SPF 50 Mineral Sunscreen/.test(name) &&
        /(Shop|Learn More|product page)/.test(name),
      `Expected Marine Screen product link to name the product destination; got "${name}".`
    );
  }
}

function checkGorgiasPseudoLinks(label, html) {
  for (const anchor of findElements("a", html)) {
    const onclick = getAttr(anchor.attrs, "onclick") || "";
    const href = getAttr(anchor.attrs, "href");
    pass(
      `${label} no non-href Gorgias pseudo-link`,
      !(onclick.includes("GorgiasChat.open") && !href),
      `Expected GorgiasChat.open trigger to be a button or real link; found <a ${anchor.attrs}>.`
    );
  }
}

function checkEmptyHeadings(label, html) {
  for (const level of [1, 2, 3, 4, 5, 6]) {
    for (const heading of findElements(`h${level}`, html)) {
      const name = accessibleName(heading);
      pass(
        `${label} h${level} is not empty`,
        name.length > 0,
        `Expected heading to have text or image alt text; found <h${level} ${heading.attrs}>.`
      );
    }
  }
}

function checkBlankLinks(label, html) {
  for (const anchor of findElements("a", html)) {
    const ariaHidden = getAttr(anchor.attrs, "aria-hidden");
    if (ariaHidden === "true") continue;

    pass(
      `${label} link has accessible name`,
      accessibleName(anchor).length > 0,
      `Expected link to have text, aria-label, title, or image alt text; found <a ${anchor.attrs}>.`
    );
  }
}

function checkInvalidLists(label, html) {
  const listPattern = /<ul\b[^>]*>([\s\S]*?)<\/ul>/gi;
  let match;

  while ((match = listPattern.exec(html))) {
    const content = match[1].replace(/<!--[\s\S]*?-->/g, "").trim();
    if (!content) continue;

    pass(
      `${label} ul direct children are list items`,
      !/^<(?!li\b|script\b|template\b)/i.test(content),
      `Expected <ul> to start with <li>; found "${content.slice(0, 80)}".`
    );
  }
}

function isContentCleanupTarget(path) {
  return [
    "/pages/careers",
    "/products/ocean-cleansing-mudd",
    "/products/vagus-nerve-pillow-mist-travel-size",
    "/blogs/wellness-blog/bio-retinol-myths-debunked",
    "/blogs/wellness-blog/the-secret-to-fuller-looking-lips",
    "/blogs/wellness-blog/this-lip-mask-is-a-dream-come-true",
    "/blogs/wellness-blog/top-14-facts-about-seaweed",
    "/blogs/wellness-blog/words-of-wisdom-on-mother-s-day",
    "/blogs/wellness-blog/sunscreen-myths-debunked",
  ].includes(path);
}

function findElements(tagName, html) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const elements = [];
  let match;

  while ((match = pattern.exec(html))) {
    elements.push({
      attrs: match[1],
      body: match[2],
      raw: match[0],
    });
  }

  return elements;
}

function accessibleName(element) {
  return normalizeText(
    getAttr(element.attrs, "aria-label") ||
      getAttr(element.attrs, "title") ||
      visibleText(element.body)
  );
}

function visibleText(html) {
  return normalizeText(
    decodeEntities(
      html
        .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
        .replace(/<img\b([^>]*)>/gi, (_match, attrs) => ` ${getAttr(attrs, "alt") || ""} `)
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function getAttr(attrs, name) {
  const pattern = new RegExp(
    `(?:^|\\s)${escapeRegExp(name)}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+)))?`,
    "i"
  );
  const match = attrs.match(pattern);
  if (!match) return null;
  if (match[1] !== undefined) return decodeEntities(match[1]);
  if (match[2] !== undefined) return decodeEntities(match[2]);
  if (match[3] !== undefined) return decodeEntities(match[3]);
  return "";
}

function hasAttr(attrs, name) {
  return getAttr(attrs, name) !== null;
}

function collectSettings(node, found = []) {
  if (!node || typeof node !== "object") return found;

  if (node.settings && typeof node.settings === "object") {
    found.push(node.settings);
  }

  for (const value of Object.values(node)) {
    collectSettings(value, found);
  }

  return found;
}

function parseThemeJson(path) {
  return JSON.parse(stripThemeJsonComment(readRel(path)));
}

function stripThemeJsonComment(source) {
  return source.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "");
}

function readRel(path) {
  return readFileSync(join(root, path), "utf8");
}

function listHtmlFiles(dir) {
  const entries = [];

  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      entries.push(...listHtmlFiles(absolute));
    } else if (/\.(html?|xhtml)$/i.test(entry)) {
      entries.push(absolute);
    }
  }

  return entries;
}

function parseArgs(argv) {
  const parsed = {
    baseUrl: "",
    htmlDir: "",
    paths: null,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg.startsWith("--base-url=")) {
      parsed.baseUrl = arg.slice("--base-url=".length);
    } else if (arg.startsWith("--html-dir=")) {
      parsed.htmlDir = arg.slice("--html-dir=".length);
    } else if (arg.startsWith("--paths=")) {
      parsed.paths = arg
        .slice("--paths=".length)
        .split(",")
        .map((path) => path.trim())
        .filter(Boolean);
    } else {
      notes.push(`Ignoring unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function pass(name, condition, message) {
  if (condition) {
    passes.push(name);
  } else {
    fail(name, message);
  }
}

function fail(name, message) {
  failures.push({ name, message });
}

function printResults() {
  for (const note of notes) {
    console.log(`note: ${note}`);
  }

  if (failures.length === 0) {
    console.log(`OK: ${passes.length} Level A targeted checks passed.`);
    return;
  }

  console.error(`FAIL: ${failures.length} Level A targeted checks failed.`);
  for (const failure of failures) {
    console.error(`- ${failure.name}: ${failure.message}`);
  }
}

function printHelp() {
  console.log(`Usage:
  npm run check:a11y:level-a
  npm run check:a11y:level-a -- --base-url=https://preview-url
  npm run check:a11y:level-a -- --html-dir=path/to/html
  npm run check:a11y:level-a -- --base-url=https://preview-url --paths=/,/pages/customer-care

Without arguments, this runs static repo checks for the OSEA-owned Level A fixes.
With --base-url, it fetches affected rendered pages and runs targeted live checks.
With --html-dir, it scans saved rendered HTML files for content cleanup checks.`);
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function normalizeText(value) {
  return decodeEntities(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, number) => String.fromCodePoint(parseInt(number, 10)));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
