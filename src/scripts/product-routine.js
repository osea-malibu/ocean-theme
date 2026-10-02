/*
 * <product-routine> — Complete Your Routine section.
 *
 * Per-card ATC, variant selection and button prices are owned by the existing
 * <product-form> / <variant-radios> components rendered inside card-product.
 * This class only runs the bundle bar: it re-sums the total from each card's
 * live variant selection (change events bubble up from the radios) and adds
 * every eligible step in one /cart/add.js call.
 */
if (!customElements.get("product-routine")) {
  class ProductRoutine extends HTMLElement {
    connectedCallback() {
      this.bundle = this.querySelector("[data-routine-bundle]");
      if (!this.bundle) return;

      this.addButton = this.bundle.querySelector("[data-bundle-add]");
      this.addButtonLabel = this.addButton.textContent.trim();
      this.addButton.addEventListener("click", () => this.addBundle());

      // Variant radio/select changes bubble up from the cards.
      this.addEventListener("change", () => this.updateBundle());
      this.updateBundle();
    }

    /* Cards the bundle can add: not the current product, and currently purchasable. */
    eligibleCards() {
      return Array.from(
        this.querySelectorAll("li[data-routine-step]:not([data-current-product])")
      ).filter((card) => {
        const addButton = card.querySelector('button[name="add"]');
        return addButton && !addButton.disabled && card.querySelector('form input[name="id"]');
      });
    }

    selectedVariant(card) {
      const id = parseInt(card.querySelector('form input[name="id"]').value, 10);
      let variants = [];
      try {
        variants = JSON.parse(card.querySelector("[data-step-variants]").textContent);
      } catch (error) {
        // No price map rendered — leave the server-rendered totals alone.
      }
      return variants.find((variant) => variant.id === id) || { id, price: null };
    }

    updateBundle() {
      const cards = this.eligibleCards();
      this.addButton.disabled = cards.length < 2;

      let total = 0;
      let compare = 0;
      for (const card of cards) {
        const variant = this.selectedVariant(card);
        if (variant.price == null) return;
        total += variant.price;
        compare += Math.max(variant.compare_at_price || 0, variant.price);
      }

      this.bundle.querySelector("[data-bundle-total]").textContent = this.formatMoney(total);
      const compareEl = this.bundle.querySelector("[data-bundle-compare]");
      compareEl.textContent = this.formatMoney(compare);
      compareEl.hidden = compare <= total;
    }

    formatMoney(cents) {
      const currency = window.Shopify?.currency?.active || "USD";
      return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
      });
    }

    handleError(message = "") {
      const errorEl = this.bundle.querySelector("[data-bundle-error]");
      errorEl.textContent = message;
      errorEl.classList.toggle("hidden", !message);
    }

    async addBundle() {
      const items = this.eligibleCards().map((card) => ({
        id: parseInt(card.querySelector('form input[name="id"]').value, 10),
        quantity: 1,
      }));
      if (items.length < 2) return;

      this.handleError();
      this.addButton.disabled = true;
      this.addButton.textContent = "Adding…";

      try {
        const cartDrawer = document.querySelector("cart-drawer");
        const sections =
          cartDrawer
            ?.getSectionsToRender?.()
            .map((section) => section.id)
            .join(",") ?? "cart-drawer";

        const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ items, sections }),
        });
        const data = await response.json();

        if (data.status) throw new Error(data.description || "Cart add failed");

        if (cartDrawer) {
          cartDrawer.classList.remove("is-empty");
          cartDrawer.renderContents(data, this.addButton);
        } else {
          window.location = window.routes?.cart_url ?? "/cart";
        }
      } catch (error) {
        console.error("[ProductRoutine] addBundle error:", error);
        this.handleError("Something went wrong — add the products individually above");
      } finally {
        this.addButton.textContent = this.addButtonLabel;
        this.updateBundle();
      }
    }
  }

  customElements.define("product-routine", ProductRoutine);
}
