// <paid-only> — reveals wrapped content only to visitors from paid traffic.
//
// Paid status is detected from UTM params on the landing URL and persisted for
// the session, so gated content keeps showing as the visitor moves between pages
// or refreshes. Content is hidden by default via CSS (`paid-only:not(.is-paid)`)
// and revealed by adding the `is-paid` class — so non-paid visitors never flash
// the gated content before JS runs.
//
// Reuse: wrap any element in `<paid-only class="block"> … </paid-only>` to gate
// it behind paid traffic. This is intentionally generic — the surrounding
// section decides (server-side) whether to render the wrapper at all.

const PAID_SESSION_KEY = "osea.paidSession";

// A visitor is "paid" when the landing URL matches any of these param rules.
const PAID_TRAFFIC_RULES = [
  { param: "utm_medium", value: "affiliate" },
  { param: "utm_medium", value: "cpc" },
  { param: "utm_source", value: "facebook_ad" },
  { param: "utm_source", value: "tiktok_ad" },
];

function matchesPaidUrl() {
  const params = new URLSearchParams(window.location.search);
  return PAID_TRAFFIC_RULES.some((rule) => params.get(rule.param) === rule.value);
}

// Check the current URL first and persist on the first match, then fall back to
// the stored session flag for subsequent pages / refreshes (UTM params only
// exist on the entry URL).
function isPaidVisitor() {
  if (matchesPaidUrl()) {
    try {
      sessionStorage.setItem(PAID_SESSION_KEY, "true");
    } catch (e) {
      // sessionStorage unavailable (private mode, etc.) — degrade to URL-only.
    }
    return true;
  }

  try {
    return sessionStorage.getItem(PAID_SESSION_KEY) === "true";
  } catch (e) {
    return false;
  }
}

class PaidOnly extends HTMLElement {
  connectedCallback() {
    if (isPaidVisitor()) {
      this.classList.add("is-paid");
    }
  }
}

customElements.get("paid-only") || customElements.define("paid-only", PaidOnly);
