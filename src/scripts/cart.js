import { debounce, fetchConfig, trapFocus } from "./utils.js";

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

export class CartItems extends HTMLElement {
  constructor() {
    super();

    this.cart = document.querySelector("cart-drawer");

    this.lineItemStatusElement =
      document.getElementById("shopping-cart-line-item-status") ||
      document.getElementById("CartDrawer-LineItemStatus");

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]')).reduce(
      (total, quantityInput) => total + parseInt(quantityInput.value),
      0
    );

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener("change", this.debouncedOnChange.bind(this));

    // Add event listener for customer login and run handleGiftWithPurchase
    document.addEventListener("rivo-accounts:shopify:login", this.onCustomerLogin.bind(this));

    // Add check for cart page and run handleGiftWithPurchase
    if (window.location.pathname === "/cart") {
      fetch(window.Shopify.routes.root + "cart.js")
        .then((response) => response.json())
        .then((cartState) => {
          console.log("running handleGiftWithPurchase");
          this.handleGiftWithPurchase(cartState);
        });
    }
  }

  onChange(event) {
    this.updateCartItem(
      event.target.dataset.index,
      event.target.value,
      event.target.getAttribute("name"),
      event.target
    );
  }

  updateCatchCalloutPrice(price) {
    const callout = document.querySelector("#catch-callout-cart");

    if (callout && price) {
      callout.setAttribute("price", price);
    }
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
      {
        id: "shopify-section-announcement-bar",
        section: "announcement-bar",
        selector: ".shopify-section",
      },
    ];
  }

  handleGiftWithPurchase(parsedState) {
    const isLoggedIn = window.customerLoggedIn;
    const { enabled } = window.gwpSettings;
    if (!enabled) return;

    const { loyaltyOnly, productQualifierEnabled, productQualifierId, tiers, type } =
      window.gwpSettings;

    // Use cart state to get current product IDs
    const cartIdArray = parsedState.items.map((item) => item.product_id);

    // Loyalty check (early return only if GWP is restricted and user is not logged in)
    if (loyaltyOnly && !isLoggedIn) return;

    // Don’t exit if qualifier is missing — just track it
    const qualifierMissing =
      productQualifierEnabled && !cartIdArray.includes(parseInt(productQualifierId));

    let giftsToAdd = [];
    let giftsToRemove = [];

    tiers.forEach((tier) => {
      if (!tier.product) return;

      const tierProductInt = parseInt(tier.product);

      // REMOVE logic: if gift is in cart AND (below threshold OR qualifier missing)
      const shouldRemoveGift =
        cartIdArray.includes(tierProductInt) &&
        (parsedState.total_price < tier.threshold || qualifierMissing);

      if (shouldRemoveGift) {
        const line = cartIdArray.findIndex((i) => i === tierProductInt) + 1;
        giftsToRemove.push(line);
      }

      // ADD logic: only run if qualifier is NOT missing
      if (!qualifierMissing) {
        if (
          type === "auto" &&
          !cartIdArray.includes(tierProductInt) &&
          parsedState.total_price >= tier.threshold
        ) {
          giftsToAdd.push(tier.variant);
        }

        // URL-type logic (still gated by qualifier)
        if (type === "url" && localStorage.getItem("osea.gwpUrlVariantId") === tier.variant) {
          document.querySelector("gift-with-purchase-url")?.checkGiftQualifiers();
        }
      }
    });

    // Remove gifts if needed
    if (giftsToRemove.length > 0) {
      giftsToRemove.sort((a, b) => b - a);

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      giftsToRemove.reduce((promise, line) => {
        return promise.then(() => this.removeGift(line)).then(() => delay(400));
      }, Promise.resolve());
    }

    // Add gifts if qualified
    if (giftsToAdd.length > 0) {
      this.cart.addFreeGift(giftsToAdd);
    }
  }

  onCustomerLogin() {
    // Set window object to logged in status
    window.customerLoggedIn = true;

    fetch(window.Shopify.routes.root + "cart.js")
      .then((response) => response.json())
      .then((cartState) => {
        this.handleGiftWithPurchase(cartState);
      });
  }

  updateCartItem(line, value, name, target) {
    /* Handle subscription quantity limit */
    const lineItemSubscription = document.getElementById(`CartSubscribeCheckbox-${line}`);
    if (lineItemSubscription && lineItemSubscription.checked && name === "updates[]" && value > 4) {
      const quantityElement =
        document.getElementById(`Quantity-${line}`) ||
        document.getElementById(`Drawer-quantity-${line}`);
      const errors =
        document.getElementById("cart-errors") || document.getElementById("CartDrawer-CartErrors");

      quantityElement.value = 4;
      errors.textContent = "You may not subscribe to more than 4 of this product.";
      setTimeout(() => (errors.textContent = ""), 5000);

      return;
    }

    this.enableLoading(line);
    if (window.gwpSettings.enabled && window.gwpSettings.type === "banner") {
      document.getElementById("GwpButton")?.remove();
    }

    let selling_plan = null;
    let properties = null;

    if (name === "subscribe") {
      if (target.checked) {
        selling_plan = target.dataset.default;
        properties = { _is_subscription: "true" };
      } else {
        properties = { _is_subscription: "false" };
      }
    } else if (name === "selling_plan") {
      selling_plan = value;
    }

    const body = JSON.stringify({
      line,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
      ...(!["subscribe", "selling_plan"].includes(name) && { quantity: value }),
      ...(["subscribe", "selling_plan"].includes(name) && { selling_plan }),
      ...(properties && { properties }),
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.text())
      .then((state) => {
        const parsedState = JSON.parse(state);

        // if the only items in the cart are samples
        if (parsedState?.items?.filter((i) => i.product_type !== "Sample").length === 0) {
          this.cart.clearCart();
        }

        this.handleGiftWithPurchase(parsedState);

        this.updateCatchCalloutPrice(parsedState.total_price);

        this.classList.toggle("is-empty", parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector("cart-drawer");
        const cartFooter = document.getElementById("main-cart-footer");

        if (cartFooter) cartFooter.classList.toggle("is-empty", parsedState.item_count === 0);
        if (cartDrawerWrapper)
          cartDrawerWrapper.classList.toggle("is-empty", parsedState.item_count === 0);

        this.replaceSections(parsedState);
        this.updateLiveRegions(line, parsedState.item_count);

        const lineItem =
          document.getElementById(`CartItem-${line}`) ||
          document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(
            cartDrawerWrapper.querySelector(".cart-empty"),
            cartDrawerWrapper.querySelector("a")
          );
        } else if (document.querySelector(".cart-item") && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector(".cart-item__name"));
        }
        this.disableLoading();
      })
      .catch((error) => {
        console.error(error);
        this.querySelectorAll(".loading-spinner").forEach((overlay) =>
          overlay.classList.add("hidden")
        );
        const errors =
          document.getElementById("cart-errors") ||
          document.getElementById("CartDrawer-CartErrors");
        if (errors) {
          errors.textContent = window.cartStrings.error;
        }
        this.disableLoading();
      });
  }

  replaceSections(parsedState) {
    // BUG WORKAROUND FOR SHOPIFY CLI
    // cart/add does not return sections via dev server
    // if sections are null, fall back on Section Rendering API
    // https://github.com/Shopify/shopify-cli/issues/1797
    if (!parsedState.sections) {
      fetch(
        `${window.Shopify.routes.root}?sections=${this.getSectionsToRender().map(
          (section) => section.section
        )}`
      )
        .then((response) => response.json())
        .then((response) => {
          parsedState.sections = response;

          this.getSectionsToRender().forEach((section) => {
            const elementToReplace =
              document.getElementById(section.id).querySelector(section.selector) ||
              document.getElementById(section.id);
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector
            );
          });
        })
        .catch((error) => console.error(error));
    } else {
      this.getSectionsToRender().forEach((section) => {
        const elementToReplace =
          document.getElementById(section.id).querySelector(section.selector) ||
          document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(
          parsedState.sections[section.section],
          section.selector
        );
      });
    }

    bootstrapCartProductsSection();
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
      const lineItemError =
        document.getElementById(`Line-item-error-${line}`) ||
        document.getElementById(`CartDrawer-LineItemError-${line}`);
      const quantityElement =
        document.getElementById(`Quantity-${line}`) ||
        document.getElementById(`Drawer-quantity-${line}`);

      if (!quantityElement) {
        return;
      }
      lineItemError.querySelector(".cart-item__error-text").innerHTML =
        window.cartStrings.quantityError.replace("[quantity]", quantityElement.value);
    }

    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute("aria-hidden", true);

    const cartStatus =
      document.getElementById("cart-live-region-text") ||
      document.getElementById("CartDrawer-LiveRegionText");
    if (cartStatus) {
      cartStatus.setAttribute("aria-hidden", false);

      setTimeout(() => {
        cartStatus.setAttribute("aria-hidden", true);
      }, 1000);
    }
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("pointer-events-none");

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-spinner`);
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading-spinner`
    );

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
      overlay.classList.remove("hidden")
    );

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading() {
    const mainCartItems =
      document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems && mainCartItems.classList.remove("pointer-events-none");
  }
}
customElements.define("cart-items", CartItems);

class RewardCountdown extends HTMLElement {
  constructor() {
    super();

    this.totalEl = document.getElementById("CartDrawer-Total");
    this.total = this.totalEl ? parseFloat(this.totalEl.dataset.total) : 0;

    // Get thresholds from data attributes and convert to numbers
    if (this.dataset.subscriptionsInCart.length > 0) {
      this.shippingThreshold = 0;
    } else {
      this.shippingThreshold = this.stringToInt(this.dataset.shippingThreshold);
    }
    this.tier1Threshold = this.stringToInt(this.dataset.tier1Threshold);
    this.tier2Threshold = this.stringToInt(this.dataset.tier2Threshold);
    this.tier3Threshold = this.stringToInt(this.dataset.tier3Threshold);

    const hasTier1Product = this.dataset.hasTier1Product === "true";
    const hasTier2Product = this.dataset.hasTier2Product === "true";
    const hasTier3Product = this.dataset.hasTier3Product === "true";
    const isGwpActive = this.dataset.isGwpActive === "true";
    const isLoyaltyOnly = this.dataset.isLoyaltyOnly === "true";

    // Create an array of active thresholds
    this.thresholds = [this.shippingThreshold];
    if (
      (isGwpActive && !isLoyaltyOnly) ||
      (isGwpActive && isLoyaltyOnly && window.customerLoggedIn)
    ) {
      if (this.tier1Threshold && hasTier1Product) this.thresholds.push(this.tier1Threshold);
      if (this.tier2Threshold && hasTier2Product) this.thresholds.push(this.tier2Threshold);
      if (this.tier3Threshold && hasTier3Product) this.thresholds.push(this.tier3Threshold);
    }

    this.progressBar = this.querySelector("progress");
    this.updateProgress();
  }

  stringToInt(string) {
    return string ? parseFloat(string) * 100 : null;
  }

  updateProgress() {
    let progressPercent = 0;

    for (let i = 0; i < this.thresholds.length; i++) {
      const currentThreshold = this.thresholds[i];
      const previousThreshold = i === 0 ? 0 : this.thresholds[i - 1];

      if (this.total >= currentThreshold) {
        // If the total is above the current threshold, set progress to the next level
        progressPercent = ((i + 1) / this.thresholds.length) * 100;
      } else if (this.total > previousThreshold && this.total < currentThreshold) {
        // Calculate progress within the range
        const range = currentThreshold - previousThreshold;
        const withinRange = this.total - previousThreshold;
        progressPercent =
          (i / this.thresholds.length) * 100 +
          (withinRange / range) * (100 / this.thresholds.length);
        break;
      }
    }

    // Cap the progress between 0 and 100
    progressPercent = Math.min(100, Math.max(0, progressPercent));

    // Update the progress bar
    this.progressBar.value = progressPercent;
    this.progressBar.innerText = `${Math.round(progressPercent)}%`;
  }
}
customElements.define("reward-countdown", RewardCountdown);

class CartRecommendations extends HTMLElement {
  constructor() {
    super();

    this.filteredIdArray = JSON.parse(this.dataset.ids);
    this.destination = this.querySelector(".cart-recommendations");

    if (this.filteredIdArray.length > 0) {
      this.getRecommendations(this.filteredIdArray[0]);
    }
  }

  getRecommendations(productId) {
    fetch(
      window.Shopify.routes.root +
        `recommendations/products?product_id=${productId}&limit=6&section_id=cart-recommendations`
    )
      .then((response) => response.text())
      .then((text) => (this.destination.innerHTML = text));
  }
}
customElements.define("cart-recommendations", CartRecommendations);

class SaveWithSets extends HTMLElement {
  constructor() {
    super();

    this.cart = document.querySelector("cart-drawer");
    this.lineItemStatusElement =
      document.getElementById("shopping-cart-line-item-status") ||
      document.getElementById("CartDrawer-LineItemStatus");
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
    const mainCartItems =
      document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("pointer-events-none");

    const cartItemElements = this.cart.querySelectorAll(`#CartItem-${line} .loading-spinner`);
    const cartDrawerItemElements = this.cart.querySelectorAll(
      `#CartDrawer-Item-${line} .loading-spinner`
    );

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
      overlay.classList.remove("hidden")
    );

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading() {
    const mainCartItems =
      document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.remove("pointer-events-none");
  }
}
customElements.define("save-with-sets", SaveWithSets);

class PrintedGiftNote extends HTMLElement {
  constructor() {
    super();

    this.messageTextarea = this.querySelector("#PrintedGiftNote-Message");
    this.errorMessageEl = this.querySelector("#PrintedGiftNote-Error");
    this.errorMessageText = this.querySelector("#PrintedGiftNote-ErrorText");
    this.confirmMessage = this.querySelector("#PrintedGiftNote-Confirm");
    this.noteEnabledCheckbox = this.querySelector("#PrintedGiftNote-Enable");
    this.checkoutButton = document.querySelector("#CartDrawer-Checkout");

    this.messageTextarea.addEventListener(
      "keydown",
      debounce((event) => {
        this.updateGiftMessage(event.target.value);
      }, 1000)
    );
    this.noteEnabledCheckbox.addEventListener("change", this.handleCheckboxChange.bind(this));
    this.checkoutButton.addEventListener("click", this.handleCheckoutClick.bind(this));
  }

  connectedCallback() {
    this.getGiftMessage();
  }

  validateInput(string) {
    if (!string) return false;
    const regEx = RegExp(/^[\s0-9a-zA-Z.,?!]*$/g);
    return !string.match(regEx);
  }

  getCartContents() {
    return fetch(window.Shopify.routes.root + "cart.js")
      .then((response) => response.json())
      .then((data) => {
        return data;
      });
  }

  updateCart(giftEnabled, giftMessage) {
    const body = JSON.stringify({
      attributes: {
        giftEnabled,
        giftMessage,
      },
    });
    fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
  }

  getGiftMessage() {
    this.getCartContents().then((cart) => {
      const { giftEnabled, giftMessage } = cart.attributes;

      if (giftEnabled) this.noteEnabledCheckbox.checked = giftEnabled === "true";
      if (giftMessage) this.messageTextarea.value = giftMessage;
    });
  }

  updateGiftMessage(value) {
    this.confirmMessage.classList.add("hidden");
    this.errorMessageEl.classList.add("hidden");

    if (this.noteEnabledCheckbox.checked && value !== "") {
      if (this.validateInput(value)) {
        this.errorMessageText.innerText = "Alphanumeric characters only";
        this.errorMessageEl.classList.remove("hidden");
      } else {
        this.confirmMessage.classList.remove("hidden");
        setTimeout(() => this.confirmMessage.classList.add("hidden"), 3000);

        this.updateCart(true, value);
      }
    }
    if (this.noteEnabledCheckbox.checked && value === "") {
      this.errorMessageText.innerText = "Message cannot be blank";
      this.errorMessageEl.classList.remove("hidden");

      this.updateCart(false, null);
    }
    if (!this.noteEnabledCheckbox.checked) {
      this.updateCart(false, null);
    }
  }

  handleCheckboxChange(event) {
    if (!event.target.checked) {
      this.updateCart(false, null);
    }
  }

  handleCheckoutClick(event) {
    event.preventDefault();

    this.getCartContents().then((cart) => {
      const { giftEnabled, giftMessage } = cart.attributes;

      if (giftEnabled && giftMessage != null) {
        const noteProductData = { id: 41526301163703, quantity: 1 };

        fetch("/cart/add.js", {
          body: JSON.stringify(noteProductData),
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          method: "POST",
        })
          .then((response) => response.json())
          .then((data) => (window.location = "/checkout"))
          .catch((error) => console.error(error));
      } else {
        window.location = "/checkout";
      }
    });
  }
}
customElements.define("printed-gift-note", PrintedGiftNote);

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
if (!customElements.get("cart-note")) {
  customElements.define("cart-note", CartNote);
}
