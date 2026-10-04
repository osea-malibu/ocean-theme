/*
 * <product-routine> — Complete Your Routine section.
 *
 * Per-card ATC, variant selection and button prices are owned by the existing
 * <product-form> / <variant-radios> components rendered inside card-product.
 * This class runs the bundle bar. One rule: the bundle adds every step whose
 * product isn't in the cart yet (any variant counts as covered). The current
 * page's product (the "hero") is priced from the main PDP form's live
 * selection; the other steps from their card forms. Cart membership is
 * server-rendered for first paint and re-checked on cart:updated, so adding
 * any step from anywhere flips the bar's state live: all → rest → last →
 * complete.
 */
if (!customElements.get("product-routine")) {
  const COUNT_WORDS = ["one", "two", "three", "four"];

  class ProductRoutine extends HTMLElement {
    connectedCallback() {
      this.bundle = this.querySelector("[data-routine-bundle]");
      if (!this.bundle) return;

      this.addButton = this.bundle.querySelector("[data-bundle-add]");
      this.headingEl = this.bundle.querySelector("[data-bundle-heading]");
      this.noteEl = this.bundle.querySelector("[data-bundle-note]");
      this.buyEl = this.bundle.querySelector("[data-bundle-buy]");
      this.stepCards = Array.from(this.querySelectorAll("li[data-routine-step][data-product-id]"));
      this.heroCard = this.querySelector("li[data-current-product]");
      this.heroProductId = parseInt(this.heroCard?.dataset.productId, 10) || null;

      this.cartProductIds = new Set(
        this.stepCards
          .filter((card) => card.hasAttribute("data-in-cart"))
          .map((card) => parseInt(card.dataset.productId, 10))
      );

      this.addButton.addEventListener("click", () => this.addBundle());

      // Variant radio/select changes bubble up from the cards.
      this.addEventListener("change", () => this.updateBundle());

      // The main PDP form lives outside this section: re-price on its variant
      // changes. Re-check step membership whenever the cart changes.
      this.onDocumentChange = (event) => {
        if (!this.contains(event.target)) this.updateBundle();
      };
      this.onCartUpdated = () => this.refreshCartState();
      document.addEventListener("change", this.onDocumentChange);
      document.addEventListener("cart:updated", this.onCartUpdated);

      this.updateBundle();
    }

    disconnectedCallback() {
      document.removeEventListener("change", this.onDocumentChange);
      document.removeEventListener("cart:updated", this.onCartUpdated);
    }

    inCart(card) {
      return this.cartProductIds.has(parseInt(card.dataset.productId, 10));
    }

    /* Non-hero cards the bundle can add: missing from the cart and purchasable. */
    eligibleCards() {
      return this.stepCards.filter((card) => {
        if (card === this.heroCard || this.inCart(card)) return false;
        const addButton = card.querySelector('button[name="add"]');
        return addButton && !addButton.disabled && card.querySelector('form input[name="id"]');
      });
    }

    variantFrom(card, id) {
      let variants = [];
      try {
        variants = JSON.parse(card.querySelector("[data-step-variants]").textContent);
      } catch (error) {
        // No price map rendered.
      }
      return variants.find((variant) => variant.id === id) || null;
    }

    selectedVariant(card) {
      const id = parseInt(card.querySelector('form input[name="id"]').value, 10);
      return this.variantFrom(card, id) || { id, price: null };
    }

    /* The main PDP form's live selection for this page's product. */
    heroSelection() {
      if (!this.heroCard || this.inCart(this.heroCard)) return null;
      const mainAdd = document.querySelector('.pdp-product-form button[name="add"]');
      const mainId = document.querySelector('.pdp-product-form form input[name="id"]');
      if (!mainId || (mainAdd && mainAdd.disabled)) return null;
      const id = parseInt(mainId.value, 10);
      if (!id) return null;
      return this.variantFrom(this.heroCard, id) || { id, price: null };
    }

    updateBundle() {
      const cards = this.eligibleCards();
      const hero = this.heroSelection();
      const remaining = cards.length + (hero ? 1 : 0);
      const inCartCount = this.stepCards.filter((card) => this.inCart(card)).length;
      const complete = inCartCount === this.stepCards.length && this.stepCards.length > 0;

      this.syncState({ remaining, inCartCount, complete });
      this.addButton.disabled = remaining < 1;
      if (complete) return;

      let total = 0;
      let compare = 0;
      for (const card of cards) {
        const variant = this.selectedVariant(card);
        if (variant.price == null) return;
        total += variant.price;
        compare += Math.max(variant.compare_at_price || 0, variant.price);
      }
      if (hero) {
        if (hero.price == null) return;
        total += hero.price;
        compare += Math.max(hero.compare_at_price || 0, hero.price);
      }

      this.bundle.querySelector("[data-bundle-total]").textContent = this.formatMoney(total);
      const compareEl = this.bundle.querySelector("[data-bundle-compare]");
      compareEl.textContent = this.formatMoney(compare);
      compareEl.hidden = compare <= total;
    }

    syncState({ remaining, inCartCount, complete }) {
      const word = COUNT_WORDS[remaining - 1] || String(remaining);

      if (complete) {
        this.headingEl.textContent = this.headingEl.dataset.headingComplete;
        this.noteEl.textContent = this.noteEl.dataset.noteComplete;
        this.buyEl.hidden = true;
      } else {
        this.headingEl.textContent = this.headingEl.dataset.headingDefault;
        this.buyEl.hidden = false;
        if (inCartCount === 0) {
          this.noteEl.textContent = this.noteEl.dataset.noteAll.replace("{count}", word);
          this.addButton.textContent = this.addButton.dataset.ctaAll.replace("{count}", word);
        } else if (remaining === 1) {
          this.noteEl.textContent = this.noteEl.dataset.noteLast;
          this.addButton.textContent = this.addButton.dataset.ctaLast;
        } else {
          this.noteEl.textContent = this.noteEl.dataset.notePartial.replace("{count}", word);
          this.addButton.textContent = this.addButton.dataset.ctaPartial;
        }
      }

      const pill = this.heroCard?.querySelector("[data-current-pill]");
      if (pill) {
        pill.textContent = this.inCart(this.heroCard)
          ? pill.dataset.textInCart
          : pill.dataset.textDefault;
      }
    }

    refreshCartState() {
      fetch(`${window.Shopify.routes.root}cart.js`)
        .then((response) => response.json())
        .then((cart) => {
          const next = new Set(cart.items.map((item) => item.product_id));
          const changed =
            next.size !== this.cartProductIds.size ||
            [...next].some((id) => !this.cartProductIds.has(id));
          if (!changed) return;
          this.cartProductIds = next;
          this.stepCards.forEach((card) => {
            card.toggleAttribute("data-in-cart", this.inCart(card));
          });
          this.updateBundle();
        })
        .catch((error) => console.error("[ProductRoutine] cart check failed:", error));
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
      const cards = this.eligibleCards();
      const hero = this.heroSelection();
      const items = cards.map((card) => ({
        id: parseInt(card.querySelector('form input[name="id"]').value, 10),
        quantity: 1,
      }));
      if (hero) items.push({ id: hero.id, quantity: 1 });
      if (items.length < 1) return;

      this.handleError();
      const restoreLabel = this.addButton.textContent;
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

        cards.forEach((card) => {
          this.cartProductIds.add(parseInt(card.dataset.productId, 10));
          card.setAttribute("data-in-cart", "");
        });
        if (hero) {
          this.cartProductIds.add(this.heroProductId);
          this.heroCard.setAttribute("data-in-cart", "");
        }

        if (cartDrawer) {
          cartDrawer.classList.remove("is-empty");
          cartDrawer.renderContents(data, this.addButton);
        } else {
          window.location = window.routes?.cart_url ?? "/cart";
        }
      } catch (error) {
        console.error("[ProductRoutine] addBundle error:", error);
        this.handleError("Something went wrong — add the products individually above");
        this.addButton.textContent = restoreLabel;
      } finally {
        this.updateBundle();
      }
    }
  }

  customElements.define("product-routine", ProductRoutine);
}
