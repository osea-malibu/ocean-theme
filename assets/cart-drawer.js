class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.overlay = this.querySelector(".cart-scrim");
    this.drawer = this.querySelector(".cart-drawer");

    this.addEventListener("keyup", (evt) => evt.code === "Escape" && this.close());
    this.overlay.addEventListener("click", this.close.bind(this));
    this.setHeaderCartIconAccessibility();
    this.attachEventListeners();
  }

  attachEventListeners() {
    document.addEventListener("loopByobAddToCartSuccessEvent", (e) => {
      console.log("Add to cart on byob ");

      // console.log(window.Shopify.routes.root)
      fetch("https://oseamalibu.com/cart.js")
        .then((response) => response.json())
        .then((response) => {
          console.log("response", response);
          if (response.status) {
            console.log("error", response.status);
          } else if (!response) {
            window.location = window.routes.cart_url;
            return;
          }
          // console.log("start render contents");
          this.renderContents(response);
        })
        .catch((e) => console.error(e));
      // this.open(e);
    });
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
    if (cartDrawerNote && !cartDrawerNote.hasAttribute("role"))
      this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.remove("invisible");
      this.classList.add("active");

      bootstrapCartProductsSection();
    });

    this.addEventListener(
      "transitionend",
      () => {
        const containerToTrapFocusOn = this.classList.contains("is-empty")
          ? this.querySelector(".cart-empty")
          : document.getElementById("CartDrawer");
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

    const elements = document.querySelectorAll(".cart-items #bud");
    console.log(elements);
    // Iterate over each selected element and remove it from the DOM
    elements.forEach((element) => element.remove());
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button");
    cartDrawerNote.setAttribute("aria-expanded", "false");

    if (cartDrawerNote.nextElementSibling.getAttribute("id")) {
      cartDrawerNote.setAttribute("aria-controls", cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute(
        "aria-expanded",
        !event.currentTarget.closest("details").hasAttribute("open")
      );
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
      fetch(
        `${window.Shopify.routes.root}?sections=${this.getSectionsToRender().map(
          (section) => section.id
        )}`
      )
        .then((response) => response.json())
        .then((response) => {
          parsedState.sections = response;

          this.getSectionsToRender().forEach((section) => {
            const sectionElement = section.selector
              ? document.querySelector(section.selector)
              : document.getElementById(section.id);
            sectionElement.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.id],
              section.selector
            );
          });

          setTimeout(() => {
            this.querySelector(".cart-scrim").addEventListener("click", this.close.bind(this));
            this.open();
          });
        })
        .catch((error) => console.error(error));
    } else {
      this.getSectionsToRender().forEach((section) => {
        const sectionElement = section.selector
          ? document.querySelector(section.selector)
          : document.getElementById(section.id);
        sectionElement.innerHTML = this.getSectionInnerHTML(
          parsedState.sections[section.id],
          section.selector
        );
      });

      setTimeout(() => {
        this.querySelector(".cart-scrim").addEventListener("click", this.close.bind(this));
        this.open();
      });
    }
  }

  addFreeGift(product) {
    const body = JSON.stringify({ items: [{ id: product, quantity: 1 }] });
    fetch(`${routes.cart_add_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.json())
      .then((response) => this.renderContents(response))
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
        selector: "#cart-icon-bubble",
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
