import { debounce, pauseAllMedia, trapFocus, removeTrapFocus } from "./utils.js";
import {
  setupSummaryAriaAttributes,
  setupFocusVisiblePolyfill,
  setupHeaderBorderObserver,
  setupLazyVideos,
  setupManualRedirects,
  setupShopifyCommon,
} from "./setup.js";

setupSummaryAriaAttributes();
setupFocusVisiblePolyfill();
setupHeaderBorderObserver();
setupLazyVideos();
setupManualRedirects();
setupShopifyCommon();

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });

    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  onInputChange(event) {
    const autodeliverOptionEl = document.querySelector('input[value="autodeliver"]');
    const inputValueInteger = parseInt(event.currentTarget.value);
    const plusButtonEl = this.querySelector('button[name="plus"]');

    if (autodeliverOptionEl && autodeliverOptionEl.checked) {
      this.productForm = document.querySelector("product-form.pdp-product-form");
      if (inputValueInteger > 4) {
        this.input.value = 4;
        this.productForm.handleErrorMessage(
          "You may not subscribe to more than 4 of this product."
        );
        setTimeout(() => this.productForm.handleErrorMessage(), 5000);
        plusButtonEl.setAttribute("disabled", "");
      } else if (inputValueInteger == 4) {
        plusButtonEl.setAttribute("disabled", "");
      } else {
        if (plusButtonEl.disabled) {
          plusButtonEl.removeAttribute("disabled");
        }
        this.productForm.handleErrorMessage();
      }
    }
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}
customElements.define("quantity-input", QuantityInput);

class IconMarquee extends HTMLElement {
  constructor() {
    super();

    // Config & state
    this.items = [];
    this.animationID = null;
    this.speed = parseFloat(this.getAttribute("speed")) || 1;
    this._reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this._positionMap = new Map();
    this._observer = null;
    this._isVisible = false;
    this._boundRotate = this.rotate.bind(this);
    this._onVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  // Lifecycle
  connectedCallback() {
    this._originalContent = this.innerHTML;

    if (this._reducedMotion) return;

    this.setup();
    this.observeVisibility();

    // Listen for page/tab visibility changes
    document.addEventListener("visibilitychange", this._onVisibilityChange);

    // Debounced resize
    this._onResize = debounce(() => this.refresh(), 250);
    window.addEventListener("resize", this._onResize);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.animationID);
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    if (this._observer) this._observer.disconnect();
  }

  // Create & position clones
  setup() {
    const tempWrapper = document.createElement("div");
    tempWrapper.className = "inline-block whitespace-nowrap";
    tempWrapper.innerHTML = this._originalContent;

    this.innerHTML = "";
    this.appendChild(tempWrapper);

    const { width, height } = tempWrapper.getBoundingClientRect();
    this._itemWidth = width + 36;
    const containerWidth = this.getBoundingClientRect().width;
    const itemHTML = tempWrapper.innerHTML;

    this.removeChild(tempWrapper);

    this.style.position = "relative";
    this.classList.add("whitespace-nowrap", "overflow-hidden");
    this.items = [];
    this._positionMap.clear();

    const maxItems = Math.ceil(containerWidth / this._itemWidth) + 2;

    for (let i = 0; i < maxItems; i++) {
      const item = document.createElement("div");
      item.innerHTML = itemHTML;
      item.className = "absolute whitespace-nowrap will-change-transform";
      item.setAttribute("aria-hidden", i > 0 ? "true" : "false");

      const initialX = this._itemWidth * i;
      this._positionMap.set(item, initialX);
      item.style.transform = `translateX(${initialX}px)`;
      item.style.width = `${this._itemWidth}px`;
      item.style.height = `${height}px`;

      this.appendChild(item);
      this.items.push(item);
    }

    this.addEventListener("mouseover", this.pause.bind(this));
    this.addEventListener("mouseout", this.resume.bind(this));
  }

  // Detect when the element enters/exits the viewport
  observeVisibility() {
    this._observer = new IntersectionObserver(
      ([entry]) => {
        this._isVisible = entry.isIntersecting;
        this._isVisible ? this.resume() : this.pause();
      },
      { root: null, threshold: 0 }
    );

    this._observer.observe(this);
  }

  // Core animation loop
  rotate() {
    if (!this._isVisible || document.hidden || !this.items.length) return;

    this.items.forEach((item) => {
      let x = this._positionMap.get(item);
      x -= this.speed;

      if (x + this._itemWidth < 0) {
        const maxX = Math.max(...Array.from(this._positionMap.values()));
        x = maxX + this._itemWidth;
      }

      this._positionMap.set(item, x);
      item.style.transform = `translateX(${x}px)`;
    });

    this.animationID = requestAnimationFrame(this._boundRotate);
  }

  // Handle when the tab becomes hidden or visible
  handleVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  pause() {
    cancelAnimationFrame(this.animationID);
    this.animationID = null;
  }

  resume() {
    if (!this._isVisible || document.hidden || this.animationID) return;
    this.rotate();
  }

  // Redraw on resize
  refresh() {
    this.pause();
    this.innerHTML = this._originalContent;
    this.setup();
    this.observeVisibility();
  }
}
customElements.define("icon-marquee", IconMarquee);

class FooterAccordion extends HTMLElement {
  constructor() {
    super();
    this.detailsElements = Array.from(this.querySelectorAll("details"));
    this.mediaQuery = window.matchMedia("(min-width: 640px)"); // Tailwind 'sm'
    this.handleResize = this.handleResize.bind(this);
  }

  connectedCallback() {
    this.handleResize();
    this.mediaQuery.addEventListener("change", this.handleResize);
  }

  disconnectedCallback() {
    this.mediaQuery.removeEventListener("change", this.handleResize);
  }

  handleResize() {
    const isDesktop = this.mediaQuery.matches;

    this.detailsElements.forEach((details) => {
      if (isDesktop) {
        details.setAttribute("open", "");
      } else {
        details.removeAttribute("open");
      }
    });
  }
}
customElements.define("footer-accordion", FooterAccordion);

class ShippingCalculator extends HTMLElement {
  constructor() {
    super();

    this.zipForm = this.querySelector("form");
    this.zipInput = this.querySelector("#shippingzip");
    this.output = this.querySelector("#transitTimeOutput");

    if (this.dataset.collapsed !== "false") this.collapse();

    this.zipForm.addEventListener("submit", (e) => this.onZipSubmit(e));
  }

  // PUBLIC: used by ShippingCountdown
  open() {
    this.zipForm.classList.remove("hidden");
    this.style.removeProperty("--sc-hidden"); // in case you add CSS hooks later
    // focus input (next frame for iOS)
    requestAnimationFrame(() => this.zipInput?.focus());
    // mark as expanded so we don't re-hide on any re-init
    this.dataset.collapsed = "false";
  }

  collapse() {
    this.zipForm.classList.add("hidden");
    this.dataset.collapsed = "true";
  }

  toggle() {
    this.dataset.collapsed === "true" ? this.open() : this.collapse();
  }

  onZipSubmit(e) {
    e.preventDefault();

    const { st, transitTime } = this.getStateData(this.zipInput.value);
    const { transitionStart, transitionEnd } = this.output.dataset;

    this.output.innerHTML = `${st}: ${transitTime}`;
    this.output.classList.remove(...transitionStart.split(" "));
    this.output.classList.add(...transitionEnd.split(" "));
  }

  getStateData(zipString) {
    /* Ensure param is a string to prevent unpredictable parsing results */
    if (typeof zipString !== "string") {
      console.error("Must pass the zipcode as a string.");
      return;
    }

    /* Ensure we have exactly 5 characters to parse */
    if (zipString.length !== 5) {
      console.error("Must pass a 5-digit zipcode.");
      return;
    }

    /* Ensure we don't parse strings starting with 0 as octal values */
    const zipcode = parseInt(zipString, 10);

    let st;
    let state;
    let transitTime;

    /* Code cases alphabetized by state */
    if (zipcode >= 35000 && zipcode <= 36999) {
      st = "AL";
      state = "Alabama";
      transitTime = "5-6 days";
    } else if (zipcode >= 99500 && zipcode <= 99999) {
      st = "AK";
      state = "Alaska";
      transitTime = "5-6 days";
    } else if (zipcode >= 85000 && zipcode <= 86999) {
      st = "AZ";
      state = "Arizona";
      transitTime = "2-3 days";
    } else if (zipcode >= 71600 && zipcode <= 72999) {
      st = "AR";
      state = "Arkansas";
      transitTime = "4-5 days";
    } else if (zipcode >= 90000 && zipcode <= 96699) {
      st = "CA";
      state = "California";
      transitTime = "2-3 days";
    } else if (zipcode >= 80000 && zipcode <= 81999) {
      st = "CO";
      state = "Colorado";
      transitTime = "3-4 days";
    } else if ((zipcode >= 6000 && zipcode <= 6389) || (zipcode >= 6391 && zipcode <= 6999)) {
      st = "CT";
      state = "Connecticut";
      transitTime = "5-6 days";
    } else if (zipcode >= 19700 && zipcode <= 19999) {
      st = "DE";
      state = "Delaware";
      transitTime = "5-6 days";
    } else if (zipcode >= 32000 && zipcode <= 34999) {
      st = "FL";
      state = "Florida";
      transitTime = "5-6 days";
    } else if ((zipcode >= 30000 && zipcode <= 31999) || (zipcode >= 39800 && zipcode <= 39999)) {
      st = "GA";
      state = "Georgia";
      transitTime = "4-5 days";
    } else if (zipcode >= 96700 && zipcode <= 96999) {
      st = "HI";
      state = "Hawaii";
      transitTime = "5-6 days";
    } else if (zipcode >= 83200 && zipcode <= 83999 && zipcode != 83414) {
      st = "ID";
      state = "Idaho";
      transitTime = "3-4 days";
    } else if (zipcode >= 60000 && zipcode <= 62999) {
      st = "IL";
      state = "Illinois";
      transitTime = "5-6 days";
    } else if (zipcode >= 46000 && zipcode <= 47999) {
      st = "IN";
      state = "Indiana";
      transitTime = "5-6 days";
    } else if (zipcode >= 50000 && zipcode <= 52999) {
      st = "IA";
      state = "Iowa";
      transitTime = "4-5 days";
    } else if (zipcode >= 66000 && zipcode <= 67999) {
      st = "KS";
      state = "Kansas";
      transitTime = "4-5 days";
    } else if (zipcode >= 40000 && zipcode <= 42999) {
      st = "KY";
      state = "Kentucky";
      transitTime = "4-5 days";
    } else if (zipcode >= 70000 && zipcode <= 71599) {
      st = "LA";
      state = "Louisiana";
      transitTime = "4-5 days";
    } else if (zipcode >= 3900 && zipcode <= 4999) {
      st = "ME";
      state = "Maine";
      transitTime = "5-6 days";
    } else if (zipcode >= 20600 && zipcode <= 21999) {
      st = "MD";
      state = "Maryland";
      transitTime = "5-6 days";
    } else if ((zipcode >= 1000 && zipcode <= 2799) || zipcode == 5501 || zipcode == 5544) {
      st = "MA";
      state = "Massachusetts";
      transitTime = "5-6 days";
    } else if (zipcode >= 48000 && zipcode <= 49999) {
      st = "MI";
      state = "Michigan";
      transitTime = "4-5 days";
    } else if (zipcode >= 55000 && zipcode <= 56899) {
      st = "MN";
      state = "Minnesota";
      transitTime = "4-5 days";
    } else if (zipcode >= 38600 && zipcode <= 39999) {
      st = "MS";
      state = "Mississippi";
      transitTime = "4-5 days";
    } else if (zipcode >= 63000 && zipcode <= 65999) {
      st = "MO";
      state = "Missouri";
      transitTime = "4-5 days";
    } else if (zipcode >= 59000 && zipcode <= 59999) {
      st = "MT";
      state = "Montana";
      transitTime = "4-5 days";
    } else if (zipcode >= 68000 && zipcode <= 69999) {
      st = "NE";
      state = "Nebraska";
      transitTime = "4-5 days";
    } else if (zipcode >= 88900 && zipcode <= 89999) {
      st = "NV";
      state = "Nevada";
      transitTime = "2-3 days";
    } else if (zipcode >= 3000 && zipcode <= 3899) {
      st = "NH";
      state = "New Hampshire";
      transitTime = "5-6 days";
    } else if (zipcode >= 7000 && zipcode <= 8999) {
      st = "NJ";
      state = "New Jersey";
      transitTime = "5-6 days";
    } else if (zipcode >= 87000 && zipcode <= 88499) {
      st = "NM";
      state = "New Mexico";
      transitTime = "3-4 days";
    } else if (
      (zipcode >= 10000 && zipcode <= 14999) ||
      zipcode == 6390 ||
      zipcode == 501 ||
      zipcode == 544
    ) {
      st = "NY";
      state = "New York";
      transitTime = "5-6 days";
    } else if (zipcode >= 27000 && zipcode <= 28999) {
      st = "NC";
      state = "North Carolina";
      transitTime = "4-5 days";
    } else if (zipcode >= 58000 && zipcode <= 58999) {
      st = "ND";
      state = "North Dakota";
      transitTime = "3-4 days";
    } else if (zipcode >= 43000 && zipcode <= 45999) {
      st = "OH";
      state = "Ohio";
      transitTime = "4-5 days";
    } else if ((zipcode >= 73000 && zipcode <= 73199) || (zipcode >= 73400 && zipcode <= 74999)) {
      st = "OK";
      state = "Oklahoma";
      transitTime = "3-4 days";
    } else if (zipcode >= 97000 && zipcode <= 97999) {
      st = "OR";
      state = "Oregon";
      transitTime = "3-4 days";
    } else if (zipcode >= 15000 && zipcode <= 19699) {
      st = "PA";
      state = "Pennsylvania";
      transitTime = "5-6 days";
    } else if (zipcode >= 300 && zipcode <= 999) {
      st = "PR";
      state = "Puerto Rico";
      transitTime = "5-6 days";
    } else if (zipcode >= 2800 && zipcode <= 2999) {
      st = "RI";
      state = "Rhode Island";
      transitTime = "5-6 days";
    } else if (zipcode >= 29000 && zipcode <= 29999) {
      st = "SC";
      state = "South Carolina";
      transitTime = "4-5 days";
    } else if (zipcode >= 57000 && zipcode <= 57999) {
      st = "SD";
      state = "South Dakota";
      transitTime = "3-4 days";
    } else if (zipcode >= 37000 && zipcode <= 38599) {
      st = "TN";
      state = "Tennessee";
      transitTime = "4-5 days";
    } else if (
      (zipcode >= 75000 && zipcode <= 79999) ||
      (zipcode >= 73301 && zipcode <= 73399) ||
      (zipcode >= 88500 && zipcode <= 88599)
    ) {
      st = "TX";
      state = "Texas";
      transitTime = "3-4 days";
    } else if (zipcode >= 84000 && zipcode <= 84999) {
      st = "UT";
      state = "Utah";
      transitTime = "3-4 days";
    } else if (zipcode >= 5000 && zipcode <= 5999) {
      st = "VT";
      state = "Vermont";
      transitTime = "5-6 days";
    } else if (
      (zipcode >= 20100 && zipcode <= 20199) ||
      (zipcode >= 22000 && zipcode <= 24699) ||
      zipcode == 20598
    ) {
      st = "VA";
      state = "Virginia";
      transitTime = "4-5 days";
    } else if (
      (zipcode >= 20000 && zipcode <= 20099) ||
      (zipcode >= 20200 && zipcode <= 20599) ||
      (zipcode >= 56900 && zipcode <= 56999)
    ) {
      st = "DC";
      state = "Washington DC";
      transitTime = "4-5 days";
    } else if (zipcode >= 98000 && zipcode <= 99499) {
      st = "WA";
      state = "Washington";
      transitTime = "3-4 days";
    } else if (zipcode >= 24700 && zipcode <= 26999) {
      st = "WV";
      state = "West Virginia";
      transitTime = "5-6 days";
    } else if (zipcode >= 53000 && zipcode <= 54999) {
      st = "WI";
      state = "Wisconsin";
      transitTime = "4-5 days";
    } else if ((zipcode >= 82000 && zipcode <= 83199) || zipcode == 83414) {
      st = "WY";
      state = "Wyoming";
      transitTime = "4-5 days";
    } else {
      st = "none";
      state = "none";
      transitTime =
        "Sorry, we could not find that zipcode in our database. Please contact Customer Care for shipping times.";
    }

    return { st, state, transitTime };
  }
}
customElements.define("shipping-calculator", ShippingCalculator);

class ShippingCountdown extends HTMLElement {
  static ensureCartSignalsPatched() {
    if (window.__oseaPatchedCartFetch) return;
    window.__oseaPatchedCartFetch = true;

    const origFetch = window.fetch;
    const CART_URL_RE = /\/cart(\.js|\/(add|update|change|clear)\.js)?(\?.*)?$/;

    // Patch fetch so ANY cart mutation/reads trigger a refresh signal.
    window.fetch = async function patchedFetch(input, init) {
      const res = await origFetch(input, init);
      try {
        const url = typeof input === "string" ? input : input?.url || "";
        const method = (
          init?.method ||
          (typeof input !== "string" ? input?.method : "") ||
          "GET"
        ).toUpperCase();
        // Fire after any successful cart call (read or write); write ops will also hit /cart.js afterwards anyway.
        if (CART_URL_RE.test(url) && res.ok) {
          // Dispatch a consistent, theme-agnostic signal
          const evt = new CustomEvent("cart:refresh", { bubbles: true });
          window.dispatchEvent(evt);
          document.dispatchEvent(evt);
          // also alias to common names used by various themes
          window.dispatchEvent(new CustomEvent("cart:updated", { bubbles: true }));
          document.dispatchEvent(new CustomEvent("cart:updated", { bubbles: true }));
        }
      } catch (_) {}
      return res;
    };

    // Cross-tab signals (nice to have)
    try {
      window.__oseaCartBC = new BroadcastChannel("osea:cart");
      window.__oseaCartBC.onmessage = (m) => {
        if (m?.type === "cart:refresh") {
          const evt = new CustomEvent("cart:refresh", { bubbles: true });
          window.dispatchEvent(evt);
          document.dispatchEvent(evt);
        }
      };
    } catch (_) {}

    // If any script touches localStorage key, piggyback as a signal
    const _setItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      _setItem(k, v);
      if (k === "osea.cart.bump") {
        const evt = new CustomEvent("cart:refresh", { bubbles: true });
        window.dispatchEvent(evt);
        document.dispatchEvent(evt);
      }
    };
  }

  constructor() {
    super();
    this.textEl = this.querySelector(".shipping-countdown-text");
    this.thresholdDollars = Number(this.getAttribute("threshold") || 0);
    this.thresholdCents = Math.max(0, Math.round(this.thresholdDollars * 100));

    // Debounce to collapse bursts of events
    this._refreshDebounced = ((fn) => {
      let t;
      return () => {
        clearTimeout(t);
        t = setTimeout(fn, 120);
      };
    })(() => this.refresh());
    this.refresh = this.refresh.bind(this);

    // Coalesce in-flight cart requests
    this._cartInflight = null;
    this._lastCartJson = null;

    // One-time global patch
    ShippingCountdown.ensureCartSignalsPatched();
  }

  connectedCallback() {
    // Initial paint
    this.refresh();

    // inside ShippingCountdown.connectedCallback()
    const link = this.querySelector(".calc-link");
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault(); // prevent hash-jump but keep a11y-safe href
        const sel = this.dataset.calculator || `#${link.getAttribute("aria-controls")}`;
        const calc = document.querySelector(sel);
        if (!calc) return;
        if (calc.toggle) calc.toggle();
        else if (calc.open) calc.open();
      });
    }

    // 1) Listen to common cart events (your original list)
    [
      "cart:updated",
      "cart:update",
      "cart:change",
      "cart:refresh",
      "lineItem:added",
      "lineItem:removed",
    ].forEach((name) => {
      window.addEventListener(name, this._refreshDebounced, { passive: true });
      document.addEventListener(name, this._refreshDebounced, { passive: true });
    });

    // 2) Listen to cart-drawer specific events if your drawer dispatches them
    const cartDrawer = document.querySelector("cart-drawer");
    if (cartDrawer) {
      ["cart:updated", "cart:change", "updated", "change"].forEach((name) =>
        cartDrawer.addEventListener(name, this._refreshDebounced, { passive: true })
      );
    }

    // 3) Section re-renders often imply cart UI changed
    document.addEventListener("shopify:section:load", this._refreshDebounced, { passive: true });

    // 4) BroadcastChannel echo (from patched fetch)
    if (window.__oseaCartBC) {
      this._bcHandler = (m) => m?.type === "cart:refresh" && this._refreshDebounced();
      window.__oseaCartBC.addEventListener?.("message", this._bcHandler);
    }
  }

  disconnectedCallback() {
    [
      "cart:updated",
      "cart:update",
      "cart:change",
      "cart:refresh",
      "lineItem:added",
      "lineItem:removed",
    ].forEach((name) => {
      window.removeEventListener(name, this._refreshDebounced);
      document.removeEventListener(name, this._refreshDebounced);
    });

    const cartDrawer = document.querySelector("cart-drawer");
    if (cartDrawer) {
      ["cart:updated", "cart:change", "updated", "change"].forEach((name) =>
        cartDrawer.removeEventListener(name, this._refreshDebounced)
      );
    }

    document.removeEventListener("shopify:section:load", this._refreshDebounced);

    if (window.__oseaCartBC && this._bcHandler) {
      window.__oseaCartBC.removeEventListener?.("message", this._bcHandler);
    }
  }

  async getCartJson() {
    // Coalesce concurrent requests
    if (this._cartInflight) return this._cartInflight;

    this._cartInflight = (async () => {
      const res = await fetch("/cart.js", { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error("Cart fetch failed");
      const json = await res.json();
      this._lastCartJson = json;
      // Tell other tabs
      try {
        window.__oseaCartBC?.postMessage?.({ type: "cart:refresh" });
      } catch (_) {}
      return json;
    })().finally(() => (this._cartInflight = null));

    return this._cartInflight;
  }

  async refresh() {
    // If no threshold, it's always free shipping
    if (this.thresholdCents <= 0) {
      this.setText(`You get free shipping!`);
      return;
    }

    let cart;
    try {
      cart = await this.getCartJson();
    } catch (e) {
      // Fallback to default message on error
      this.setText(`Free Shipping on Orders ${this.formatMoney(this.thresholdCents)}+`);
      return;
    }

    const total = Number(cart.total_price || 0); // cents
    const itemCount = Number(cart.item_count || 0);

    if (itemCount === 0) {
      this.setText(`Free Shipping on Orders ${this.formatMoney(this.thresholdCents)}+`);
      return;
    }

    if (total >= this.thresholdCents) {
      this.setText(`You get free shipping!`);
      return;
    }

    const remaining = this.thresholdCents - total;
    this.setText(`Add ${this.formatMoney(remaining)} to bag for free shipping`);
  }

  setText(str) {
    if (this.textEl) {
      this.textEl.textContent = str;
    } else {
      this.textContent = str;
    }
  }

  formatMoney(cents) {
    if (window.Shopify && typeof Shopify.formatMoney === "function") {
      const fmt =
        window.theme?.moneyFormat ||
        window.moneyFormat ||
        (window.Shopify.currency?.active === "JPY" ? "${{amount_no_decimals}}" : "${{amount}}");

      return Shopify.formatMoney(Math.round(cents), fmt).replace(/(\.00)(?!\d)/, "");
    }

    const currency = window.Shopify?.currency?.active || "USD";
    const value = cents / 100;
    const withCents = value.toLocaleString(undefined, { style: "currency", currency });
    return Number.isInteger(value) ? withCents.replace(/(\.00)(?!\d)/, "") : withCents;
  }
}
customElements.define("shipping-countdown", ShippingCountdown);

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    if (navigator.platform === "iPhone")
      document.documentElement.style.setProperty("--viewport-height", `${window.innerHeight}px`);

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelector(".menu-scrim").addEventListener("click", this.onSummaryClick.bind(this));
    this.querySelectorAll(".submenu-close").forEach((button) =>
      button.addEventListener("click", this.onCloseSubmenu.bind(this))
    );
    this.querySelectorAll("a, summary").forEach((navLink) =>
      navLink.addEventListener("click", this.onNavLinkClick.bind(this))
    );

    const closeButton = this.querySelector(".menu-close");
    closeButton && closeButton.addEventListener("click", this.closeMenuDrawer.bind(this));
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector("summary"))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector("button"));
      summaryElement.nextElementSibling.removeEventListener("transitionend", addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        summaryElement.setAttribute("aria-expanded", true);
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener("transitionend", addTrapFocus);
      }, 100);
    }
  }

  onNavLinkClick(event) {
    console.log("clicked nav link", event);
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add("overflow-hidden");
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove("menu-opening");
      this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
        details.removeAttribute("open");
        details.classList.remove("menu-opening");
      });
      document.body.classList.remove("overflow-hidden");
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseSubmenu(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove("menu-opening");
    detailsElement.querySelector("summary").setAttribute("aria-expanded", false);
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }

  setMenuTopValue() {
    const drawer = this.querySelector(".menu-drawer");
    const scrim = this.querySelector(".menu-scrim");

    const announcementBar = document.querySelector("#AnnouncementBar");
    const header = document.querySelector("header.header");

    const topValue = announcementBar.offsetHeight + header.offsetHeight;

    drawer.style.top = `${topValue}px`;
    scrim.style.top = `${topValue}px`;
  }
}
customElements.define("menu-drawer", MenuDrawer);

class DismissableAnnoucement extends HTMLElement {
  constructor() {
    super();

    this.dismissableMessage = this.querySelector("#DismissableMessage");
    this.defaultMessage = this.querySelector("#DismissableDefault");
    this.closeButton = this.querySelector("#DismissableClose");

    this.closeButton.addEventListener("click", this.onClose.bind(this));
  }

  connectedCallback() {
    let isDismissed = JSON.parse(sessionStorage.getItem("osea.announcementDismissed"));
    if (isDismissed) {
      this.useDefaultMessage();
    } else {
      const menuDrawer = document.querySelector("menu-drawer");
      menuDrawer.setMenuTopValue();
    }
  }

  onClose() {
    const drawer = document.querySelector("#HamburgerMenu .menu-drawer");
    const scrim = document.querySelector("#HamburgerMenu .menu-scrim");

    drawer.style.removeProperty("top");
    scrim.style.removeProperty("top");

    this.useDefaultMessage();
    sessionStorage.setItem("osea.announcementDismissed", true);
  }

  useDefaultMessage() {
    this.dismissableMessage.classList.add("hidden");
    this.closeButton.classList.add("hidden");
    this.defaultMessage.classList.remove("hidden");
  }
}
customElements.define("dismissable-announcement", DismissableAnnoucement);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener("click", this.hide.bind(this));
    this.querySelectorAll(".close-modal").forEach((i) =>
      i.addEventListener("click", this.hide.bind(this))
    );
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (event.pointerType === "mouse" && !event.target.closest("deferred-media, product-model"))
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target.nodeName === "MODAL-DIALOG") this.hide();
      });
    }
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    pauseAllMedia();
  }

  hide() {
    document.body.classList.remove("overflow-hidden");
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button") || this.querySelector('[type="button"]');

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) modal.show(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent() {
    pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(this.querySelector("template").content.firstElementChild.cloneNode(true));

      this.setAttribute("loaded", true);
      this.appendChild(content).focus();
    }
  }
}
customElements.define("deferred-media", DeferredMedia);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", () => {
      this.onVariantChange();
    });
    this.addEventListener("click", () => {});
  }

  connectedCallback() {
    const executeMethods = () => {
      this.updateOptions();
      this.updateMasterId();
      this.updateMedia();
      this.handleKlaviyoBisTrigger();
    };
    document.addEventListener("DOMContentLoaded", executeMethods);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateIsSubscription();
    this.toggleAddButton(true, "", false);
    this.removeErrorMessage();
    this.resetPurchaseOption();

    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateOptionVisibility();
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll("select"), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateIsSubscription() {
    const isSubscriptionInput = document.querySelector(
      'input[name="properties[_is_subscription]"]'
    );

    if (this.currentVariant) {
      if (this.currentVariant.selling_plan_allocations.length > 0) {
        isSubscriptionInput.value = true;
      } else {
        isSubscriptionInput.value = false;
      }
    }
  }

  resetPurchaseOption() {
    // reset purchase option to one-time
    if (
      window.location.pathname.includes("/products/") &&
      document.querySelector("subscription-radios")
    ) {
      document.querySelector(".purchase-option.onetime").classList.add("bg-wave-200");
      document.querySelector('input[value="onetime"]').checked = true;
      document.querySelector(".purchase-option.autodeliver").classList.remove("bg-wave-200");
      document.querySelector('input[value="autodeliver"]').checked = false;
    }
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const isMainPdp = this.dataset.isMainPdp === "true";
    if (isMainPdp) {
      // change first image in product page image gallery
      const variantImageEl = document.querySelector("#Product-VariantImage");
      const newImageSrc = this.currentVariant.featured_image.src;
      if (variantImageEl) {
        variantImageEl.srcset = `${newImageSrc}&width=800 1x, ${newImageSrc}&width=1600 2x`;
        variantImageEl.src = newImageSrc;
      }
      // change thumbanil image in product page gallery thumb navigator
      const thumbImageEl = document.querySelector("#Product-ThumbImage");
      const newThumbImageSrc = this.currentVariant.featured_image.src;
      if (thumbImageEl) {
        thumbImageEl.srcset = `${newThumbImageSrc}&width=192 1x, ${newThumbImageSrc}&width=252 2x`;
        thumbImageEl.src = newThumbImageSrc;
      }
    } else {
      // change image in product card
      const imageElement = document.getElementById(
        `ProductCard-DefaultImage-${this.dataset.section}`
      );
      const newImageSrc = this.currentVariant.featured_media.preview_image.src;

      if (imageElement) {
        imageElement.srcset = `${newImageSrc}&width=328 1x, ${newImageSrc}&width=656 2x`;
        imageElement.src = newImageSrc;
      }
    }
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState({}, "", `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  removeErrorMessage() {
    const section = this.closest("section");
    if (!section) return;

    const productForm = section.querySelector("product-form");
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    const { id } = this.currentVariant;
    fetch(`${this.dataset.url}?variant=${id}`)
      .then((response) => response.text())
      .then((responseText) => {
        const responseHTML = new DOMParser().parseFromString(responseText, "text/html");

        const replaceContent = (selector, sourceSelector) => {
          const source = responseHTML.querySelector(sourceSelector || selector);
          const destination = document.querySelector(selector);
          if (source && destination) destination.innerHTML = source.innerHTML;
        };
        replaceContent(".product .main-price");
        replaceContent(".subscription .onetime .price");
        replaceContent(".subscription .autodeliver .price");
        replaceContent(".product .benefits");
        replaceContent(
          `[value="${id}"]:not(.mini-card-id-input) ~ button[name="add"] .price`,
          ".product .main-price"
        );
        replaceContent(".subscription .selling-plan-options");

        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  updateOptionVisibility() {
    if (this.currentVariant && window.location.pathname.includes("/products/")) {
      const subscriptionRadios = document.querySelector("subscription-radios");
      if (subscriptionRadios) {
        const allcoationGroupIds = this.currentVariant.selling_plan_allocations.map(
          (i) => i.selling_plan_group_id
        );
        const hasSubscriptionOption =
          this.currentVariant.selling_plan_allocations.length > 0 &&
          allcoationGroupIds.includes(subscriptionRadios.dataset.subscriptionGroupId);
        if (hasSubscriptionOption) {
          subscriptionRadios.classList.add("max-h-52");
          subscriptionRadios.classList.remove("max-h-0");
        } else {
          subscriptionRadios.classList.add("max-h-0");
          subscriptionRadios.classList.remove("max-h-52");
        }
      }

      const scentValues = ["Fragrance free", "Scented"];
      const hasScentVariant = this.currentVariant.options.some((r) => scentValues.indexOf(r) >= 0);
      if (hasScentVariant) {
        const scentRadios = document.getElementsByName("Scent");
        const sizeRadios = document.getElementsByName("Size");
        const originalScentInfo = document.querySelectorAll(".scent-scented");
        const fragranceFreeScentInfo = document.querySelectorAll(".scent-fragrance-free");

        originalScentInfo.forEach((i) => {
          i.classList.toggle("hidden", scentRadios[1].checked);
        });
        fragranceFreeScentInfo.forEach((i) => {
          i.classList.toggle("hidden", scentRadios[0].checked);
        });

        var selectedSize = this.currentVariant.option2;
        var selectedScent = this.currentVariant.option1;

        // Enable all options initially
        sizeRadios.forEach((radio) => (radio.disabled = false));
        scentRadios.forEach((radio) => (radio.disabled = false));

        // Disable options based on selected values
        if (selectedSize === "1 fl oz") {
          // Disable Fragrance free when 1 fl oz is selected
          scentRadios.forEach((radio) => {
            if (radio.value === "Fragrance free") {
              radio.disabled = true;
            }
          });
        }

        if (selectedScent === "Fragrance free") {
          // Disable 1 fl oz when Fragrance free is selected
          sizeRadios.forEach((radio) => {
            if (radio.value === "1 fl oz") {
              radio.disabled = true;
            }
          });
        }
      }

      const miniSizeArray = this.dataset.miniSizes.split(",");
      const normalizedVariantTitle = this.currentVariant.title.replace("fl oz", "oz");
      const isMiniSize = miniSizeArray.includes(normalizedVariantTitle);
      const miniInfo = document.querySelectorAll(".size-mini");
      miniInfo.forEach((i) => {
        i.classList.toggle("hidden", !isMiniSize);
      });
    }
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > .label');
    const bisTrigger = document.querySelector(".klaviyo-bis-trigger");

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute("disabled", "disabled");
      if (text) addButtonText.textContent = text;

      if (bisTrigger) {
        addButton.classList.add("mb-[50px]");
        bisTrigger.classList.add("block");
        bisTrigger.classList.remove("hidden");
      }
    } else {
      addButton.removeAttribute("disabled");
      if (text) addButtonText.textContent = window.variantStrings.addToCart;
      if (bisTrigger) {
        addButton.classList.remove("mb-[50px]");
        bisTrigger.classList.add("hidden");
        bisTrigger.classList.remove("block");
      }
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("invisible");
  }

  handleKlaviyoBisTrigger() {
    /* This function corrects behavior of Klaviyo BIS when non-default variant is OOS */
    const variantData = this.getVariantData();
    const availableVariants = variantData.map((variant) => variant.available);

    const hasOutOfStockVariant = availableVariants.includes(false);
    if (!hasOutOfStockVariant) return; // All variants in stock, no need to run function

    /* limit the number of retries to prevent infinite loop */
    const maxRetries = 20; // 20 retries at 200ms each = 4 seconds
    let attempts = 0;

    const checkForBisTrigger = () => {
      const bisTrigger = document.querySelector(".klaviyo-bis-trigger");

      /* check if klaviyo BIS trigger is injected into the DOM */
      if (bisTrigger) {
        /* if the default variant is in stock, hide the BIS trigger */
        if (this.currentVariant.available) {
          bisTrigger.classList.add("hidden");
        }
      } else if (attempts < maxRetries) {
        attempts++;
        setTimeout(checkForBisTrigger, 200); // retry in 200ms
      } else {
        console.warn("BIS trigger not found after max retries");
      }
    };

    checkForBisTrigger();
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"].variant-data').textContent);
    return this.variantData;
  }
}
customElements.define("variant-selects", VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll("input")).find((radio) => radio.checked).value;
    });
  }
}
customElements.define("variant-radios", VariantRadios);

class SubscriptionRadios extends HTMLElement {
  constructor() {
    super();

    this.isSubscriptionInput = document.querySelector('input[name="properties[_is_subscription]"]');
    this.purchaseOptionInputs = Array.from(this.querySelectorAll('input[name="purchase_option"]'));

    const urlParams = new URLSearchParams(window.location.search);
    const urlPurchaseType = urlParams.get("type");

    this.purchaseOptionInputs.forEach((input) => {
      const isSubscription =
        urlPurchaseType === "subscription" || document.referrer.includes("/pages/subscribe");
      if (isSubscription && input.value === "autodeliver") {
        input.checked = true;
        this.setActiveState();
        this.updateMainPrice(input);
        this.setDefaultSellingPlan();

        const isSubscriptionInput = document.querySelector(
          'input[name="properties[_is_subscription]"]'
        );
        isSubscriptionInput.value = true;

        document.querySelector("#PayInstallments")?.classList.add("opacity-0");
      }
      input.addEventListener("change", this.onPurchaseOptionChange.bind(this));
    });
  }

  onPurchaseOptionChange(e) {
    const { value, checked } = e.currentTarget;

    if (checked) {
      this.setActiveState();
      this.updateMainPrice(e.currentTarget);

      const plusButtonEl = document.querySelector('.pdp-quantity button[name="plus"]');

      if (value === "onetime") {
        this.clearSellingPlanValues();
        this.isSubscriptionInput.value = false;
        this.productForm = document.querySelector("product-form.pdp-product-form");

        document.querySelector("#PayInstallments")?.classList.remove("opacity-0");

        if (plusButtonEl && plusButtonEl.disabled) plusButtonEl.removeAttribute("disabled");
        this.productForm.handleErrorMessage();
      } else if (value === "autodeliver") {
        this.setDefaultSellingPlan();
        this.isSubscriptionInput.value = true;

        document.querySelector("#PayInstallments")?.classList.add("opacity-0");

        const inputEl = document.querySelector(".pdp-quantity input");
        if (inputEl) {
          const inputValueInteger = parseInt(inputEl.value);

          if (inputValueInteger > 4) {
            inputEl.value = 4;
            plusButtonEl.setAttribute("disabled", "");
          } else if (inputValueInteger == 4) {
            plusButtonEl.setAttribute("disabled", "");
          }
        }
      }
    }
  }

  setActiveState() {
    this.purchaseOptionInputs?.forEach((input) => {
      input
        .closest(".purchase-option")
        .classList.toggle(this.dataset.selectedColor || "bg-wave-200", input.checked);
      input.closest(".purchase-option").classList.toggle("bg-white", !input.checked);
    });
  }

  updateMainPrice(currentTarget) {
    const currentPrice = currentTarget.closest(".purchase-option").querySelector(".price");
    const mainPrice = document.querySelector(".main-price.price");

    mainPrice.innerHTML = currentPrice.innerHTML;
  }

  clearSellingPlanValues() {
    Array.from(this.querySelectorAll('input[name="selling_plan"]'))?.forEach(
      (input) => (input.checked = false)
    );
  }

  setDefaultSellingPlan() {
    const defaultSellingPlanInt = this.dataset.recommendedInterval || 2;
    const defaultSellingPlanInput = Array.from(this.querySelectorAll('input[name="selling_plan"]'))[
      defaultSellingPlanInt - 1
    ];

    defaultSellingPlanInput.checked = true;
  }
}
customElements.define("subscription-radios", SubscriptionRadios);

class ProductStickyAtc extends HTMLElement {
  connectedCallback() {
    this.stickySlot = this.querySelector("[data-oos-sticky-slot]");
    this.observeAtc();

    // 🔑 IMPORTANT: sync check first
    if (this.tryInitOosHandling()) return;

    // fallback: watch for late mounts
    this.waitForOosActions();
  }

  disconnectedCallback() {
    this.atcObserver?.disconnect();
    this.psObserver?.disconnect();
    this.oosObserver?.disconnect();
  }

  /* --------------------------------------------
   * Sticky visibility (always needed)
   * ------------------------------------------ */

  observeAtc() {
    const trigger = document.querySelector(".product-form.pdp-product-form");
    if (!trigger) return;

    this.atcObserver = new IntersectionObserver(([entry]) => {
      const root = document.documentElement;
      const showSticky = entry.intersectionRatio <= 0;

      if (showSticky) {
        root.style.setProperty("--sticky-atc-height", `${this.offsetHeight}px`);
        this.classList.remove("invisible", "opacity-0");
      } else {
        root.style.setProperty("--sticky-atc-height", "0px");
        this.classList.add("invisible", "opacity-0");
      }

      this.sync?.(showSticky);
    });

    this.atcObserver.observe(trigger);
  }

  /* --------------------------------------------
   * OOS + third-party handling (conditional)
   * ------------------------------------------ */
  tryInitOosHandling() {
    const oos = document.querySelector("[data-oos-actions]");
    const ps = document.getElementById("ps__bis_container_root");

    if (!oos && !ps) return false;

    this.initOosHandling();
    return true;
  }

  waitForOosActions() {
    this.oosObserver = new MutationObserver(() => {
      if (this.tryInitOosHandling()) {
        this.oosObserver.disconnect();
      }
    });

    this.oosObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  initOosHandling() {
    this.oosActions = document.querySelector("[data-oos-actions]");
    if (!this.oosActions || !this.stickySlot) return;

    this.oosHomeParent = this.oosActions.parentElement;
    this.oosHomeMarker = document.createComment("oos-home");
    this.oosHomeParent.insertBefore(this.oosHomeMarker, this.oosActions);

    this.observePostscript();
    this.sync = this.syncOosAndIntegrations.bind(this);

    // Initial sync
    this.sync(this.isVisible());
  }

  observePostscript() {
    this.psObserver = new MutationObserver(() => {
      const root = document.getElementById("ps__bis_container_root");
      if (!root) return;

      this.psRoot = root;
      this.psHomeParent = root.parentElement;
      this.psHomeMarker = document.createComment("ps-home");
      this.psHomeParent.insertBefore(this.psHomeMarker, root);

      this.sync(this.isVisible());
      this.psObserver.disconnect();
    });

    this.psObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /* --------------------------------------------
   * Sync logic
   * ------------------------------------------ */

  isVisible() {
    return !this.classList.contains("invisible");
  }

  syncOosAndIntegrations(showSticky) {
    if (this.oosActions) {
      if (showSticky) {
        this.stickySlot.appendChild(this.oosActions);
      } else {
        this.oosHomeParent.insertBefore(this.oosActions, this.oosHomeMarker.nextSibling);
      }
    }

    if (this.psRoot) {
      if (showSticky) {
        this.stickySlot.appendChild(this.psRoot);
      } else {
        this.psHomeParent.insertBefore(this.psRoot, this.psHomeMarker.nextSibling);
      }
    }
  }
}
customElements.define("product-sticky-atc", ProductStickyAtc);

class TabController extends HTMLElement {
  constructor() {
    super();
    this.tablist = this.querySelector("[role=tablist]");
    this.tabs = this.querySelectorAll("[role=tab]");
    this.tabpanels = this.querySelectorAll("[role=tabpanel]");
    this.activeTab = this.querySelector("[role=tab][aria-selected=true]");

    this.addEventListeners();
    this.checkUrlParameters();
  }

  // Private function to set event listeners
  addEventListeners() {
    for (let tab of this.tabs) {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        this.setActiveTab(tab.getAttribute("aria-controls"));
      });
      tab.addEventListener("keyup", (e) => {
        if (e.keyCode == 13 || e.keyCode == 32) {
          // return or space
          e.preventDefault();
          this.setActiveTab(tab.getAttribute("aria-controls"));
        }
      });
    }
    this.tablist.addEventListener("keyup", (e) => {
      switch (e.keyCode) {
        case 35: // end key
          e.preventDefault();
          this.setActiveTab(this.tabs[this.tabs.length - 1].getAttribute("aria-controls"));
          break;
        case 36: // home key
          e.preventDefault();
          this.setActiveTab(this.tabs[0].getAttribute("aria-controls"));
          break;
        case 37: // left arrow
        case 38: // up arrow
          e.preventDefault();
          let previous = [...this.tabs].indexOf(this.activeTab) - 1;
          previous = previous >= 0 ? previous : this.tabs.length - 1;
          this.setActiveTab(this.tabs[previous].getAttribute("aria-controls"));
          break;
        case 39: // right arrow
        case 40: // right arrow
          e.preventDefault();
          let next = [...this.tabs].indexOf(this.activeTab) + 1;
          next = next < this.tabs.length ? next : 0;
          this.setActiveTab(this.tabs[next].getAttribute("aria-controls"));
          break;
      }
    });
  }

  // Public function to set the tab by id
  // This can be called by the developer too.
  setActiveTab(id, skipFocus = false) {
    const activeTabClass = this.dataset.activeClass?.split(" ") || ["bg-wave-200"];
    for (let tab of this.tabs) {
      if (tab.getAttribute("aria-controls") == id) {
        tab.setAttribute("aria-selected", "true");
        activeTabClass.forEach((i) => tab.classList.add(i));
        !skipFocus && tab.focus();
        this.activeTab = tab;
      } else {
        tab.setAttribute("aria-selected", "false");
        activeTabClass.forEach((i) => tab.classList.remove(i));
      }
    }
    for (let tabpanel of this.tabpanels) {
      if (tabpanel.getAttribute("id") == id) {
        if (tabpanel.getAttribute("aria-expanded") === "true") {
          !skipFocus && tabpanel.focus();
        } else {
          tabpanel.setAttribute("aria-expanded", "true");
        }
      } else {
        tabpanel.setAttribute("aria-expanded", "false");
      }
    }
  }

  checkUrlParameters() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let { tab, question } = params;

    if (tab) {
      this.setActiveTab(`tab-${tab}`, true);

      if (question) {
        const questionEl = this.querySelector(
          `#tab-${tab} ul.accordion li:nth-child(${question}) details`
        );

        if (questionEl) {
          questionEl.setAttribute("open", "");
          setTimeout(() => questionEl.scrollIntoView({ block: "start" }), 1000);
        }
      }
    }
  }
}
customElements.define("tab-controller", TabController);

class HorizontalScrollBox extends HTMLElement {
  constructor() {
    super();
    this.scrollBox = this.querySelector(".scroll-box");
    this.navNext = this.querySelector("nav .next");
    this.navPrev = this.querySelector("nav .prev");
    // Prefer explicit snap children; fall back to all direct children
    this.items = Array.from(this.scrollBox.querySelectorAll(".snap-start"));
    if (this.items.length === 0) {
      this.items = Array.from(this.scrollBox.children);
    }

    // Bind once
    this.handleShowNav = this.handleShowNav.bind(this);

    this.addEventListeners();
    this.handleShowNav();
  }

  addEventListeners() {
    if (!this.scrollBox) return;
    // Only wire buttons if there is overflow and at least 2 items
    if (
      this.scrollBox.getBoundingClientRect().width < this.scrollBox.scrollWidth &&
      this.items.length > 1
    ) {
      this.navNext?.addEventListener("click", () => this.scrollToSnap("next"));
      this.navPrev?.addEventListener("click", () => this.scrollToSnap("prev"));

      this.scrollBox.addEventListener("scroll", this.handleShowNav);
      // Re-measure after resizes/content changes
      window.addEventListener("resize", this.handleShowNav);
    }
  }

  // Read logical padding used by scroll snapping (if any)
  get scrollPadStart() {
    const cs = getComputedStyle(this.scrollBox);
    // `scroll-padding-inline-start` preferred, fallback to left
    const v = cs.scrollPaddingInlineStart || cs.scrollPaddingLeft || "0";
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  // Index of the item currently aligned at/just before the left edge
  getCurrentIndex() {
    const left = this.scrollBox.scrollLeft + this.scrollPadStart;
    let idx = 0;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].offsetLeft <= left + 1) idx = i;
      else break;
    }
    return idx;
  }

  scrollToIndex(i) {
    i = Math.max(0, Math.min(this.items.length - 1, i));
    const targetLeft = this.items[i].offsetLeft - this.scrollPadStart;
    this.scrollBox.scrollTo({ left: targetLeft, behavior: "smooth" });
  }

  scrollToSnap(direction) {
    const cur = this.getCurrentIndex();
    const next = direction === "next" ? cur + 1 : cur - 1;
    this.scrollToIndex(next);
  }

  handleShowNav() {
    const epsilon = 1; // account for sub-pixel rounding
    const atStart = this.scrollBox.scrollLeft <= epsilon;
    const atEnd =
      this.scrollBox.scrollLeft >=
      this.scrollBox.scrollWidth - this.scrollBox.getBoundingClientRect().width - epsilon;

    this.navPrev?.classList.toggle("nav-hide", atStart);
    this.navNext?.classList.toggle("nav-hide", atEnd);
  }
}
customElements.define("horizontal-scroll-box", HorizontalScrollBox);

class ExpandableSection extends HTMLElement {
  static get observedAttributes() {
    return ["data-collapsed-height", "data-collapsed-lines"];
  }

  constructor() {
    super();
    this.content = this.querySelector("[data-content]");
    this.btnMore = this.querySelector("[data-expand]");
    this.btnLess = this.querySelector("[data-collapse]");
    this.open = false;

    // Fallbacks
    if (!this.content) {
      // Create a content wrapper if none provided
      const wrap = document.createElement("div");
      wrap.setAttribute("data-content", "");
      wrap.className = "leading-6";
      while (this.firstChild) wrap.appendChild(this.firstChild);
      this.appendChild(wrap);
      this.content = wrap;
    }
    if (!this.btnMore) {
      this.btnMore = document.createElement("button");
      this.btnMore.type = "button";
      this.btnMore.dataset.expand = "";
      this.btnMore.className = "text-xs link mt-1 block";
      this.btnMore.textContent = "Read more";
      this.appendChild(this.btnMore);
    }
    if (!this.btnLess) {
      this.btnLess = document.createElement("button");
      this.btnLess.type = "button";
      this.btnLess.dataset.collapse = "";
      this.btnLess.className = "text-xs link mt-1 hidden";
      this.btnLess.textContent = "Read less";
      this.appendChild(this.btnLess);
    }

    // Inline transition is reliable regardless of Tailwind plugins
    const ms = this.transitionMs;
    this.content.style.transition = `max-height ${ms}ms ease`;
    this.content.style.overflow = "hidden";

    // Bindings
    this.handleAssess = this.assess.bind(this);
    this.handleOpen = this.expand.bind(this);
    this.handleClose = this.collapse.bind(this);

    // Observers for dynamic content/resize
    this.ro = new ResizeObserver(this.handleAssess);
    this.mo = new MutationObserver(this.handleAssess);
  }

  connectedCallback() {
    // a11y
    if (!this.content.id) this.content.id = `exp-${Math.random().toString(36).slice(2)}`;
    this.btnMore.setAttribute("aria-controls", this.content.id);
    this.btnLess.setAttribute("aria-controls", this.content.id);
    this.btnMore.setAttribute("aria-expanded", "false");
    this.btnLess.setAttribute("aria-expanded", "false");
    this.content.setAttribute("role", "region");
    this.content.setAttribute("aria-hidden", "true");

    // Events
    this.btnMore.addEventListener("click", this.handleOpen);
    this.btnLess.addEventListener("click", this.handleClose);
    window.addEventListener("resize", this.handleAssess);

    // Observe layout & DOM changes
    this.ro.observe(this.content);
    this.mo.observe(this.content, { childList: true, subtree: true, characterData: true });

    // Initial state
    this.collapse({ silent: true });

    // Re-assess after images/fonts load
    if (document.readyState === "complete") {
      this.assess();
    } else {
      window.addEventListener("load", this.handleAssess, { once: true });
    }
  }

  disconnectedCallback() {
    this.btnMore.removeEventListener("click", this.handleOpen);
    this.btnLess.removeEventListener("click", this.handleClose);
    window.removeEventListener("resize", this.handleAssess);
    this.ro.disconnect();
    this.mo.disconnect();
  }

  attributeChangedCallback() {
    // Recompute height constraints if attributes change
    if (!this.open) this.applyCollapsedHeight();
    this.assess();
  }

  get transitionMs() {
    const n = parseInt(this.dataset.transitionMs || "400", 10);
    return isNaN(n) ? 400 : n;
  }

  get collapsedHeightPx() {
    // Priority: lines → height px → default 40px
    const lines = parseInt(this.dataset.collapsedLines || "", 10);
    if (!isNaN(lines)) {
      const lh = parseFloat(getComputedStyle(this.content).lineHeight);
      if (!isNaN(lh) && lh > 0) return Math.round(lh * lines);
    }
    const px = parseInt(this.dataset.collapsedHeight || "", 10);
    return isNaN(px) ? 40 : px;
  }

  applyCollapsedHeight() {
    // Ensure overflow hidden while collapsed
    this.content.style.maxHeight = `${this.collapsedHeightPx}px`;
    this.content.style.overflow = "hidden";
  }

  assess() {
    // Determine if toggle is needed based on natural content height
    const natural = this.content.scrollHeight;
    const needsToggle = natural > this.collapsedHeightPx + 1;

    // Show/hide buttons appropriately
    this.btnMore.classList.toggle("hidden", !needsToggle || this.open);
    this.btnLess.classList.toggle("hidden", !needsToggle || !this.open);

    if (!needsToggle) {
      // No overflow → fully open, no controls, no clipping
      this.content.style.maxHeight = "none";
      this.content.style.overflow = "visible";
      this.btnMore.setAttribute("aria-expanded", "false");
      this.btnLess.setAttribute("aria-expanded", "false");
      this.content.setAttribute("aria-hidden", "false");
      this.open = true; // treat as open
    } else {
      if (this.open) {
        // Keep max-height in sync with content growth (e.g., images loaded)
        this.content.style.maxHeight = `${natural}px`;
        this.content.style.overflow = "visible";
      } else {
        this.applyCollapsedHeight();
      }
    }
  }

  expand() {
    this.open = true;
    const natural = this.content.scrollHeight;
    this.content.style.maxHeight = `${natural}px`;
    this.content.style.overflow = "visible";
    this.btnMore.classList.add("hidden");
    this.btnLess.classList.remove("hidden");
    this.btnMore.setAttribute("aria-expanded", "true");
    this.btnLess.setAttribute("aria-expanded", "true");
    this.content.setAttribute("aria-hidden", "false");
  }

  collapse({ silent = false } = {}) {
    this.open = false;
    this.applyCollapsedHeight();
    this.btnMore.classList.remove("hidden");
    this.btnLess.classList.add("hidden");
    this.btnMore.setAttribute("aria-expanded", "false");
    this.btnLess.setAttribute("aria-expanded", "false");
    this.content.setAttribute("aria-hidden", "true");

    if (!silent) {
      // Scroll back to top of section if user collapsed while scrolled down
      const rect = this.getBoundingClientRect();
      if (rect.top < 0) this.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
customElements.define("expandable-section", ExpandableSection);

// TODO: replace all sliders with CSS-only solution
// Glide.js: https://glidejs.com/docs/
class GlideSlider extends HTMLElement {
  constructor() {
    super();

    this.id = this.getAttribute("id");
    this.options = {};
    this.twBreakpoints = JSON.parse(
      '{"2xs":412,"xs":472,"sm":640,"md":768,"lg":1024,"xl":1280,"2xl":1536}'
    );

    const { breakpointLimit } = this.dataset;
    const viewportWidth = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    );
    if (breakpointLimit === "none") {
      this.initSlider();
    } else {
      if (viewportWidth <= this.twBreakpoints[breakpointLimit]) {
        this.initSlider();
      } else {
        this.classList.remove("glide");
        this.classList.add("relative");

        const track = this.querySelector(".glide__track");
        const slides = this.querySelector(".glide__slides");

        track.classList.forEach((i) => {
          if (i !== "glide__track") {
            slides.classList.add(i);
          }
        });

        track.replaceWith(...track.childNodes);
      }
    }
  }

  getPath(currentBreakpoint) {
    return currentBreakpoint ? this.options.breakpoints[currentBreakpoint] : this.options;
  }

  addOtherPeek(currentPeek, currentBreakpoint) {
    const otherPeek = ["before", "after"].filter((i) => i !== currentPeek)[0];
    const path = this.getPath(currentBreakpoint);

    return path?.peek?.[otherPeek] ? {} : { [otherPeek]: 0 };
  }

  parseValue(valueString) {
    let value;
    if (isNaN(valueString)) {
      value = ["true", "false"].includes(valueString) ? valueString === "true" : valueString;
    } else {
      value = parseInt(valueString);
    }

    return value;
  }

  buildOptionObject(level1, level2, level3, currentBreakpoint) {
    return {
      [level1]: level3
        ? {
            ...[this.getPath(currentBreakpoint)]?.[level1],
            [level2]: this.parseValue(level3),
            // fixes bug: property fails when only before/after is present
            ...(level1 === "peek" && this.addOtherPeek(level2, currentBreakpoint)),
          }
        : this.parseValue(level2),
    };
  }

  getOptions(optionClasses) {
    optionClasses.forEach((className) => {
      const splitClass = className.split(/[\:\.\-]/);

      // if class has breakpoint modifier
      if (className.includes(":")) {
        const breakpointInt = this.twBreakpoints[splitClass[0]];

        if (!this.options.breakpoints) {
          this.options.breakpoints = {};
        }

        this.options.breakpoints[breakpointInt] = {
          ...this.options.breakpoints?.[breakpointInt],
          ...this.buildOptionObject(splitClass[1], splitClass[2], splitClass[3], breakpointInt),
        };
      } else {
        this.options = {
          ...this.options,
          ...this.buildOptionObject(splitClass[0], splitClass[1], splitClass[2]),
        };
      }
    });
  }

  initSlider() {
    const classes = Array.from(this.classList);

    if (classes.length > 0) {
      const optionTypes = ["perView", "peek", "focusAt", "type", "bound", "gap", "autoplay"];
      const optionClasses = classes.filter((className) =>
        optionTypes.some((optionType) => className.includes(optionType))
      );

      if (optionClasses.length > 0) {
        this.getOptions(optionClasses);
      }
    }
    new Glide(`#${this.id}`, this.options).mount();
  }
}
customElements.define("glide-slider", GlideSlider);

class GiftWithPurchaseUrl extends HTMLElement {
  constructor() {
    super();

    this.cart = document.querySelector("cart-drawer");
    const { productId } = this.dataset;

    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let gwpParam = params.gwp;

    if (gwpParam === productId) {
      this.checkGiftQualifiers();
    }
  }

  checkGiftQualifiers() {
    const { threshold, variantId } = this.dataset;

    fetch(window.Shopify.routes.root + "cart.js")
      .then((response) => response.json())
      .then((data) => {
        if (!data.items.map((i) => i.id).includes(variantId)) {
          if (Number(threshold) === 0) {
            this.cart.addFreeGift([variantId]);
          } else if (Number(threshold) > 0) {
            if (localStorage.getItem("osea.gwpUrlVariantId") !== variantId) {
              document.getElementById("GwpUrlModal").show();
              localStorage.setItem("osea.gwpUrlVariantId", variantId);
            }

            if (data.total_price >= threshold) {
              this.cart.addFreeGift([variantId]);
            }
          }
        }
      })
      .catch((error) => console.error(error));
  }
}
customElements.define("gift-with-purchase-url", GiftWithPurchaseUrl);

class CountdownComponent extends HTMLElement {
  constructor() {
    super();
    this.updateTimer();
  }

  updateTimer() {
    setInterval(() => {
      const dateArray = this.dataset.date.split("/");
      const sortedDateArray = [dateArray[2], dateArray[0], dateArray[1]];
      const future = new Date(`${sortedDateArray.join("-")}T${this.dataset.time}:00-07:00`);
      const now = new Date();
      const diff = future - now;

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor(diff / (1000 * 60));
      const s = Math.floor(diff / 1000);

      this.querySelector(".countdown-days").textContent = d;
      this.querySelector(".countdown-hours").textContent = h - d * 24;
      this.querySelector(".countdown-minutes").textContent = m - h * 60;
      this.querySelector(".countdown-seconds").textContent = s - m * 60;
    }, 1000);
  }
}
customElements.define("countdown-component", CountdownComponent);

class GiftCardFields extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onInputChange);
  }

  onInputChange(event) {
    document.querySelector(`product-form.pdp-product-form #sktc${event.target.id}`).value =
      event.target.value;
  }
}
customElements.define("gift-card-fields", GiftCardFields);

class CollectionAnchors extends HTMLElement {
  constructor() {
    super();

    this.querySelectorAll("a").forEach((anchor) =>
      anchor.addEventListener("click", () => this.onAnchorClick(anchor))
    );
  }

  onAnchorClick(anchor) {
    document.querySelectorAll("details.subcollection").forEach((subcollection) => {
      if (subcollection.id === anchor.getAttribute("href").substring(1)) {
        subcollection.setAttribute("open", "");
      } else {
        subcollection.removeAttribute("open");
      }
    });
  }
}
customElements.define("collection-anchors", CollectionAnchors);

// TODO: consider removing - replace with css only solution, or move to only pages that use it
class Accordion {
  constructor(el) {
    this.el = el;
    this.summary = el.querySelector("summary");
    this.content = el.querySelector(".content");
    this.duration = parseInt(el.dataset.duration);

    this.animation = null;
    this.isCollapsing = false;
    this.isExpanding = false;

    this.summary.addEventListener("click", (e) => this.onClick(e));
  }

  onClick(e) {
    e.preventDefault();
    this.el.style.overflow = "hidden";
    if (this.isCollapsing || !this.el.open) {
      this.open();
    } else if (this.isExpanding || this.el.open) {
      this.shrink();
    }
  }

  shrink() {
    this.isCollapsing = true;

    const startHeight = `${this.el.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight}px`;

    if (this.animation) {
      this.animation.cancel();
    }

    this.animation = this.el.animate(
      {
        height: [startHeight, endHeight],
      },
      {
        duration: this.duration,
        easing: "ease-in-out",
      }
    );

    this.animation.onfinish = () => this.onAnimationFinish(false);
    this.animation.oncancel = () => (this.isCollapsing = false);
  }

  open() {
    this.el.style.height = `${this.el.offsetHeight}px`;
    this.el.open = true;
    window.requestAnimationFrame(() => this.expand());
  }

  expand() {
    this.isExpanding = true;
    const startHeight = `${this.el.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

    if (this.animation) {
      this.animation.cancel();
    }

    this.animation = this.el.animate(
      {
        height: [startHeight, endHeight],
      },
      {
        duration: this.duration,
        easing: "ease-in-out",
      }
    );
    this.animation.onfinish = () => this.onAnimationFinish(true);
    this.animation.oncancel = () => (this.isExpanding = false);
  }

  onAnimationFinish(open) {
    this.el.open = open;
    this.animation = null;
    this.isCollapsing = false;
    this.isExpanding = false;
    this.el.style.height = this.el.style.overflow = "";
  }
}
document.querySelectorAll("details.accordion").forEach((el) => {
  new Accordion(el);
});
