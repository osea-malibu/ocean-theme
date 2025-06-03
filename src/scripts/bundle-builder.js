import { fetchConfig } from "./utils.js";

class BundleBuilder extends HTMLElement {
  constructor() {
    super();

    this.cart = document.querySelector("cart-drawer");
    this.panelProducts = this.querySelector("#ByobPanel .products");

    this.querySelectorAll("modal-opener").forEach((i) =>
      i.addEventListener("click", this.handleModalOpen.bind(this))
    );
    this.querySelectorAll(".byob-add-to-bundle").forEach((i) =>
      i.addEventListener("click", this.handleAddToBundle.bind(this))
    );
    this.querySelectorAll(".byob-add-to-cart").forEach((i) =>
      i.addEventListener("click", this.handleAddToCart.bind(this))
    );
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

  getPanelProductHtml(productId, type) {
    const image = this.querySelector(`[data-variant-id="${productId}"] img`);
    const info = this.querySelector(`[data-variant-id="${productId}"] .info`).innerHTML;
    const price = this.querySelector(`[data-variant-id="${productId}"] .price`).innerHTML;

    const html = `<div class="flex gap-4 py-4 border-b border-white first-of-type:pt-8">
			<img
				srcset="${image.getAttribute("srcset")}"
				srcset="${image.getAttribute("src")}"
				alt=""
				loading="lazy"
				width="{{ product.featured_media.width }}"
				height="{{ product.featured_media.height }}"
				class="block bg-white w-16"
			>
			<div>${info}</div>
			<div class="ml-auto flex flex-col items-end">
				<div class="whitespace-nowrap font-medium">${price}</div>
				<button class="link font-book tracking-wide text-sm" onclick="this.closest('bundle-builder').handleRemove('${productId}', '${type}')">Remove</button>
			</div>
		</div>`;

    return html;
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

  getRemainingHtml(faceProduct, bodyProduct) {
    if (faceProduct && bodyProduct) {
      return '<p class="text-lg lg:hidden whitespace-nowrap"><b>2/2</b><span class="hidden xs:inline"> products</span> selected</p><p class="sr-only">Your bundle is complete!</p>';
    } else {
      return `<p class="text-lg lg:text-2xl whitespace-nowrap"><b>${
        !faceProduct && !bodyProduct ? 0 : 1
      }/2</b> products selected</p>
			<p class="hidden lg:block mt-3 leading-5 lg:max-w-sm lg:mx-auto${
        !faceProduct && !bodyProduct ? " mb-12" : ""
      }">
				<span class="font-system-sans font-medium">←</span> Add ${faceProduct ? "" : "<b>one face</b>"}${
        !faceProduct && !bodyProduct ? " and " : " "
      }${bodyProduct ? "" : "<b>one body</b>"} product to complete your bundle
			</p>`;
    }
  }

  renderElements() {
    const faceProductId = localStorage.getItem("osea.byobFaceProductId");
    const bodyProductId = localStorage.getItem("osea.byobBodyProductId");
    const byobBarRemaining = this.querySelector("#ByobBar .remaining");
    const byobBarBuyButton = this.querySelector("#ByobBar .byob-add-to-cart");
    const byobBarTotalCost = this.querySelector("#ByobBar .total-cost");
    const byobBuyButtons = this.querySelectorAll(".byob-add-to-cart");
    const byobTotalCosts = this.querySelectorAll(".total-cost");

    if (faceProductId && bodyProductId) {
      const facePrice = parseInt(
        this.querySelector(`[data-variant-id="${faceProductId}"]`).dataset.price
      );
      const bodyPrice = parseInt(
        this.querySelector(`[data-variant-id="${bodyProductId}"]`).dataset.price
      );
      const totalPrice = facePrice + bodyPrice;

      byobBarRemaining.innerHTML = this.getRemainingHtml(faceProductId, bodyProductId);
      byobBarRemaining.classList.remove("lg:block");
      byobBarBuyButton.classList.remove("hidden");
      byobBarTotalCost.classList.add("hidden");

      byobBuyButtons.forEach((i) => i.removeAttribute("disabled"));
      byobTotalCosts.forEach((i) => (i.innerHTML = this.getPriceHtml(totalPrice, "text-wave-500")));

      this.panelProducts.innerHTML = `${this.getPanelProductHtml(
        faceProductId,
        "Face"
      )}${this.getPanelProductHtml(bodyProductId, "Body")}`;
    } else if (faceProductId && !bodyProductId) {
      const facePrice = parseInt(
        this.querySelector(`[data-variant-id="${faceProductId}"]`).dataset.price
      );

      byobBarRemaining.innerHTML = this.getRemainingHtml(faceProductId, null);
      byobBarRemaining.classList.add("lg:block");
      byobBarBuyButton.classList.add("hidden");
      byobBarTotalCost.classList.remove("hidden");

      byobBuyButtons.forEach((i) => i.setAttribute("disabled", true));
      byobTotalCosts.forEach(
        (i) => (i.innerHTML = this.getPriceHtml(facePrice, "text-seaweed-400"))
      );

      this.panelProducts.innerHTML = this.getPanelProductHtml(faceProductId, "Face");
    } else if (!faceProductId && bodyProductId) {
      const bodyPrice = parseInt(
        this.querySelector(`[data-variant-id="${bodyProductId}"]`).dataset.price
      );

      byobBarRemaining.innerHTML = this.getRemainingHtml(null, bodyProductId);
      byobBarRemaining.classList.add("lg:block");
      byobBarBuyButton.classList.add("hidden");
      byobBarTotalCost.classList.remove("hidden");

      byobBuyButtons.forEach((i) => i.setAttribute("disabled", true));
      byobTotalCosts.forEach(
        (i) => (i.innerHTML = this.getPriceHtml(bodyPrice, "text-seaweed-400"))
      );

      this.panelProducts.innerHTML = this.getPanelProductHtml(bodyProductId, "Body");
    } else {
      byobBarRemaining.innerHTML = this.getRemainingHtml(null, null);
      byobBarRemaining.classList.add("lg:block");
      byobBarBuyButton.classList.add("hidden");
      byobBarTotalCost.classList.add("hidden");

      byobBuyButtons.forEach((i) => i.setAttribute("disabled", true));
      byobTotalCosts.forEach((i) => (i.innerText = "$0"));

      this.panelProducts.innerHTML = "";
    }
  }

  handleModalOpen(e) {
    e.preventDefault();
    const addedProducts = [
      localStorage.getItem("osea.byobFaceProductId"),
      localStorage.getItem("osea.byobBodyProductId"),
    ];
    const bundleCard = e.currentTarget.closest(".bundle-card");
    const { productHandle, variantId } = bundleCard.dataset;

    fetch(`${window.Shopify.routes.root}products/${productHandle}.json`)
      .then((response) => response.json())
      .then((response) => {
        const { body_html, images, title, variants } = response.product;
        const modalContent = this.querySelector("#ByobModal .content");
        const reviewsHtml = bundleCard.querySelector(".rating").innerHTML;
        const addToBundleButton = bundleCard.querySelector(".byob-add-to-bundle");
        const parsedId = JSON.parse(variantId);
        const variantData = variants.find((i) => i.id === parsedId);
        const { name } = addToBundleButton.dataset;

        modalContent.innerHTML = `<div class="flex sm:flex-col overflow-x-auto sm:overflow-y-auto mb-4 gap-1 sm:absolute sm:inset-y-0 sm:w-1/2 sm:pr-3">
					${images
            .filter((image) => {
              const { variant_ids } = image;
              return (
                variants.length === 1 ||
                (variants.length > 1 &&
                  (variant_ids.length === 0 || variant_ids.includes(parsedId)))
              );
            })
            .slice(0, 6)
            .map((image) => {
              return `
									<img
										srcset="${image.src}&width=328&auto=format,compress 1x, ${
                image.src
              }&width=656&auto=format,compress 2x"
										src="${image.src}&width=656"
										alt=""
										loading="lazy"
										width="${image.width}"
										height="${image.height}"
										class="block bg-wave-200 w-48 sm:w-full ${
                      image.variant_ids.includes(parsedId) ? "order-1" : "order-2"
                    }"
									>
								`;
            })
            .join("")}
				</div>
				<div class="sm:w-1/2 sm:ml-auto sm:pl-4 sm:min-h-[32rem] sm:flex sm:flex-col">
					<div class="flex items-center mb-2">${reviewsHtml}</div>
					<h1 class="text-lg font-medium tracking-wide mb-2 leading-tight">${title}</h1>
					<div class="p:mb-3 mb-6">${body_html}</div>
					<div class="sticky bottom-0 bg-white py-4 mt-auto">
						<label for="Input-${variantId}" data-name="${name}" onclick="this.closest('bundle-builder').handleModalAdd('${variantId}', '${productHandle}', '${name}')" class="button button-primary w-full justify-between">
							<span>${addedProducts.includes(variantId) ? "Added!" : "Add"}</span>
							<span>${this.getPriceHtml(parseInt(variantData.price * 100), "text-seaweed-400")}</span>
						</label>
					</div>
				</div>`;
      })
      .catch((e) => console.error(e));
  }

  handleModalAdd(variantId, handle, name) {
    this.handleAddToBundle(null, variantId, handle, name);
    this.querySelector("modal-dialog").hide();
  }

  handleRemove(productId, type) {
    localStorage.removeItem(`osea.byob${type}ProductId`);
    this.querySelector(`#Input-${productId}`).checked = false;
    this.renderElements();
  }

  handleAddToBundle(e, varId, handle, type) {
    const variantId = varId || e.currentTarget.closest(".bundle-card").dataset.variantId;
    const productHandle = handle || e.currentTarget.closest(".bundle-card").dataset.productHandle;
    const name = type || e.currentTarget.dataset.name;

    if (name === "byob-face") {
      localStorage.setItem("osea.byobFaceProductId", variantId);
      localStorage.setItem("osea.byobFaceProductHandle", productHandle);
    }
    if (name === "byob-body") {
      localStorage.setItem("osea.byobBodyProductId", variantId);
      localStorage.setItem("osea.byobBodyProductHandle", productHandle);
    }

    this.renderElements();
  }

  handleAddToCart() {
    /* this.submitButton.setAttribute("aria-disabled", true);
    this.submitButton.classList.add("opacity-50");
    this.querySelector(".loading-spinner")?.classList.remove("hidden"); */

    const faceProductHandle = localStorage.getItem("osea.byobFaceProductHandle");
    const bodyProductHandle = localStorage.getItem("osea.byobBodyProductHandle");
    const bundleId = `${bodyProductHandle}-${faceProductHandle}`;

    fetch(`${window.Shopify.routes.root}products/${bundleId}.json`)
      .then((response) => response.json())
      .then((response) => {
        const body = JSON.stringify({
          items: [
            { id: response.product.variants[0].id, quantity: 1, properties: { _bundle: bundleId } },
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
						this.querySelector(".loading-spinner")?.classList.add("hidden"); */
          });
      })
      .catch((e) => console.error(e));
  }
}
customElements.define("bundle-builder", BundleBuilder);
