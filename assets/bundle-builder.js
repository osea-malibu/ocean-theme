class BundleBuilder extends HTMLElement {
  constructor() {
    super();

    this.querySelectorAll(".byob-modal").forEach((i) => i.addEventListener("click", this.handleModalOpen.bind(this)));
    this.querySelectorAll(".byob-add-to-bundle").forEach((i) => i.addEventListener("click", this.handleAddToBundle.bind(this)));
  }

  connectedCallback() {
    let faceProductId = localStorage.getItem("osea.byobFaceProductId");
    let bodyProductId = localStorage.getItem("osea.byobBodyProductId");

    if (faceProductId) {
      this.querySelector(`#Input-${faceProductId}`).checked = true;
    }
    if (bodyProductId) {
      this.querySelector(`#Input-${bodyProductId}`).checked = true;
    }

    this.setByobBar();
  }

  setByobBar() {
    let faceProductId = localStorage.getItem("osea.byobFaceProductId");
    let bodyProductId = localStorage.getItem("osea.byobBodyProductId");
    const byobBarCount = this.querySelector("#ByobBar .count");
    const byobBarCost = this.querySelector("#ByobBar .cost");

    if (faceProductId && bodyProductId) {
      const facePrice = parseInt(this.querySelector(`#Input-${faceProductId}`).dataset.price);
      const bodyPrice = parseInt(this.querySelector(`#Input-${bodyProductId}`).dataset.price);
      const totalPrice = facePrice + bodyPrice;

      byobBarCount.innerText = "2/2";
      byobBarCost.innerText = `$${(totalPrice / 100).toFixed(2)}`;
    } else if (faceProductId && !bodyProductId) {
      const facePrice = parseInt(this.querySelector(`#Input-${faceProductId}`).dataset.price);

      byobBarCount.innerText = "1/2";
      byobBarCost.innerText = `$${(facePrice / 100).toFixed(2)}`;
    } else if (!faceProductId && bodyProductId) {
      const bodyPrice = parseInt(this.querySelector(`#Input-${bodyProductId}`).dataset.price);

      byobBarCount.innerText = "1/2";
      byobBarCost.innerText = `$${(bodyPrice / 100).toFixed(2)}`;
    } else {
      byobBarCount.innerText = "0/2";
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

    this.setByobBar();
  }
}
customElements.define("bundle-builder", BundleBuilder);
