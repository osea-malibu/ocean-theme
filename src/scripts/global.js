/**
 * Global JavaScript for Ocean Theme
 *
 * This file contains all custom web components and utility classes used throughout
 * the Ocean theme. It's organized into logical sections for better maintainability.
 *
 * @author Ocean Theme Team
 * @version 1.0.0
 */

// =============================================================================
// IMPORTS & INITIALIZATION
// =============================================================================

import {
  debounce,
  pauseAllMedia,
  trapFocus,
  removeTrapFocus,
} from "./utils.js";
import {
  setupSummaryAriaAttributes,
  setupFocusVisiblePolyfill,
  setupHeaderBorderObserver,
  setupLazyVideos,
  setupManualRedirects,
  setupShopifyCommon,
} from "./setup.js";

// Initialize global setup functions
setupSummaryAriaAttributes();
setupFocusVisiblePolyfill();
setupHeaderBorderObserver();
setupLazyVideos();
setupManualRedirects();
setupShopifyCommon();

// =============================================================================
// FORM COMPONENTS
// =============================================================================

/**
 * Quantity Input Component
 *
 * Handles quantity input functionality with increment/decrement buttons.
 * Includes special logic for subscription products (max 4 items).
 */
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

  /**
   * Handle input value changes
   * @param {Event} event - The change event
   */
  onInputChange(event) {
    const autodeliverOptionEl = document.querySelector(
      'input[value="autodeliver"]'
    );
    const inputValueInteger = parseInt(event.currentTarget.value);
    const plusButtonEl = this.querySelector('button[name="plus"]');

    // Special handling for subscription products (max 4 items)
    if (autodeliverOptionEl && autodeliverOptionEl.checked) {
      this.productForm = document.querySelector(
        "product-form.pdp-product-form"
      );

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

  /**
   * Handle button clicks (plus/minus)
   * @param {Event} event - The click event
   */
  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }
}
customElements.define("quantity-input", QuantityInput);

// =============================================================================
// ANIMATION COMPONENTS
// =============================================================================

/**
 * Icon Marquee Component
 *
 * Creates a horizontally scrolling marquee effect for icons/logos.
 * Handles performance optimization, reduced motion preferences, and responsive behavior.
 */
class IconMarquee extends HTMLElement {
  constructor() {
    super();

    // Configuration and state management
    this.items = [];
    this.animationID = null;
    this.speed = parseFloat(this.getAttribute("speed")) || 1;
    this._reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    this._positionMap = new Map();
    this._observer = null;
    this._isVisible = false;
    this._boundRotate = this.rotate.bind(this);
    this._onVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Initialize component when connected to DOM
   */
  connectedCallback() {
    this._originalContent = this.innerHTML;

    // Skip animation if user prefers reduced motion
    if (this._reducedMotion) return;

    this.setup();
    this.observeVisibility();

    // Listen for page/tab visibility changes
    document.addEventListener("visibilitychange", this._onVisibilityChange);

    // Debounced resize handler
    this._onResize = debounce(() => this.refresh(), 250);
    window.addEventListener("resize", this._onResize);
  }

  /**
   * Cleanup when component is disconnected
   */
  disconnectedCallback() {
    cancelAnimationFrame(this.animationID);
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    if (this._observer) this._observer.disconnect();
  }

  /**
   * Create and position marquee items
   */
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

    // Create marquee items
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

  /**
   * Observe element visibility for performance optimization
   */
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

  /**
   * Core animation loop
   */
  rotate() {
    if (!this._isVisible || document.hidden || !this.items.length) return;

    this.items.forEach((item) => {
      let x = this._positionMap.get(item);
      x -= this.speed;

      // Reset position when item goes off-screen
      if (x + this._itemWidth < 0) {
        const maxX = Math.max(...Array.from(this._positionMap.values()));
        x = maxX + this._itemWidth;
      }

      this._positionMap.set(item, x);
      item.style.transform = `translateX(${x}px)`;
    });

    this.animationID = requestAnimationFrame(this._boundRotate);
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  /**
   * Pause animation
   */
  pause() {
    cancelAnimationFrame(this.animationID);
    this.animationID = null;
  }

  /**
   * Resume animation
   */
  resume() {
    if (!this._isVisible || document.hidden || this.animationID) return;
    this.rotate();
  }

  /**
   * Refresh component on resize
   */
  refresh() {
    this.pause();
    this.innerHTML = this._originalContent;
    this.setup();
    this.observeVisibility();
  }
}
customElements.define("icon-marquee", IconMarquee);

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

/**
 * Footer Accordion Component
 *
 * Manages footer accordion behavior based on screen size.
 * Auto-expands on desktop, collapses on mobile.
 */
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

  /**
   * Handle responsive behavior
   */
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

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Shipping Calculator Component
 *
 * Calculates shipping transit times based on ZIP codes.
 * Contains comprehensive US ZIP code to state mapping.
 */
class ShippingCalculator extends HTMLElement {
  constructor() {
    super();

    this.zipForm = this.querySelector("form");
    this.zipInput = this.querySelector("#shippingzip");
    this.output = this.querySelector("#transitTimeOutput");

    this.zipForm.addEventListener("submit", (e) => this.onZipSubmit(e));
  }

  /**
   * Handle ZIP code form submission
   * @param {Event} e - Form submit event
   */
  onZipSubmit(e) {
    e.preventDefault();

    const { st, transitTime } = this.getStateData(this.zipInput.value);
    const { transitionStart, transitionEnd } = this.output.dataset;

    this.output.innerHTML = `${st}: ${transitTime}`;
    this.output.classList.remove(...transitionStart.split(" "));
    this.output.classList.add(...transitionEnd.split(" "));
  }

  /**
   * Get state and transit time data for ZIP code
   * @param {string} zipString - 5-digit ZIP code
   * @returns {Object} State abbreviation and transit time
   */
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
    } else if (
      (zipcode >= 6000 && zipcode <= 6389) ||
      (zipcode >= 6391 && zipcode <= 6999)
    ) {
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
    } else if (
      (zipcode >= 30000 && zipcode <= 31999) ||
      (zipcode >= 39800 && zipcode <= 39999)
    ) {
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
    } else if (
      (zipcode >= 1000 && zipcode <= 2799) ||
      zipcode == 5501 ||
      zipcode == 5544
    ) {
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
    } else if (
      (zipcode >= 73000 && zipcode <= 73199) ||
      (zipcode >= 73400 && zipcode <= 74999)
    ) {
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

// =============================================================================
// NAVIGATION COMPONENTS
// =============================================================================

/**
 * Menu Drawer Component
 *
 * Handles mobile navigation menu functionality including:
 * - Opening/closing menu drawer
 * - Submenu navigation
 * - Keyboard navigation and accessibility
 * - Focus management
 */
class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    // Fix for iOS viewport height issues
    if (navigator.platform === "iPhone")
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${window.innerHeight}px`
      );

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelector(".menu-scrim").addEventListener(
      "click",
      this.onSummaryClick.bind(this)
    );
    this.querySelectorAll(".submenu-close").forEach((button) =>
      button.addEventListener("click", this.onCloseSubmenu.bind(this))
    );
    this.querySelectorAll("a, summary").forEach((navLink) =>
      navLink.addEventListener("click", this.onNavLinkClick.bind(this))
    );

    const closeButton = this.querySelector(".menu-close");
    closeButton &&
      closeButton.addEventListener("click", this.closeMenuDrawer.bind(this));
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Key event
   */
  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(
          event,
          this.mainDetailsToggle.querySelector("summary")
        )
      : this.closeSubmenu(openDetailsElement);
  }

  /**
   * Handle summary click events
   * @param {Event} event - Click event
   */
  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );
      summaryElement.nextElementSibling.removeEventListener(
        "transitionend",
        addTrapFocus
      );
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(event, summaryElement)
        : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        summaryElement.setAttribute("aria-expanded", true);
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener(
              "transitionend",
              addTrapFocus
            );
      }, 100);
    }
  }

  /**
   * Handle navigation link clicks
   * @param {Event} event - Click event
   */
  onNavLinkClick(event) {
    console.log("clicked nav link", event);
  }

  /**
   * Open the main menu drawer
   * @param {HTMLElement} summaryElement - The summary element that was clicked
   */
  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add("overflow-hidden");
  }

  /**
   * Close the main menu drawer
   * @param {Event} event - The event that triggered the close
   * @param {HTMLElement} elementToFocus - Element to focus after closing
   */
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

  /**
   * Handle focus out events
   * @param {FocusEvent} event - Focus event
   */
  onFocusOut(event) {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  /**
   * Handle submenu close button clicks
   * @param {Event} event - Click event
   */
  onCloseSubmenu(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  /**
   * Close a submenu
   * @param {HTMLElement} detailsElement - The details element to close
   */
  closeSubmenu(detailsElement) {
    detailsElement.classList.remove("menu-opening");
    detailsElement
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  /**
   * Animate the closing of menu elements
   * @param {HTMLElement} detailsElement - The element to animate
   */
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

  /**
   * Set menu top position based on header height
   */
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

/**
 * Dismissable Announcement Component
 *
 * Manages dismissable announcement bar functionality.
 * Stores dismissal state in session storage.
 */
class DismissableAnnoucement extends HTMLElement {
  constructor() {
    super();

    this.dismissableMessage = this.querySelector("#DismissableMessage");
    this.defaultMessage = this.querySelector("#DismissableDefault");
    this.closeButton = this.querySelector("#DismissableClose");

    this.closeButton.addEventListener("click", this.onClose.bind(this));
  }

  connectedCallback() {
    let isDismissed = JSON.parse(
      sessionStorage.getItem("osea.announcementDismissed")
    );
    if (isDismissed) {
      this.useDefaultMessage();
    } else {
      const menuDrawer = document.querySelector("menu-drawer");
      menuDrawer.setMenuTopValue();
    }
  }

  /**
   * Handle close button click
   */
  onClose() {
    const drawer = document.querySelector("#HamburgerMenu .menu-drawer");
    const scrim = document.querySelector("#HamburgerMenu .menu-scrim");

    drawer.style.removeProperty("top");
    scrim.style.removeProperty("top");

    this.useDefaultMessage();
    sessionStorage.setItem("osea.announcementDismissed", true);
  }

  /**
   * Switch to default message display
   */
  useDefaultMessage() {
    this.dismissableMessage.classList.add("hidden");
    this.closeButton.classList.add("hidden");
    this.defaultMessage.classList.remove("hidden");
  }
}
customElements.define("dismissable-announcement", DismissableAnnoucement);

// =============================================================================
// MODAL COMPONENTS
// =============================================================================

/**
 * Modal Dialog Component
 *
 * Handles modal dialog functionality including:
 * - Opening/closing modals
 * - Keyboard navigation (ESC to close)
 * - Focus management
 * - Click outside to close
 */
class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      "click",
      this.hide.bind(this)
    );
    this.querySelectorAll(".close-modal").forEach((i) =>
      i.addEventListener("click", this.hide.bind(this))
    );
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });

    // Handle click outside to close
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (
          event.pointerType === "mouse" &&
          !event.target.closest("deferred-media, product-model")
        )
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target.nodeName === "MODAL-DIALOG") this.hide();
      });
    }
  }

  /**
   * Show the modal
   * @param {HTMLElement} opener - Element that opened the modal
   */
  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    pauseAllMedia();
  }

  /**
   * Hide the modal
   */
  hide() {
    document.body.classList.remove("overflow-hidden");
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

/**
 * Modal Opener Component
 *
 * Handles opening modals from trigger elements.
 */
class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button =
      this.querySelector("button") || this.querySelector('[type="button"]');

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) modal.show(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);

/**
 * Deferred Media Component
 *
 * Handles lazy loading of media content (videos, etc.).
 * Only loads content when user clicks to play.
 */
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  /**
   * Load the deferred media content
   */
  loadContent() {
    pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      this.appendChild(content).focus();
    }
  }
}
customElements.define("deferred-media", DeferredMedia);

// =============================================================================
// PRODUCT COMPONENTS
// =============================================================================

/**
 * Variant Selects Component
 *
 * Handles product variant selection functionality including:
 * - Variant option updates
 * - Media updates (images)
 * - URL updates
 * - Subscription handling
 * - Add to cart button states
 */
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

  /**
   * Handle variant change events
   */
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

  /**
   * Update selected options from form inputs
   */
  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  /**
   * Update the current variant based on selected options
   */
  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  /**
   * Update subscription status based on variant
   */
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

  /**
   * Reset purchase option to one-time purchase
   */
  resetPurchaseOption() {
    // reset purchase option to one-time
    if (
      window.location.pathname.includes("/products/") &&
      document.querySelector("subscription-radios")
    ) {
      document
        .querySelector(".purchase-option.onetime")
        .classList.add("bg-wave-200");
      document.querySelector('input[value="onetime"]').checked = true;
      document
        .querySelector(".purchase-option.autodeliver")
        .classList.remove("bg-wave-200");
      document.querySelector('input[value="autodeliver"]').checked = false;
    }
  }

  /**
   * Update product media (images) based on variant
   */
  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const isMainPdp = this.dataset.isMainPdp === "true";
    if (isMainPdp) {
      // change first image in product page image gallery
      const variantImageEl = document.querySelector("#Product-VariantImage");
      const newImageSrc = this.currentVariant.featured_image.src;
      if (variantImageEl) {
        variantImageEl.srcset = `${newImageSrc}&width=294 1x, ${newImageSrc}&width=588 2x`;
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

  /**
   * Update URL with variant parameter
   */
  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  /**
   * Update variant input in product forms
   */
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

  /**
   * Remove error messages from product form
   */
  removeErrorMessage() {
    const section = this.closest("section");
    if (!section) return;

    const productForm = section.querySelector("product-form");
    if (productForm) productForm.handleErrorMessage();
  }

  /**
   * Render updated product information via AJAX
   */
  renderProductInfo() {
    const { id } = this.currentVariant;
    fetch(`${this.dataset.url}?variant=${id}`)
      .then((response) => response.text())
      .then((responseText) => {
        const responseHTML = new DOMParser().parseFromString(
          responseText,
          "text/html"
        );

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

        this.toggleAddButton(
          !this.currentVariant.available,
          window.variantStrings.soldOut
        );
      });
  }

  /**
   * Update option visibility based on variant selection
   */
  updateOptionVisibility() {
    if (
      this.currentVariant &&
      window.location.pathname.includes("/products/")
    ) {
      const subscriptionRadios = document.querySelector("subscription-radios");
      if (subscriptionRadios) {
        const allcoationGroupIds =
          this.currentVariant.selling_plan_allocations.map(
            (i) => i.selling_plan_group_id
          );
        const hasSubscriptionOption =
          this.currentVariant.selling_plan_allocations.length > 0 &&
          allcoationGroupIds.includes(
            subscriptionRadios.dataset.subscriptionGroupId
          );
        if (hasSubscriptionOption) {
          subscriptionRadios.classList.add("max-h-52");
          subscriptionRadios.classList.remove("max-h-0");
        } else {
          subscriptionRadios.classList.add("max-h-0");
          subscriptionRadios.classList.remove("max-h-52");
        }
      }

      const scentValues = ["Fragrance free", "Scented"];
      const hasScentVariant = this.currentVariant.options.some(
        (r) => scentValues.indexOf(r) >= 0
      );
      if (hasScentVariant) {
        const scentRadios = document.getElementsByName("Scent");
        const sizeRadios = document.getElementsByName("Size");
        const originalScentInfo = document.querySelectorAll(".scent-scented");
        const fragranceFreeScentInfo = document.querySelectorAll(
          ".scent-fragrance-free"
        );

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
      const normalizedVariantTitle = this.currentVariant.title.replace(
        "fl oz",
        "oz"
      );
      const isMiniSize = miniSizeArray.includes(normalizedVariantTitle);
      const miniInfo = document.querySelectorAll(".size-mini");
      miniInfo.forEach((i) => {
        i.classList.toggle("hidden", !isMiniSize);
      });
    }
  }

  /**
   * Toggle add to cart button state
   * @param {boolean} disable - Whether to disable the button
   * @param {string} text - Button text to display
   * @param {boolean} modifyClass - Whether to modify CSS classes
   */
  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(
      `product-form-${this.dataset.section}`
    );
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

  /**
   * Set product as unavailable
   */
  setUnavailable() {
    const button = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("invisible");
  }

  /**
   * Handle Klaviyo Back in Stock trigger behavior
   */
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
        console.log("bisTrigger", bisTrigger);

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

  /**
   * Get variant data from JSON script tag
   * @returns {Array} Array of variant data objects
   */
  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(
        this.querySelector('[type="application/json"].variant-data').textContent
      );
    return this.variantData;
  }
}
customElements.define("variant-selects", VariantSelects);

/**
 * Variant Radios Component
 *
 * Extends VariantSelects to handle radio button variant selection.
 */
class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  /**
   * Update selected options from radio button groups
   */
  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll("input")).find(
        (radio) => radio.checked
      ).value;
    });
  }
}
customElements.define("variant-radios", VariantRadios);

/**
 * Subscription Radios Component
 *
 * Handles subscription vs one-time purchase selection.
 * Manages pricing updates and selling plan selection.
 */
class SubscriptionRadios extends HTMLElement {
  constructor() {
    super();

    this.isSubscriptionInput = document.querySelector(
      'input[name="properties[_is_subscription]"]'
    );
    this.purchaseOptionInputs = Array.from(
      this.querySelectorAll('input[name="purchase_option"]')
    );

    const urlParams = new URLSearchParams(window.location.search);
    const urlPurchaseType = urlParams.get("type");

    this.purchaseOptionInputs.forEach((input) => {
      const isSubscription =
        urlPurchaseType === "subscription" ||
        document.referrer.includes("/pages/subscribe");
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

  /**
   * Handle purchase option change (subscription vs one-time)
   * @param {Event} e - Change event
   */
  onPurchaseOptionChange(e) {
    const { value, checked } = e.currentTarget;

    if (checked) {
      this.setActiveState();
      this.updateMainPrice(e.currentTarget);

      const plusButtonEl = document.querySelector(
        '.pdp-quantity button[name="plus"]'
      );

      if (value === "onetime") {
        this.clearSellingPlanValues();
        this.isSubscriptionInput.value = false;
        this.productForm = document.querySelector(
          "product-form.pdp-product-form"
        );

        document
          .querySelector("#PayInstallments")
          ?.classList.remove("opacity-0");

        if (plusButtonEl && plusButtonEl.disabled)
          plusButtonEl.removeAttribute("disabled");
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

  /**
   * Set active state styling for selected option
   */
  setActiveState() {
    this.purchaseOptionInputs?.forEach((input) => {
      input
        .closest(".purchase-option")
        .classList.toggle(
          this.dataset.selectedColor || "bg-wave-200",
          input.checked
        );
      input
        .closest(".purchase-option")
        .classList.toggle("bg-white", !input.checked);
    });
  }

  /**
   * Update main price display
   * @param {HTMLElement} currentTarget - The selected option element
   */
  updateMainPrice(currentTarget) {
    const currentPrice = currentTarget
      .closest(".purchase-option")
      .querySelector(".price");
    const mainPrice = document.querySelector(".main-price.price");

    mainPrice.innerHTML = currentPrice.innerHTML;
  }

  /**
   * Clear all selling plan selections
   */
  clearSellingPlanValues() {
    Array.from(this.querySelectorAll('input[name="selling_plan"]'))?.forEach(
      (input) => (input.checked = false)
    );
  }

  /**
   * Set default selling plan based on recommended interval
   */
  setDefaultSellingPlan() {
    const defaultSellingPlanInt = this.dataset.recommendedInterval || 2;
    const defaultSellingPlanInput = Array.from(
      this.querySelectorAll('input[name="selling_plan"]')
    )[defaultSellingPlanInt - 1];

    defaultSellingPlanInput.checked = true;
  }
}
customElements.define("subscription-radios", SubscriptionRadios);

/**
 * Product Sticky Add to Cart Component
 *
 * Manages sticky add to cart button visibility based on scroll position.
 * Shows/hides based on intersection with main product form.
 */
class ProductStickyAtc extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.atcObserver = new IntersectionObserver((entries) => {
      const root = document.documentElement;

      if (entries[0].intersectionRatio <= 0) {
        const height = this.offsetHeight;
        root.style.setProperty("--sticky-atc-height", `${height}px`);
        this.classList.remove("invisible", "opacity-0");
      } else {
        root.style.setProperty("--sticky-atc-height", "0px");
        this.classList.add("invisible", "opacity-0");
      }
    });

    this.atcObserver.observe(
      document.querySelector(".product-form.pdp-product-form")
    );
  }

  disconnectedCallback() {
    if (this.atcObserver) {
      this.atcObserver.disconnect();
    }
  }
}
customElements.define("product-sticky-atc", ProductStickyAtc);

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Tab Controller Component
 *
 * Handles tab functionality with keyboard navigation and accessibility.
 * Supports URL parameters for deep linking to specific tabs.
 */
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

  /**
   * Add event listeners for keyboard navigation
   */
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
          this.setActiveTab(
            this.tabs[this.tabs.length - 1].getAttribute("aria-controls")
          );
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

  /**
   * Set the active tab by ID
   * @param {string} id - Tab panel ID to activate
   * @param {boolean} skipFocus - Whether to skip focus management
   */
  setActiveTab(id, skipFocus = false) {
    const activeTabClass = this.dataset.activeClass?.split(" ") || [
      "bg-wave-200",
    ];
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

  /**
   * Check URL parameters for deep linking
   */
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

/**
 * Horizontal Scroll Box Component
 *
 * Provides horizontal scrolling with navigation arrows.
 * Shows/hides navigation based on scroll position.
 */
class HorizontalScrollBox extends HTMLElement {
  constructor() {
    super();
    this.scrollBox = this.querySelector(".scroll-box");
    this.navNext = this.querySelector("nav .next");
    this.navPrev = this.querySelector("nav .prev");

    this.addEventListeners();
    this.handleShowNav();
  }

  /**
   * Add event listeners for navigation
   */
  addEventListeners() {
    if (
      this.scrollBox.getBoundingClientRect().width < this.scrollBox.scrollWidth
    ) {
      this.navNext.addEventListener("click", () =>
        this.scrollContainer("next")
      );
      this.navPrev.addEventListener("click", () =>
        this.scrollContainer("prev")
      );

      this.scrollBox.addEventListener("scroll", this.handleShowNav.bind(this));
    }
  }

  /**
   * Scroll container in specified direction
   * @param {string} direction - 'next' or 'prev'
   */
  scrollContainer(direction) {
    this.scrollBox.scrollTo({
      left:
        direction === "next"
          ? this.scrollBox.scrollLeft + 120
          : this.scrollBox.scrollLeft - 120,
      behavior: "smooth",
    });
  }

  /**
   * Show/hide navigation arrows based on scroll position
   */
  handleShowNav() {
    this.navNext.classList.toggle(
      "nav-hide",
      this.scrollBox.scrollWidth - this.scrollBox.scrollLeft ==
        this.scrollBox.getBoundingClientRect().width
    );
    this.navPrev.classList.toggle("nav-hide", this.scrollBox.scrollLeft == 0);
  }
}
customElements.define("horizontal-scroll-box", HorizontalScrollBox);

/**
 * Glide Slider Component
 *
 * Wrapper for Glide.js slider library with responsive breakpoint support.
 * Handles configuration parsing from CSS classes.
 */
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

  /**
   * Get configuration path for current breakpoint
   * @param {number} currentBreakpoint - Breakpoint width
   * @returns {Object} Configuration object
   */
  getPath(currentBreakpoint) {
    return currentBreakpoint
      ? this.options.breakpoints[currentBreakpoint]
      : this.options;
  }

  /**
   * Add other peek configuration
   * @param {string} currentPeek - Current peek direction
   * @param {number} currentBreakpoint - Breakpoint width
   * @returns {Object} Peek configuration
   */
  addOtherPeek(currentPeek, currentBreakpoint) {
    const otherPeek = ["before", "after"].filter((i) => i !== currentPeek)[0];
    const path = this.getPath(currentBreakpoint);

    return path?.peek?.[otherPeek] ? {} : { [otherPeek]: 0 };
  }

  /**
   * Parse configuration value
   * @param {string} valueString - Value string to parse
   * @returns {any} Parsed value
   */
  parseValue(valueString) {
    let value;
    if (isNaN(valueString)) {
      value = ["true", "false"].includes(valueString)
        ? valueString === "true"
        : valueString;
    } else {
      value = parseInt(valueString);
    }

    return value;
  }

  /**
   * Build option object from class parts
   * @param {string} level1 - First level key
   * @param {string} level2 - Second level key
   * @param {string} level3 - Third level value
   * @param {number} currentBreakpoint - Breakpoint width
   * @returns {Object} Option object
   */
  buildOptionObject(level1, level2, level3, currentBreakpoint) {
    return {
      [level1]: level3
        ? {
            ...[this.getPath(currentBreakpoint)]?.[level1],
            [level2]: this.parseValue(level3),
            // fixes bug: property fails when only before/after is present
            ...(level1 === "peek" &&
              this.addOtherPeek(level2, currentBreakpoint)),
          }
        : this.parseValue(level2),
    };
  }

  /**
   * Parse options from CSS classes
   * @param {Array} optionClasses - Array of option classes
   */
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
          ...this.buildOptionObject(
            splitClass[1],
            splitClass[2],
            splitClass[3],
            breakpointInt
          ),
        };
      } else {
        this.options = {
          ...this.options,
          ...this.buildOptionObject(
            splitClass[0],
            splitClass[1],
            splitClass[2]
          ),
        };
      }
    });
  }

  /**
   * Initialize the Glide slider
   */
  initSlider() {
    const classes = Array.from(this.classList);

    if (classes.length > 0) {
      const optionTypes = [
        "perView",
        "peek",
        "focusAt",
        "type",
        "bound",
        "gap",
        "autoplay",
      ];
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

/**
 * Gift With Purchase URL Component
 *
 * Handles gift with purchase functionality based on URL parameters.
 * Checks cart value and adds gifts automatically.
 */
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

  /**
   * Check if gift qualifies for automatic addition
   */
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

/**
 * Countdown Component
 *
 * Displays countdown timer with days, hours, minutes, and seconds.
 * Updates every second.
 */
class CountdownComponent extends HTMLElement {
  constructor() {
    super();
    this.updateTimer();
  }

  /**
   * Update countdown timer every second
   */
  updateTimer() {
    setInterval(() => {
      const dateArray = this.dataset.date.split("/");
      const sortedDateArray = [dateArray[2], dateArray[0], dateArray[1]];
      const future = new Date(
        `${sortedDateArray.join("-")}T${this.dataset.time}:00-07:00`
      );
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

/**
 * Gift Card Fields Component
 *
 * Syncs gift card form fields with product form.
 */
class GiftCardFields extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onInputChange);
  }

  /**
   * Handle input changes and sync with product form
   * @param {Event} event - Change event
   */
  onInputChange(event) {
    document.querySelector(
      `product-form.pdp-product-form #sktc${event.target.id}`
    ).value = event.target.value;
  }
}
customElements.define("gift-card-fields", GiftCardFields);

/**
 * Collection Anchors Component
 *
 * Handles collection page anchor navigation.
 * Opens/closes subcollections based on anchor clicks.
 */
class CollectionAnchors extends HTMLElement {
  constructor() {
    super();

    this.querySelectorAll("a").forEach((anchor) =>
      anchor.addEventListener("click", () => this.onAnchorClick(anchor))
    );
  }

  /**
   * Handle anchor click events
   * @param {HTMLElement} anchor - The clicked anchor element
   */
  onAnchorClick(anchor) {
    document
      .querySelectorAll("details.subcollection")
      .forEach((subcollection) => {
        if (subcollection.id === anchor.getAttribute("href").substring(1)) {
          subcollection.setAttribute("open", "");
        } else {
          subcollection.removeAttribute("open");
        }
      });
  }
}
customElements.define("collection-anchors", CollectionAnchors);

/**
 * Postscript Teaser Component
 *
 * Handles Postscript popup teaser functionality.
 * Shows teaser when Postscript is ready and opens popups on click.
 */
class PostscriptTeaser extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector("button");
    this.popupId = this.dataset.popupId;

    //show teaser when postscript is ready
    window.addEventListener("postscriptReady", () => {
      console.log("postscript ready");
      this.style.display = "block";

      this.button.addEventListener("click", () => {
        console.log("button clicked");
        this.openPopup();
      });
    });
  }

  /**
   * Open Postscript popup
   */
  openPopup() {
    console.log("open popup", this.popupId);
    window.postscript.popups.open(this.popupId, {
      activePopupBehavior: "ALWAYS_DISMISS",
      respectPopupStatus: false,
    });
  }
}
customElements.define("postscript-teaser", PostscriptTeaser);

// =============================================================================
// LEGACY COMPONENTS
// =============================================================================

/**
 * Accordion Component (Legacy)
 *
 * TODO: consider removing - replace with css only solution, or move to only pages that use it
 *
 * Handles accordion functionality with smooth animations.
 * Uses Web Animations API for performance.
 */
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

  /**
   * Handle accordion click events
   * @param {Event} e - Click event
   */
  onClick(e) {
    e.preventDefault();
    this.el.style.overflow = "hidden";
    if (this.isCollapsing || !this.el.open) {
      this.open();
    } else if (this.isExpanding || this.el.open) {
      this.shrink();
    }
  }

  /**
   * Shrink accordion with animation
   */
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

  /**
   * Open accordion
   */
  open() {
    this.el.style.height = `${this.el.offsetHeight}px`;
    this.el.open = true;
    window.requestAnimationFrame(() => this.expand());
  }

  /**
   * Expand accordion with animation
   */
  expand() {
    this.isExpanding = true;
    const startHeight = `${this.el.offsetHeight}px`;
    const endHeight = `${
      this.summary.offsetHeight + this.content.offsetHeight
    }px`;

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

  /**
   * Handle animation completion
   * @param {boolean} open - Whether accordion is open
   */
  onAnimationFinish(open) {
    this.el.open = open;
    this.animation = null;
    this.isCollapsing = false;
    this.isExpanding = false;
    this.el.style.height = this.el.style.overflow = "";
  }
}

// Initialize legacy accordion components
document.querySelectorAll("details.accordion").forEach((el) => {
  new Accordion(el);
});
