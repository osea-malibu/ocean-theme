import { CartItems } from "./cart.js";
import { onKeyUpEscape, fetchConfig, trapFocus, removeTrapFocus } from "./utils.js";

class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.onOverlayClick = this.close.bind(this);
    this.hasEnsuredGwp = false;

    this.addEventListener("keyup", (evt) => evt.code === "Escape" && this.close());

    this.syncDrawerElements();
    this.rebindOverlayClick();

    this.setHeaderCartIconAccessibility();
    this.attachEventListeners();
  }

  syncDrawerElements() {
    this.overlay = this.querySelector(".cart-scrim");
    this.drawer = this.querySelector(".cart-drawer");
  }

  rebindOverlayClick() {
    this.syncDrawerElements();
    if (!this.overlay) return;
    this.overlay.removeEventListener("click", this.onOverlayClick);
    this.overlay.addEventListener("click", this.onOverlayClick);
  }

  attachEventListeners() {
    document.addEventListener("loopByobAddToCartSuccessEvent", () => {
      const opener = document.activeElement;

      fetch("https://oseamalibu.com/cart.js")
        .then((response) => response.json())
        .then((response) => {
          if (response?.status) {
            console.log("error", response.status);
            return;
          }
          if (!response) {
            window.location = window.routes.cart_url;
            return;
          }
          this.renderContents(response, opener);
        })
        .catch((e) => console.error(e));
    });

    document.body.addEventListener("blotout-wallet-cart-restored", async () => {
      console.log("blotout-wallet-cart-restored");
      const opener = document.activeElement;

      try {
        const response = await fetch("/cart.js");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Could not fetch cart contents - ${response.status}: ${errorText}`);
        }

        const contents = await response.json();
        this.renderContents(contents, opener);
      } catch (err) {
        console.error("Error fetching cart data:", err);
      }
    });
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#cart-icon-bubble");
    if (!cartLink) return;

    cartLink.setAttribute("role", "button");
    cartLink.setAttribute("aria-haspopup", "dialog");

    cartLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.open(cartLink);
    });

    cartLink.addEventListener("keydown", (event) => {
      if (event.code.toUpperCase() === "SPACE") {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    const opener = triggeredBy || this.activeElement || document.activeElement;
    if (opener) this.setActiveElement(opener);

    this.syncDrawerElements();
    this.ensureGiftWithPurchase();

    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute("role")) {
      this.setSummaryAccessibility(cartDrawerNote);
    }

    this.classList.remove("invisible");
    document.body.classList.add("overflow-hidden");

    requestAnimationFrame(() => {
      this.classList.add("active");
      window.bootstrapCartProductsSection?.();

      const prefersReducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

      let done = false;
      let fallbackTimer1 = null;
      let fallbackTimer2 = null;

      const cleanup = () => {
        if (fallbackTimer1) window.clearTimeout(fallbackTimer1);
        if (fallbackTimer2) window.clearTimeout(fallbackTimer2);
      };

      const focusDrawerAndTrap = () => {
        if (done) return;

        // Re-sync AFTER paint (important when drawer markup was replaced by section render)
        this.syncDrawerElements();
        const drawerEl = this.drawer || this.querySelector(".cart-drawer");
        if (!drawerEl) return; // try again via fallbacks

        done = true;
        cleanup();

        // Ensure the dialog container is programmatically focusable
        if (!drawerEl.hasAttribute("tabindex")) drawerEl.setAttribute("tabindex", "-1");

        // 1) Trap focus inside the drawer
        trapFocus(drawerEl, drawerEl);

        // 2) Force focus onto the drawer container
        // Do it after trapFocus because some implementations move focus to first focusable element.
        drawerEl.focus({ preventScroll: true });

        // 3) Re-assert focus (apps/scripts often steal it slightly later)
        requestAnimationFrame(() => {
          if (document.activeElement !== drawerEl) {
            drawerEl.focus({ preventScroll: true });
          }
        });

        // One more late pass catches "setTimeout(0)" focus stealers
        setTimeout(() => {
          if (document.activeElement !== drawerEl) {
            drawerEl.focus({ preventScroll: true });
          }
        }, 50);
      };

      if (prefersReducedMotion) {
        requestAnimationFrame(() => requestAnimationFrame(focusDrawerAndTrap));
        return;
      }

      // Try on transition end if the transition is on the drawer, otherwise fallbacks handle it
      const transitionEl = this.drawer || this.querySelector(".cart-drawer") || this;
      const onTransitionEnd = (e) => {
        if (e.target !== transitionEl) return;
        focusDrawerAndTrap();
      };
      transitionEl.addEventListener("transitionend", onTransitionEnd, { once: true });

      // Fallbacks (re-render + paint timing varies on add-to-cart path)
      requestAnimationFrame(() => requestAnimationFrame(focusDrawerAndTrap));
      fallbackTimer1 = window.setTimeout(focusDrawerAndTrap, 250);
      fallbackTimer2 = window.setTimeout(focusDrawerAndTrap, 600);
    });
  }

  ensureGiftWithPurchase() {
    if (this.hasEnsuredGwp) return;

    const gwpSettings = window?.gwpSettings;
    if (!gwpSettings?.enabled) return;

    const cartItemsElement =
      document.querySelector("cart-drawer-items") || document.querySelector("cart-items");
    if (!cartItemsElement?.handleGiftWithPurchase) return;

    this.hasEnsuredGwp = true;

    fetch(`${window.Shopify.routes.root}cart.js`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch cart: ${response.status}`);
        return response.json();
      })
      .then((cartState) => {
        cartItemsElement.handleGiftWithPurchase(cartState);
      })
      .catch((error) => {
        console.error("Error running gift with purchase sync:", error);
        this.hasEnsuredGwp = false;
      });
  }

  close() {
    this.classList.remove("active");
    setTimeout(() => this.classList.add("invisible"), 400);

    removeTrapFocus(this.activeElement);
    document.body.classList.remove("overflow-hidden");

    const elements = document.querySelectorAll(".cart-items #bud");
    // Iterate over each selected element and remove it from the DOM
    elements.forEach((element) => element.remove());
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button");
    cartDrawerNote.setAttribute("aria-expanded", "false");

    if (cartDrawerNote.nextElementSibling?.getAttribute("id")) {
      cartDrawerNote.setAttribute("aria-controls", cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute(
        "aria-expanded",
        !event.currentTarget.closest("details").hasAttribute("open")
      );
    });

    cartDrawerNote.parentElement?.addEventListener("keyup", (event) => onKeyUpEscape(event));
  }

  renderContents(parsedState, triggeredBy) {
    this.syncDrawerElements();
    if (this.drawer?.classList.contains("is-empty")) this.drawer.classList.remove("is-empty");

    this.productId = parsedState?.id;

    const applySections = (state) => {
      this.getSectionsToRender().forEach((section) => {
        const sectionElement = section.selector
          ? document.querySelector(section.selector)
          : document.getElementById(section.id);

        if (!sectionElement) return;

        sectionElement.innerHTML = this.getSectionInnerHTML(
          state.sections[section.id],
          section.selector
        );
      });
    };

    const finalize = () => {
      // Let DOM paint before binding events + trapping focus.
      requestAnimationFrame(() => {
        this.syncDrawerElements();
        this.rebindOverlayClick();
        this.open(triggeredBy);
      });
    };

    // BUG WORKAROUND FOR SHOPIFY CLI
    // cart/add does not return sections via dev server
    // if sections are null, fall back on Section Rendering API
    // https://github.com/Shopify/shopify-cli/issues/1797
    if (!parsedState?.sections) {
      fetch(
        `${window.Shopify.routes.root}?sections=${this.getSectionsToRender()
          .map((section) => section.id)
          .join(",")}`
      )
        .then((response) => response.json())
        .then((sectionsResponse) => {
          parsedState.sections = sectionsResponse;
          applySections(parsedState);
          finalize();
        })
        .catch((error) => console.error(error));
      return;
    }

    applySections(parsedState);
    finalize();
  }

  addFreeGift(productArray) {
    const giftItemsArray = productArray.map((product) => ({ id: product, quantity: 1 }));
    const body = JSON.stringify({ items: giftItemsArray });

    fetch(`${routes.cart_add_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.json())
      .then((response) => this.renderContents(response, document.activeElement))
      .catch((error) => console.error(error));
  }

  clearCart() {
    fetch(window.Shopify.routes.root + "cart/clear.js")
      .then(() => {
        const emptyCartHTML =
          '<div class="cart-empty h-full overflow-hidden flex flex-col items-center justify-center w-60 mx-auto"><h2 class="text-lg tracking-wide font-book mb-4">Your cart is empty</h2><a href="/collections/bestsellers" class="button button-secondary mb-4 w-full">Shop Best Sellers</a><a href="/collections/skincare" class="button button-secondary mb-4 w-full">Shop Skincare</a><a href="/collections/body-care" class="button button-secondary mb-4 w-full">Shop Body Care</a><a href="/collections/shop" class="button button-secondary mb-4 w-full">Shop All</a><a href="/pages/quiz" class="button button-secondary mb-4 w-full">Take Skin Quiz</a></div>';
        const emptyCartBubbleHTML =
          '<a href="/cart" class="header__icon header__icon--cart cursor-pointer flex w-10 h-10 justify-center items-center ml-1 md:ml-4 -mr-1" id="cart-icon-bubble"><span class="hidden">Cart</span><div class="w-8 h-8 bg-seafoam-300 rounded-full flex justify-center items-center"><span aria-hidden="true" class="leading-8 font-book text-lg">0</span><span class="hidden">0 items</span></div></a>';

        const cartBubble = document.getElementById("cart-icon-bubble");
        const cartDrawerWrapper = document.querySelector("cart-drawer");
        const cartFooter = document.getElementById("main-cart-footer");
        const cartDrawerBody = document.querySelector(".cart-drawer-body");
        const cartDrawerFooter = document.querySelector(".cart-drawer-footer");

        if (cartBubble) cartBubble.outerHTML = emptyCartBubbleHTML;
        if (cartDrawerBody) cartDrawerBody.innerHTML = emptyCartHTML;
        if (cartDrawerFooter) cartDrawerFooter.remove();
        if (cartFooter) cartFooter.classList.add("is-empty");

        if (cartDrawerWrapper) {
          cartDrawerWrapper.classList.add("is-empty");
          trapFocus(
            cartDrawerWrapper.querySelector(".cart-empty"),
            cartDrawerWrapper.querySelector("a")
          );
        }
      })
      .catch((error) => console.error(error));
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const el = doc.querySelector(selector);
    return el ? el.innerHTML : "";
  }

  getSectionsToRender() {
    return [
      { id: "cart-drawer", selector: "#CartDrawer" },
      { id: "cart-icon-bubble", selector: "#cart-icon-bubble" },
      { id: "announcement-bar", selector: "#AnnouncementBar" },
    ];
  }

  getSectionDOM(html, selector = ".shopify-section") {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("cart-drawer", CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      { id: "CartDrawer", section: "cart-drawer", selector: ".cart-drawer" },
      { id: "cart-icon-bubble", section: "cart-icon-bubble", selector: ".shopify-section" },
      {
        id: "shopify-section-announcement-bar",
        section: "announcement-bar",
        selector: ".shopify-section",
      },
    ];
  }
}

customElements.define("cart-drawer-items", CartDrawerItems);
