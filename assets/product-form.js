if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") || document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");
      }

      getCartContents() {
        return fetch(window.Shopify.routes.root + "cart.js")
          .then((response) => response.json())
          .then((data) => {
            return data;
          });
      }

      addProductToCart() {
        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("opacity-50");
        this.querySelector(".loading-spinner")?.classList.remove("hidden");

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        if (this.dataset.cartType != "page") {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            this.error = false;
            this.cart.renderContents(response);

            const isLoggedIn = window.customerLoggedIn;
            const { enabled, loyaltyOnly } = window.gwpSettings;

            if (enabled && (!loyaltyOnly || (loyaltyOnly && isLoggedIn))) {
              if (window.gwpSettings.type === "auto") {
                let giftsToAdd = [];
                const fetchPromises = window.gwpSettings.tiers.map((tier) => {
                  if (tier.product !== "") {
                    return fetch(window.Shopify.routes.root + "cart.js")
                      .then((response) => response.json())
                      .then((data) => {
                        const cartIdArray = data.items.map((i) => i.id);
                        if (
                          !cartIdArray.includes(parseInt(tier.variant)) &&
                          data.total_price >= tier.threshold
                        ) {
                          giftsToAdd = [...giftsToAdd, tier.variant];
                        }
                      })
                      .catch((e) => {
                        console.error(e);
                      });
                  }
                });

                // Wait for all fetch promises to complete
                Promise.all(fetchPromises).then(() => {
                  this.cart.addFreeGift(giftsToAdd);
                });
              } else if (
                window.gwpSettings.type === "url" &&
                localStorage.getItem("osea.gwpUrlVariantId") === window.gwpSettings.tiers[2].variant
              ) {
                document.querySelector("gift-with-purchase-url").checkGiftQualifiers();
              }
            }
          })
          .catch((e) => console.error(e))
          .finally(() => {
            this.submitButton.classList.remove("opacity-50");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("aria-disabled");
            this.querySelector(".loading-spinner")?.classList.add("hidden");
          });
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        this.handleErrorMessage();

        const purchaseOptionInput = this.form.querySelector(
          '[name="properties[_is_subscription]"]'
        );
        if (purchaseOptionInput && purchaseOptionInput.value == "true") {
          this.getCartContents().then((cartContents) => {
            const filteredData = cartContents.items.filter(
              (i) =>
                i.properties._is_subscription === "true" &&
                i.id === parseInt(this.form.querySelector("[name=id]").value) &&
                i.quantity >= 4
            );

            if (filteredData.length > 0) {
              this.handleErrorMessage("You may not subscribe to more than 4 of this product.");
              return;
            } else {
              this.addProductToCart();
            }
          });
        } else {
          this.addProductToCart();
        }
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;

        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(".product-form__error-message");

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}
