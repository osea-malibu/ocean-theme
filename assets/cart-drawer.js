class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.overlay = this.querySelector(".cart-scrim");
    this.drawer = this.querySelector(".cart-drawer");

    this.addEventListener("keyup", (evt) => evt.code === "Escape" && this.close());
    this.overlay.addEventListener("click", this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#cart-icon-bubble");
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
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute("role")) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.remove("invisible");
      this.classList.add("active");
    });

    this.addEventListener(
      "transitionend",
      () => {
        const containerToTrapFocusOn = this.classList.contains("is-empty") ? this.querySelector(".cart-empty") : document.getElementById("CartDrawer");
        const focusElement = this.drawer || this.querySelector(".cart-close");
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add("overflow-hidden");
  }

  close() {
    this.classList.remove("active");
    setTimeout(() => this.classList.add("invisible"), 400);

    removeTrapFocus(this.activeElement);
    document.body.classList.remove("overflow-hidden");
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button");
    cartDrawerNote.setAttribute("aria-expanded", "false");

    if (cartDrawerNote.nextElementSibling.getAttribute("id")) {
      cartDrawerNote.setAttribute("aria-controls", cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute("aria-expanded", !event.currentTarget.closest("details").hasAttribute("open"));
    });

    cartDrawerNote.parentElement.addEventListener("keyup", onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.drawer.classList.contains("is-empty") && this.drawer.classList.remove("is-empty");
    this.productId = parsedState.id;
    // BUG WORKAROUND FOR SHOPIFY CLI
    // cart/add does not return sections via dev server
    // if sections are null, fall back on Section Rendering API
    // https://github.com/Shopify/shopify-cli/issues/1797
    if (!parsedState.sections) {
      fetch(`${window.Shopify.routes.root}?sections=${this.getSectionsToRender().map((section) => section.id)}`)
        .then((response) => response.json())
        .then((response) => {
          parsedState.sections = response;

          this.getSectionsToRender().forEach((section) => {
            const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
            sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
          });

          setTimeout(() => {
            this.querySelector(".cart-scrim").addEventListener("click", this.close.bind(this));
            this.open();
          });

          Catch.refresh();
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      this.getSectionsToRender().forEach((section) => {
        const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
        sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      });

      setTimeout(() => {
        this.querySelector(".cart-scrim").addEventListener("click", this.close.bind(this));
        this.open();
      });

      Catch.refresh();
    }
  }

  addFreeGift(product) {
    const body = JSON.stringify({ items: [{ id: product, quantity: 1 }] });
    fetch(`${routes.cart_add_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.json())
      .then((response) => this.renderContents(response))
      .catch((error) => console.error(error));
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: "cart-drawer",
        selector: "#CartDrawer",
      },
      {
        id: "cart-icon-bubble",
      },
      {
        id: "announcement-bar",
        selector: "#AnnouncementBar",
      },
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
      {
        id: "CartDrawer",
        section: "cart-drawer",
        selector: ".cart-drawer",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "shopify-section-announcement-bar",
        section: "announcement-bar",
        selector: ".shopify-section",
      },
    ];
  }
}

customElements.define("cart-drawer-items", CartDrawerItems);
