import { readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_API_VERSION = "2026-07";
const DEFAULT_LOOKBACK_HOURS = 48;
const DEFAULT_LIMIT = 25;
const DEFAULT_OUTPUT = "accessibility-content-report.md";

const VAGUE_LABELS = new Set(["here", "click here", "read more", "learn more"]);

const PRODUCTS_QUERY = `
  query RecentlyUpdatedProducts($first: Int!, $query: String!) {
    products(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        title
        handle
        updatedAt
        onlineStoreUrl
        media(first: 25) {
          nodes {
            ... on MediaImage {
              image {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

const ARTICLES_QUERY = `
  query RecentlyUpdatedArticles($first: Int!, $query: String!) {
    articles(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        title
        handle
        updatedAt
        onlineStoreUrl
        blog {
          handle
        }
      }
    }
  }
`;

const PAGES_QUERY = `
  query RecentlyUpdatedPages($first: Int!, $query: String!) {
    pages(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        title
        handle
        updatedAt
        onlineStoreUrl
      }
    }
  }
`;

const FILES_QUERY = `
  query RecentlyUpdatedFiles($first: Int!, $query: String!) {
    files(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        createdAt
        updatedAt
        ... on MediaImage {
          image {
            url
            altText
          }
        }
      }
    }
  }
`;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const startedAt = new Date();
  const warnings = [];
  const sources = [];
  const standaloneImages = [];

  if (options.help) {
    printHelp();
    return;
  }

  if (options.fixture) {
    const html = await readFile(options.fixture, "utf8");
    sources.push({
      type: "Fixture",
      title: path.basename(options.fixture),
      url: `fixture://${path.resolve(options.fixture)}`,
      html,
      updatedAt: null,
      apiImages: [],
    });
  } else if (options.url) {
    sources.push({
      type: "URL",
      title: options.url,
      url: options.url,
      html: null,
      updatedAt: null,
      apiImages: [],
    });
  } else {
    const shopifySources = await getShopifySources(options, warnings);
    sources.push(...shopifySources.sources);
    standaloneImages.push(...shopifySources.standaloneImages);
  }

  const findings = [];

  for (const source of sources) {
    let html = source.html;

    if (!html) {
      try {
        html = await fetchHtml(source.url);
      } catch (error) {
        warnings.push(`Could not fetch ${source.url}: ${error.message}`);
        continue;
      }
    }

    if (!source.html && looksLikeShopifyPasswordPage(html)) {
      warnings.push(
        `Fetched a storefront password page for ${source.url}. Rendered HTML checks may not reflect the actual content.`
      );
    }

    const htmlFindings = scanHtml(html, source);
    findings.push(...htmlFindings);
    findings.push(
      ...scanApiImages(source.apiImages || [], source, renderedImageUrls(html, source.url))
    );
  }

  findings.push(...scanStandaloneImages(standaloneImages));

  const report = buildReport({
    startedAt,
    options,
    sources,
    standaloneImages,
    findings,
    warnings,
  });

  await writeFile(options.output, report, "utf8");

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, report, "utf8");
  }

  console.log(`Accessibility content check complete.`);
  console.log(`Sources checked: ${sources.length}`);
  console.log(`Standalone images checked: ${standaloneImages.length}`);
  console.log(`Findings: ${findings.length}`);
  console.log(`Report: ${options.output}`);

  if (options.expectFindings !== null && findings.length !== options.expectFindings) {
    console.error(`Expected ${options.expectFindings} findings, but found ${findings.length}.`);
    process.exitCode = 1;
    return;
  }

  if (options.failOnFindings && findings.length > 0) {
    process.exitCode = 1;
  }
}

function parseArgs(args) {
  const options = {
    fixture: null,
    url: null,
    output: DEFAULT_OUTPUT,
    lookbackHours: numberFromEnv("LOOKBACK_HOURS", DEFAULT_LOOKBACK_HOURS),
    limit: numberFromEnv("CONTENT_CHECK_LIMIT", DEFAULT_LIMIT),
    expectFindings: null,
    failOnFindings: false,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--fixture") {
      options.fixture = args[++index];
    } else if (arg === "--url") {
      options.url = args[++index];
    } else if (arg === "--output") {
      options.output = args[++index];
    } else if (arg === "--lookback-hours") {
      options.lookbackHours = Number(args[++index]);
    } else if (arg === "--limit") {
      options.limit = Number(args[++index]);
    } else if (arg === "--expect-findings") {
      options.expectFindings = Number(args[++index]);
    } else if (arg === "--fail-on-findings") {
      options.failOnFindings = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.lookbackHours) || options.lookbackHours <= 0) {
    throw new Error("lookback hours must be a positive number");
  }

  if (!Number.isFinite(options.limit) || options.limit <= 0) {
    throw new Error("limit must be a positive number");
  }

  if (
    options.expectFindings !== null &&
    (!Number.isInteger(options.expectFindings) || options.expectFindings < 0)
  ) {
    throw new Error("expected findings must be a non-negative integer");
  }

  return options;
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function printHelp() {
  console.log(`
Usage:
  node tools/accessibility-content-checker/scan.mjs [options]

Options:
  --fixture <path>          Scan one local HTML fixture.
  --url <url>               Scan one rendered URL.
  --output <path>           Write markdown report. Defaults to ${DEFAULT_OUTPUT}.
  --lookback-hours <hours>  Shopify updated content window. Defaults to ${DEFAULT_LOOKBACK_HOURS}.
  --limit <count>           Max items per Shopify resource. Defaults to ${DEFAULT_LIMIT}.
  --expect-findings <count> Exit non-zero unless the finding count matches.
  --fail-on-findings        Exit non-zero when findings are present.
`);
}

async function getShopifySources(options, warnings) {
  const shopDomain = cleanShopDomain(requiredEnv("SHOPIFY_SHOP_DOMAIN"));
  const token = requiredEnv("SHOPIFY_ADMIN_TOKEN");
  const storefrontDomain = cleanStorefrontDomain(requiredEnv("SHOPIFY_STOREFRONT_DOMAIN"));
  const apiVersion = process.env.SHOPIFY_API_VERSION || DEFAULT_API_VERSION;
  const endpoint = `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`;
  const since = new Date(Date.now() - options.lookbackHours * 60 * 60 * 1000).toISOString();
  const query = `updated_at:>='${since}'`;
  const variables = { first: options.limit, query };
  const sources = [];
  const standaloneImages = [];
  let successfulCoreQueries = 0;

  const productData = await safeShopifyQuery(
    endpoint,
    token,
    PRODUCTS_QUERY,
    variables,
    warnings,
    "products"
  );
  if (productData) {
    successfulCoreQueries += 1;
  }
  for (const node of productData?.products?.nodes || []) {
    sources.push({
      type: "Product",
      title: node.title,
      url: node.onlineStoreUrl || `${storefrontDomain}/products/${node.handle}`,
      updatedAt: node.updatedAt,
      apiImages: mediaImagesFromProduct(node),
    });
  }

  const articleData = await safeShopifyQuery(
    endpoint,
    token,
    ARTICLES_QUERY,
    variables,
    warnings,
    "articles"
  );
  if (articleData) {
    successfulCoreQueries += 1;
  }
  for (const node of articleData?.articles?.nodes || []) {
    const fallbackUrl = node.blog?.handle
      ? `${storefrontDomain}/blogs/${node.blog.handle}/${node.handle}`
      : null;

    sources.push({
      type: "Article",
      title: node.title,
      url: node.onlineStoreUrl || fallbackUrl,
      updatedAt: node.updatedAt,
      apiImages: [],
    });
  }

  const pageData = await safeShopifyQuery(
    endpoint,
    token,
    PAGES_QUERY,
    variables,
    warnings,
    "pages"
  );
  if (pageData) {
    successfulCoreQueries += 1;
  }
  for (const node of pageData?.pages?.nodes || []) {
    sources.push({
      type: "Page",
      title: node.title,
      url: node.onlineStoreUrl || `${storefrontDomain}/pages/${node.handle}`,
      updatedAt: node.updatedAt,
      apiImages: [],
    });
  }

  if (successfulCoreQueries === 0) {
    throw new Error(
      "All core Shopify content queries failed. Check Admin API token, scopes, shop domain, and API version."
    );
  }

  const fileData = await safeShopifyQuery(
    endpoint,
    token,
    FILES_QUERY,
    variables,
    warnings,
    "files"
  );
  for (const node of fileData?.files?.nodes || []) {
    if (node.image?.url) {
      standaloneImages.push({
        type: "File",
        title: fileNameFromUrl(node.image.url),
        url: node.image.url,
        alt: node.image.altText,
        updatedAt: node.updatedAt,
      });
    }
  }

  return {
    sources: sources.filter((source) => source.url),
    standaloneImages,
  };
}

function requiredEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return process.env[name];
}

function cleanShopDomain(value) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function cleanStorefrontDomain(value) {
  const cleaned = value.replace(/\/$/, "");
  return /^https?:\/\//.test(cleaned) ? cleaned : `https://${cleaned}`;
}

async function safeShopifyQuery(endpoint, token, query, variables, warnings, label) {
  try {
    return await shopifyGraphql(endpoint, token, query, variables);
  } catch (error) {
    warnings.push(`Could not query Shopify ${label}: ${error.message}`);
    return null;
  }
}

async function shopifyGraphql(endpoint, token, query, variables) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload.data;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "OSEA accessibility content checker",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function looksLikeShopifyPasswordPage(html) {
  return (
    /<form\b[^>]*\baction=["']\/password["']/i.test(html) || /shopify-section-password/i.test(html)
  );
}

function scanHtml(html, source) {
  const normalizedHtml = stripIgnoredHtml(html);
  const labelsById = textById(normalizedHtml);

  return [
    ...scanLinksAndButtons(normalizedHtml, source, labelsById),
    ...scanImages(normalizedHtml, source),
    ...scanHeadings(normalizedHtml, source),
  ];
}

function stripIgnoredHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
}

function scanLinksAndButtons(html, source, labelsById = new Map()) {
  const findings = [];
  const pattern = /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2]);
    const visibleText = normalizeText(textFromHtml(match[3]));
    const ariaLabel = normalizeText(attrs["aria-label"] || "");
    const labelledByName = accessibleNameFromLabelledBy(attrs["aria-labelledby"], labelsById);
    const accessibleName = labelledByName || ariaLabel || accessibleNameFromContent(match[3]);

    if (!accessibleName) {
      findings.push(
        finding(
          source,
          "Empty link or button name",
          tagSnippet(match[0]),
          `${tag} has no visible text or accessible name.`
        )
      );
      continue;
    }

    if (accessibleName && VAGUE_LABELS.has(normalizeForCompare(accessibleName))) {
      findings.push(
        finding(
          source,
          "Vague link or button label",
          accessibleName,
          `Label "${accessibleName}" may not explain the destination or action on its own.`
        )
      );
    }

    if (
      visibleText &&
      (ariaLabel || labelledByName) &&
      !normalizeForCompare(accessibleName).includes(normalizeForCompare(visibleText))
    ) {
      findings.push(
        finding(
          source,
          "Visible label missing from accessible name",
          tagSnippet(match[0]),
          `Visible text "${visibleText}" is not included in accessible name "${accessibleName}".`
        )
      );
    }
  }

  return findings;
}

function scanImages(html, source) {
  const findings = [];
  const pattern = /<img\b([^>]*)>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const attrs = parseAttributes(match[1]);
    const src =
      attrs.src || attrs["data-src"] || attrs.srcset || attrs["data-srcset"] || "unknown image";
    const alt = attrs.alt;
    const imageUrl = normalizeImageUrl(src, source.url);

    if (isDecorativeImage(attrs)) {
      continue;
    }

    if (alt === undefined || normalizeText(alt) === "") {
      findings.push(
        finding(
          source,
          "Missing or empty image alt text",
          src,
          "Image has no alt text or an empty alt attribute.",
          { imageUrl }
        )
      );
      continue;
    }

    if (looksLikeFileName(alt)) {
      findings.push(
        finding(
          source,
          "Image alt text looks like a file name",
          alt,
          "Alt text should describe the image instead of repeating a file name.",
          { imageUrl }
        )
      );
    }
  }

  return findings;
}

function scanHeadings(html, source) {
  const findings = [];
  const pattern = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const level = match[1];
    const text = normalizeText(textFromHtml(match[3]));
    const attrs = parseAttributes(match[2]);
    const ariaLabel = normalizeText(attrs["aria-label"] || "");

    if (!text && !ariaLabel) {
      findings.push(
        finding(
          source,
          "Empty heading",
          tagSnippet(match[0]),
          `h${level} has no visible text or aria-label.`
        )
      );
    }
  }

  return findings;
}

function scanApiImages(images, source, seenImageUrls = new Set()) {
  const findings = [];

  for (const image of images) {
    const alt = normalizeText(image.alt || "");
    const label = image.url || image.title || "API image";
    const imageUrl = normalizeImageUrl(image.url);

    if (imageUrl && seenImageUrls.has(imageUrl)) {
      continue;
    }

    if (!alt) {
      findings.push(
        finding(
          source,
          "Missing product media alt text",
          label,
          "Product media from Shopify Admin API is missing alt text.",
          { imageUrl }
        )
      );
    } else if (looksLikeFileName(alt)) {
      findings.push(
        finding(
          source,
          "Product media alt text looks like a file name",
          alt,
          "Product media alt text should describe the image.",
          { imageUrl }
        )
      );
    }
  }

  return findings;
}

function scanStandaloneImages(images) {
  const findings = [];

  for (const image of images) {
    const source = {
      type: image.type || "File",
      title: image.title || fileNameFromUrl(image.url),
      url: image.url,
      updatedAt: image.updatedAt || null,
    };
    const alt = normalizeText(image.alt || "");
    const imageUrl = normalizeImageUrl(image.url);

    if (!alt) {
      findings.push(
        finding(
          source,
          "Missing uploaded image alt text",
          image.url,
          "Recently updated Shopify file is missing alt text.",
          { imageUrl }
        )
      );
    } else if (looksLikeFileName(alt)) {
      findings.push(
        finding(
          source,
          "Uploaded image alt text looks like a file name",
          alt,
          "Uploaded image alt text should describe the image.",
          { imageUrl }
        )
      );
    }
  }

  return findings;
}

function mediaImagesFromProduct(product) {
  return (product.media?.nodes || [])
    .map((node) => node.image)
    .filter(Boolean)
    .map((image) => ({
      url: image.url,
      alt: image.altText,
    }));
}

function renderedImageUrls(html, baseUrl) {
  const urls = new Set();
  const normalizedHtml = stripIgnoredHtml(html);
  const pattern = /<img\b([^>]*)>/gi;
  let match;

  while ((match = pattern.exec(normalizedHtml))) {
    const attrs = parseAttributes(match[1]);

    for (const value of imageSourceValues(attrs)) {
      const imageUrl = normalizeImageUrl(value, baseUrl);

      if (imageUrl) {
        urls.add(imageUrl);
      }
    }
  }

  return urls;
}

function imageSourceValues(attrs) {
  return [attrs.src, attrs["data-src"], attrs.srcset, attrs["data-srcset"]].filter(Boolean);
}

function parseAttributes(attributeString) {
  const attrs = {};
  const pattern = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`=]+)))?/g;
  let match;

  while ((match = pattern.exec(attributeString))) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attrs;
}

function textById(html) {
  const labels = new Map();
  const pattern = /<([a-z][\w:-]*)\b([^>]*\bid\s*=[^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const attrs = parseAttributes(match[2]);

    if (attrs.id) {
      labels.set(attrs.id, normalizeText(textFromHtmlWithAlt(match[3])));
    }
  }

  return labels;
}

function accessibleNameFromLabelledBy(value, labelsById) {
  return normalizeText(
    String(value || "")
      .split(/\s+/)
      .map((id) => labelsById.get(id) || "")
      .join(" ")
  );
}

function accessibleNameFromContent(html) {
  return normalizeText(textFromHtmlWithAlt(html));
}

function textFromHtmlWithAlt(html) {
  return textFromHtml(
    html
      .replace(/<img\b([^>]*)>/gi, (_tag, attrsText) => {
        const attrs = parseAttributes(attrsText);
        return attrs.alt ? ` ${attrs.alt} ` : " ";
      })
      .replace(/<svg\b[\s\S]*?<title\b[^>]*>([\s\S]*?)<\/title>[\s\S]*?<\/svg>/gi, " $1 ")
  );
}

function textFromHtml(html) {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " "));
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeText(value) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForCompare(value) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, " ");
}

function looksLikeFileName(value) {
  const normalized = normalizeText(value).toLowerCase();
  return (
    /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(normalized) ||
    /^img[_-]?\d+/.test(normalized) ||
    /^[a-z0-9_-]+\.(jpe?g|png|webp|gif|svg|avif)$/i.test(normalized) ||
    /^[a-z0-9_-]+(?:final|copy|desktop|mobile|banner|image)[a-z0-9_.-]*$/i.test(normalized)
  );
}

function isDecorativeImage(attrs) {
  const role = normalizeForCompare(attrs.role || "");
  const ariaHidden = normalizeForCompare(attrs["aria-hidden"] || "");

  return role === "presentation" || role === "none" || ariaHidden === "true";
}

function normalizeImageUrl(value, baseUrl) {
  const candidate = firstImageCandidate(value);

  if (!candidate) {
    return "";
  }

  try {
    const url = new URL(candidate, baseUrl);
    url.hash = "";
    url.search = "";
    return `//${url.hostname.toLowerCase()}${normalizeImagePath(url.pathname)}`;
  } catch {
    return normalizeImagePath(candidate.split("?")[0]).replace(/^https?:/, "");
  }
}

function firstImageCandidate(value) {
  const normalized = normalizeText(value);

  if (!normalized || normalized === "unknown image") {
    return "";
  }

  return normalized.split(",")[0].trim().split(/\s+/)[0];
}

function normalizeImagePath(pathname) {
  return safeDecodeURIComponent(pathname)
    .replace(
      /_(?:pico|icon|thumb|small|compact|medium|large|grande|original|master)(?=\.[a-z]+$)/i,
      ""
    )
    .replace(/_\d+x\d*(?:_crop_[a-z]+)?(?=\.[a-z]+$)/i, "");
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function fileNameFromUrl(url) {
  try {
    return path.basename(new URL(url).pathname);
  } catch {
    return url;
  }
}

function tagSnippet(tag) {
  return normalizeText(tag).slice(0, 220);
}

function finding(source, issue, found, reason, details = {}) {
  return {
    sourceType: source.type,
    title: source.title,
    url: source.url,
    updatedAt: source.updatedAt,
    issue,
    found,
    reason,
    ...details,
  };
}

function buildReport({ startedAt, options, sources, standaloneImages, findings, warnings }) {
  const lines = [];
  const groupedFindings = groupFindings(findings);

  lines.push("# Accessibility Content Check Report");
  lines.push("");
  lines.push(`Generated: ${startedAt.toISOString()}`);
  lines.push(`Lookback hours: ${options.lookbackHours}`);
  lines.push(`Rendered sources checked: ${sources.length}`);
  lines.push(`Standalone images checked: ${standaloneImages.length}`);
  lines.push(`Findings: ${findings.length}`);
  lines.push("");

  if (warnings.length) {
    lines.push("## Warnings");
    lines.push("");
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  if (!findings.length) {
    lines.push("## Result");
    lines.push("");
    lines.push("No content accessibility findings were detected in the checked content.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Findings");
  lines.push("");

  for (const [sourceLabel, sourceFindings] of groupedFindings) {
    lines.push(`### ${sourceLabel}`);
    lines.push("");

    for (const item of sourceFindings) {
      lines.push(`- **${item.issue}**`);
      lines.push(`  - Found: \`${markdownInline(item.found)}\``);
      lines.push(`  - Reason: ${item.reason}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

function groupFindings(findings) {
  const grouped = new Map();

  for (const item of findings) {
    const label = `${item.sourceType}: ${item.title || "Untitled"} (${item.url})`;

    if (!grouped.has(label)) {
      grouped.set(label, []);
    }

    grouped.get(label).push(item);
  }

  return grouped;
}

function markdownInline(value) {
  return normalizeText(value).replace(/`/g, "\\`");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
