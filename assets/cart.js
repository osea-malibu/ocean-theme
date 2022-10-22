class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.button = this.querySelector(".button");

    this.button.addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems = this.closest("cart-items") || this.closest("cart-drawer-items");
      cartItems.updateCartItem(this.dataset.index, 0, event.target.name);
    });
  }
}

customElements.define("cart-remove-button", CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement = document.getElementById("shopping-cart-line-item-status") || document.getElementById("CartDrawer-LineItemStatus");

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]')).reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener("change", this.debouncedOnChange.bind(this));
  }

  onChange(event) {
    this.updateCartItem(event.target.dataset.index, event.target.value, document.activeElement.getAttribute("name"), event.target);
  }

  getSectionsToRender() {
    return [
      {
        id: "main-cart-items",
        section: document.getElementById("main-cart-items").dataset.id,
        selector: ".js-contents",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "cart-live-region-text",
        section: "cart-live-region-text",
        selector: ".shopify-section",
      },
      {
        id: "main-cart-footer",
        section: document.getElementById("main-cart-footer").dataset.id,
        selector: ".js-contents",
      },
    ];
  }

  updateCartItem(line, value, name, target) {
    this.enableLoading(line);
    if (window.gwpSettings.enabled && window.gwpSettings.type === "banner") {
      document.getElementById("GwpButton")?.remove();
    }

    let selling_plan = null;
    if (name === "subscribe" && target.checked) {
      selling_plan = target.dataset.default;
    } else if (name === "selling_plan") {
      selling_plan = value;
    }

    const body = JSON.stringify({
      line,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
      ...(!["subscribe", "selling_plan"].includes(name) && { quantity: value }),
      ...(["subscribe", "selling_plan"].includes(name) && { selling_plan }),
    });
    console.log("body", JSON.parse(body));

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.text())
      .then((state) => {
        const parsedState = JSON.parse(state);

        if (window.gwpSettings.enabled) {
          const cartIdArray = this.dataset.cartIds.slice(1, -1).split(",");
          const { tiers } = window.gwpSettings;

          tiers.forEach((tier) => {
            if (tier.product != "") {
              if (cartIdArray.includes(tier.product) && parsedState.total_price < tier.threshold) {
                const line = cartIdArray.findIndex((i) => i === tier.product) + 1;
                this.removeGift(line);
              }
            }
          });
        }

        this.classList.toggle("is-empty", parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector("cart-drawer");
        const cartFooter = document.getElementById("main-cart-footer");

        if (cartFooter) cartFooter.classList.toggle("is-empty", parsedState.item_count === 0);
        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle("is-empty", parsedState.item_count === 0);

        this.replaceSections(parsedState);
        this.updateLiveRegions(line, parsedState.item_count);

        const lineItem = document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`)) : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper.querySelector(".cart-empty"), cartDrawerWrapper.querySelector("a"));
        } else if (document.querySelector(".cart-item") && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector(".cart-item__name"));
        }
        this.disableLoading();
      })
      .catch((error) => {
        console.error(error);
        this.querySelectorAll(".loading-overlay").forEach((overlay) => overlay.classList.add("hidden"));
        const errors = document.getElementById("cart-errors") || document.getElementById("CartDrawer-CartErrors");
        errors.textContent = window.cartStrings.error;
        this.disableLoading();
      });
  }

  replaceSections(parsedState) {
    // BUG WORKAROUND FOR SHOPIFY CLI
    // cart/add does not return sections via dev server
    // if sections are null, fall back on Section Rendering API
    // https://github.com/Shopify/shopify-cli/issues/1797
    if (!parsedState.sections) {
      fetch(`${window.Shopify.routes.root}?sections=${this.getSectionsToRender().map((section) => section.section)}`)
        .then((response) => response.json())
        .then((response) => {
          parsedState.sections = response;

          this.getSectionsToRender().forEach((section) => {
            const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
            elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
          });
        })
        .catch((error) => console.error(error));
    } else {
      this.getSectionsToRender().forEach((section) => {
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
      });
    }
  }

  removeGift(line) {
    const body = JSON.stringify({
      line,
      quantity: 0,
    });
    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.text())
      .then((state) => {
        const parsedState = JSON.parse(state);
        this.replaceSections(parsedState);
      })
      .catch((error) => console.error(error));
  }

  updateLiveRegions(line, itemCount) {
    if (this.currentItemCount === itemCount) {
      const lineItemError = document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
      const quantityElement = document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);

      if (!quantityElement) {
        return;
      }
      lineItemError.querySelector(".cart-item__error-text").innerHTML = window.cartStrings.quantityError.replace("[quantity]", quantityElement.value);
    }

    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute("aria-hidden", true);

    const cartStatus = document.getElementById("cart-live-region-text") || document.getElementById("CartDrawer-LiveRegionText");
    cartStatus.setAttribute("aria-hidden", false);

    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("pointer-events-none");

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-overlay`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove("hidden"));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading() {
    const mainCartItems = document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.remove("pointer-events-none");
  }
}

customElements.define("cart-items", CartItems);

class ShippingCountdown extends HTMLElement {
  constructor() {
    super();

    this.totalEl = document.getElementById("CartDrawer-Total");
    this.total = this.totalEl ? this.totalEl.dataset.total : 0;
    this.threshold = this.dataset.threshold * 100;

    this.percentComplete = (this.total / this.threshold) * 100;
    if (this.percentComplete > 100) {
      this.percentComplete = 100;
    } else if (this.percentComplete < 0) {
      this.percentComplete = 0;
    }

    this.progressBar = this.querySelector("progress");
    this.progressBar.value = this.percentComplete;
    this.progressBar.innerText = `${this.percentComplete}%`;
  }
}

customElements.define("shipping-countdown", ShippingCountdown);

class CartRecommendations extends HTMLElement {
  constructor() {
    super();

    this.filteredIdArray = JSON.parse(this.dataset.ids);
    this.destination = this.querySelector("#CartDrawer-Recommendations");

    if (this.filteredIdArray.length > 0) {
      this.getRecommendations(this.filteredIdArray[0]);
    }
  }

  getRecommendations(productId) {
    fetch(window.Shopify.routes.root + `recommendations/products?product_id=${productId}&limit=6&section_id=cart-recommendations`)
      .then((response) => response.text())
      .then((text) => (this.destination.innerHTML = text));
  }
}

customElements.define("cart-recommendations", CartRecommendations);

class GiftWithPurchase extends HTMLElement {
  constructor() {
    super();

    this.cart = document.querySelector("cart-notification") || document.querySelector("cart-drawer");
    this.button = this.querySelector("button");
    this.button?.addEventListener("click", this.onButtonClick.bind(this));
  }

  onButtonClick() {
    const body = JSON.stringify({
      items: [
        {
          id: this.button.dataset.id,
          quantity: 1,
        },
      ],
    });
    fetch(`${routes.cart_add_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.json())
      .then((response) => this.cart.renderContents(response))
      .catch((error) => console.error(error));
  }
}

customElements.define("gift-with-purchase", GiftWithPurchase);

class SaveWithSets extends HTMLElement {
  constructor() {
    super();

    this.cart = document.querySelector("cart-notification") || document.querySelector("cart-drawer");
    this.lineItemStatusElement = document.getElementById("shopping-cart-line-item-status") || document.getElementById("CartDrawer-LineItemStatus");
    this.button = this.querySelector("button");
    this.button?.addEventListener("click", this.onButtonClick.bind(this));
  }

  onButtonClick() {
    this.enableLoading(this.dataset.itemToRemove);

    const removeBody = JSON.stringify({
      line: this.dataset.itemToRemove,
      quantity: 0,
    });
    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body: removeBody } })
      .then(() => {
        const addBody = JSON.stringify({
          items: [
            {
              id: this.dataset.itemToAdd,
              quantity: 1,
            },
          ],
        });
        fetch(`${routes.cart_add_url}`, { ...fetchConfig(), ...{ body: addBody } })
          .then((res) => res.json())
          .then((res) => this.cart.renderContents(res))
          .catch((error) => console.error(error));

        this.disableLoading();
      })
      .catch((error) => console.error(error));
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("pointer-events-none");

    const cartItemElements = this.cart.querySelectorAll(`#CartItem-${line} .loading-overlay`);
    const cartDrawerItemElements = this.cart.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove("hidden"));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading() {
    const mainCartItems = document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.remove("pointer-events-none");
  }
}

customElements.define("save-with-sets", SaveWithSets);

if (!customElements.get("cart-note")) {
  customElements.define(
    "cart-note",
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          "change",
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
          }, 300)
        );
      }
    }
  );
}
