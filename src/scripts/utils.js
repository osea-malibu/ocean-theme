/**
 * Debounce a function by a delay
 */
export function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Pause all media players
 */
export function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => video.pause());
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

/**
 * Whether a cart line is a gift card.
 *
 * `/cart.js` exposes a native `gift_card` boolean per line. `product_type` is a
 * fallback so the line still classifies correctly if that field is ever absent.
 */
export function isGiftCardLine(item) {
  return item?.gift_card === true || item?.product_type === "Gift Card";
}

/**
 * The cart value that counts toward gift-with-purchase thresholds, in cents.
 *
 * Gift cards are excluded. Their value is deferred revenue — nothing is recognized
 * until the card is redeemed — so counting it awards a gift twice against the same
 * dollar: once when the card is bought, again when the recipient spends it. It also
 * keeps the theme from adding a gift to a gift-card-only cart that the
 * checkout-validation function then refuses at checkout.
 *
 * Derived by subtracting gift-card lines from `total_price` so it keeps whatever
 * discount semantics `total_price` already has.
 *
 * Mirrored by snippets/gwp-eligible-total.liquid — change both together.
 */
export function getGwpEligibleTotal(cartState) {
  const total = cartState?.total_price ?? 0;
  if (!Array.isArray(cartState?.items)) return total;

  const eligible = cartState.items.reduce(
    (runningTotal, item) =>
      isGiftCardLine(item) ? runningTotal - (item.final_line_price ?? 0) : runningTotal,
    total
  );

  return Math.max(0, eligible);
}

/**
 * Returns common POST fetch config
 */
export function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/**
 * Trap focus inside a container element
 */
export function trapFocus(container, elementToFocus = container) {
  const focusableElements = Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  removeTrapFocus(); // reset any existing traps

  const handlers = {
    focusin(event) {
      if (![container, last, first].includes(event.target)) return;
      document.addEventListener("keydown", handlers.keydown);
    },
    focusout() {
      document.removeEventListener("keydown", handlers.keydown);
    },
    keydown(event) {
      if (event.code.toUpperCase() !== "TAB") return;
      if (event.target === last && !event.shiftKey) {
        event.preventDefault();
        first.focus();
      }
      if ((event.target === container || event.target === first) && event.shiftKey) {
        event.preventDefault();
        last.focus();
      }
    },
  };

  // Save reference so we can remove later
  trapFocus.handlers = handlers;

  document.addEventListener("focusin", handlers.focusin);
  document.addEventListener("focusout", handlers.focusout);
  elementToFocus.focus();
}

/**
 * Remove any existing focus trap
 */
export function removeTrapFocus(elementToFocus = null) {
  if (trapFocus.handlers) {
    document.removeEventListener("focusin", trapFocus.handlers.focusin);
    document.removeEventListener("focusout", trapFocus.handlers.focusout);
    document.removeEventListener("keydown", trapFocus.handlers.keydown);
    trapFocus.handlers = null;
  }

  if (elementToFocus) elementToFocus.focus();
}

/**
 * Escape key handler for closing open <details> elements
 */
export function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetails = event.target.closest("details[open]");
  if (!openDetails) return;

  const summary = openDetails.querySelector("summary");
  openDetails.removeAttribute("open");
  summary.setAttribute("aria-expanded", false);
  summary.focus();
}

/**
 * Handle focus for browsers that don't support :focus-visible
 */
export function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", () => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement) currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}
