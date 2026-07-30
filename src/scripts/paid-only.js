// <paid-only> — reveals wrapped content only to visitors from paid traffic.
//
// Two decoupled parts:
//   1. capturePaidSession() runs on every page (this module is imported by
//      main.js, which loads globally). The first time a visitor lands with a
//      paid UTM param, it persists a session flag and then no-ops for the rest
//      of the session — so a paid visitor can land ANYWHERE and still be
//      recognized once they reach a <paid-only> element (UTM params only exist
//      on the entry URL).
//   2. The <paid-only> element simply reads that flag on connect and reveals
//      itself for paid visitors.
//
// Content is hidden by default via CSS (`paid-only:not(.is-paid)`) and revealed
// by adding `.is-paid` — so non-paid visitors never flash the gated content.
//
// Reuse: wrap any element in `<paid-only class="block"> … </paid-only>`.

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

// Persist the paid flag on first detection, then leave it alone for the rest of
// the session. Runs on every page load; skips once the flag is already set.
function capturePaidSession() {
  try {
    if (sessionStorage.getItem(PAID_SESSION_KEY)) return;
    if (matchesPaidUrl()) {
      sessionStorage.setItem(PAID_SESSION_KEY, "true");
    }
  } catch (e) {
    // sessionStorage unavailable (private mode, etc.) — gate stays hidden.
  }
}

function isPaidSession() {
  try {
    return sessionStorage.getItem(PAID_SESSION_KEY) === "true";
  } catch (e) {
    return false;
  }
}

// Capture before the element upgrades, so the flag is already set when
// connectedCallback reads it — including on a landing page that itself
// contains a <paid-only> element.
capturePaidSession();

class PaidOnly extends HTMLElement {
  connectedCallback() {
    if (isPaidSession()) {
      this.classList.add("is-paid");
    }
  }
}

customElements.get("paid-only") || customElements.define("paid-only", PaidOnly);
