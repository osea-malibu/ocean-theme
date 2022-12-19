class BundleBuilder extends HTMLElement {
  constructor() {
    super();

    this.cart = document.querySelector("cart-notification") || document.querySelector("cart-drawer");

    this.querySelectorAll(".byob-modal").forEach((i) => i.addEventListener("click", this.handleModalOpen.bind(this)));
    this.querySelectorAll(".byob-add-to-bundle").forEach((i) => i.addEventListener("click", this.handleAddToBundle.bind(this)));
    this.querySelector(".byob-add-to-cart").addEventListener("click", this.handleAddToCart.bind(this));
  }

  connectedCallback() {
    const faceProductId = localStorage.getItem("osea.byobFaceProductId");
    const bodyProductId = localStorage.getItem("osea.byobBodyProductId");

    if (faceProductId) {
      this.querySelector(`#Input-${faceProductId}`).checked = true;
    }
    if (bodyProductId) {
      this.querySelector(`#Input-${bodyProductId}`).checked = true;
    }

    this.renderElements();
  }

  getPriceHtml(totalPrice, saleClass) {
    return `<div class="flex-row">
			<span class="sr-only">Regular price</span>
			<span>
				<s class="${saleClass}">$${totalPrice / 100}</s>
			</span>
			<span class="sr-only">Sale price</span>
			<span>$${((totalPrice * 0.8) / 100).toFixed(2)}</span>
		</div>`;
  }

  renderElements() {
    const faceProductId = localStorage.getItem("osea.byobFaceProductId");
    const bodyProductId = localStorage.getItem("osea.byobBodyProductId");
    const byobBarCount = this.querySelector("#ByobBar .count");
    const byobBarCost = this.querySelector("#ByobBar .cost");
    const byobBuyButton = this.querySelector(".byob-add-to-cart");
    const byobButtonCost = this.querySelector(".byob-add-to-cart .cost");

    if (faceProductId && bodyProductId) {
      const facePrice = parseInt(this.querySelector(`#Input-${faceProductId}`).dataset.price);
      const bodyPrice = parseInt(this.querySelector(`#Input-${bodyProductId}`).dataset.price);
      const totalPrice = facePrice + bodyPrice;

      byobBarCount.innerText = "2/2";
      byobBarCost.innerHTML = this.getPriceHtml(totalPrice, "text-wave-600");

      byobBuyButton.removeAttribute("disabled");
      byobButtonCost.innerHTML = this.getPriceHtml(totalPrice, "text-wave-500");
    } else if (faceProductId && !bodyProductId) {
      const facePrice = parseInt(this.querySelector(`#Input-${faceProductId}`).dataset.price);

      byobBarCount.innerText = "1/2";
      byobBarCost.innerHTML = this.getPriceHtml(facePrice, "text-wave-600");

      byobBuyButton.setAttribute("disabled", true);
      byobButtonCost.innerHTML = this.getPriceHtml(facePrice, "text-seaweed-400");
    } else if (!faceProductId && bodyProductId) {
      const bodyPrice = parseInt(this.querySelector(`#Input-${bodyProductId}`).dataset.price);

      byobBarCount.innerText = "1/2";
      byobBarCost.innerHTML = this.getPriceHtml(bodyPrice, "text-wave-600");

      byobBuyButton.setAttribute("disabled", true);
      byobButtonCost.innerHTML = this.getPriceHtml(bodyPrice, "text-seaweed-400");
    } else {
      byobBarCount.innerText = "0/2";

      byobBuyButton.setAttribute("disabled", true);
      byobButtonCost.innerText = "$0";
    }
  }

  handleModalOpen(e) {
    e.preventDefault();
    const { variantId } = e.currentTarget.closest(".bundle-card").dataset;
    console.log(variantId);
  }

  handleAddToBundle(e) {
    const { variantId } = e.currentTarget.closest(".bundle-card").dataset;
    const { name } = e.currentTarget.dataset;

    if (name === "byob-face") {
      localStorage.setItem("osea.byobFaceProductId", variantId);
    }
    if (name === "byob-body") {
      localStorage.setItem("osea.byobBodyProductId", variantId);
    }

    this.renderElements();
  }

  handleAddToCart() {
    console.log("add to cart");
    /* this.submitButton.setAttribute("aria-disabled", true);
    this.submitButton.classList.add("opacity-50");
    this.querySelector(".loading-overlay__spinner")?.classList.remove("hidden"); */

    const faceProductId = localStorage.getItem("osea.byobFaceProductId");
    const bodyProductId = localStorage.getItem("osea.byobBodyProductId");
    const bundleId = `${faceProductId}${bodyProductId}`;

    const body = JSON.stringify({
      items: [
        { id: faceProductId, quantity: 1, properties: { _bundle: bundleId } },
        { id: bodyProductId, quantity: 1, properties: { _bundle: bundleId } },
      ],
    });

    fetch(`${routes.cart_add_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.json())
      .then((response) => {
        /* if (response.status) {
          this.handleErrorMessage(response.description);
        } else if (!this.cart) {
          window.location = window.routes.cart_url;
          return;
        }

        this.error = false; */
        this.cart.renderContents(response);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        /* this.submitButton.classList.remove("opacity-50");
        if (this.cart && this.cart.classList.contains("is-empty")) this.cart.classList.remove("is-empty");
        if (!this.error) this.submitButton.removeAttribute("aria-disabled");
        this.querySelector(".loading-overlay__spinner")?.classList.add("hidden"); */
      });
  }
}
customElements.define("bundle-builder", BundleBuilder);
