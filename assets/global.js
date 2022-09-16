function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute("role", "button");
  summary.setAttribute("aria-expanded", "false");

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute("aria-expanded", !event.currentTarget.closest("details").hasAttribute("open"));
  });

  if (summary.closest("header-drawer")) return;
  summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (event.target !== container && event.target !== last && event.target !== first) return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus.focus();
}

// querySelector to see if the browser supports :focus-visible and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ["ARROWUP", "ARROWDOWN", "ARROWLEFT", "ARROWRIGHT", "TAB", "ENTER", "SPACE", "ESCAPE", "HOME", "END", "PAGEUP", "PAGEDOWN"];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement) currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + "pauseVideo" + '","args":""}', "*");
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => video.pause());
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });

    this.querySelectorAll("button").forEach((button) => button.addEventListener("click", this.onButtonClick.bind(this)));
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define("quantity-input", QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options["hideElement"] || province_domid);

  Shopify.addListener(this.countryEl, "change", Shopify.bind(this.countryHandler, this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    if (navigator.platform === "iPhone") document.documentElement.style.setProperty("--viewport-height", `${window.innerHeight}px`);

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) => summary.addEventListener("click", this.onSummaryClick.bind(this)));
    this.querySelector(".menu-scrim").addEventListener("click", this.onSummaryClick.bind(this));
    this.querySelectorAll(".submenu-close").forEach((button) => button.addEventListener("click", this.onCloseSubmenu.bind(this)));

    const closeButton = this.querySelector(".menu-close");
    closeButton && closeButton.addEventListener("click", this.closeMenuDrawer.bind(this));
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector("summary")) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const drawerElement = this.querySelector(".menu-drawer");
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector("button"));
      summaryElement.nextElementSibling.removeEventListener("transitionend", addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement, drawerElement) : this.openMenuDrawer(summaryElement, drawerElement);
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        drawerElement.classList.remove("invisible");
        summaryElement.setAttribute("aria-expanded", true);
        !reducedMotion || reducedMotion.matches ? addTrapFocus() : summaryElement.nextElementSibling.addEventListener("transitionend", addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement, drawerElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    drawerElement.classList.remove("invisible");
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add("overflow-hidden");
  }

  closeMenuDrawer(event, elementToFocus = false, drawerElement) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove("menu-opening");
      setTimeout(() => drawerElement.classList.add("invisible"), 300);
      this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
        details.removeAttribute("open");
        details.classList.remove("menu-opening");
        setTimeout(() => drawerElement.classList.add("invisible"), 300);
      });
      document.body.classList.remove("overflow-hidden");
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute("open") && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseSubmenu(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove("menu-opening");
    detailsElement.querySelector("summary").setAttribute("aria-expanded", false);
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(detailsElement.closest("details[open]"), detailsElement.querySelector("summary"));
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define("menu-drawer", MenuDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener("click", this.hide.bind(this));
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (event.pointerType === "mouse" && !event.target.closest("deferred-media, product-model")) this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target.nodeName === "MODAL-DIALOG") this.hide();
      });
    }
  }

  show(opener) {
    this.openedBy = opener;
    console.log("this.openedBy", this.openedBy);
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove("overflow-hidden");
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      console.log("modal", modal);
      if (modal) modal.show(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent() {
    window.pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(this.querySelector("template").content.firstElementChild.cloneNode(true));

      this.setAttribute("loaded", true);
      this.appendChild(content.querySelector("video, model-viewer, iframe")).focus();
    }
  }
}

customElements.define("deferred-media", DeferredMedia);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll("select"), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;
    if (window.location.pathname.includes("/products/")) {
      // change first image in product page image gallery
      const variantImageEl = document.querySelector("#Product-VariantImage");
      const newImageSrc = this.currentVariant.featured_image.src;
      variantImageEl.srcset = `${newImageSrc}&width=600 1x, ${newImageSrc}&width=1200 2x`;
      variantImageEl.src = newImageSrc;
    } else {
      // change image in product card
      const imageElement = document.getElementById(`ProductCard-DefaultImage-${this.dataset.section.split("-")[0]}`);
      const newImageSrc = this.currentVariant.featured_media.preview_image.src;
      imageElement.srcset = `${newImageSrc}&width=328 1x, ${newImageSrc}&width=656 2x`;
      imageElement.src = newImageSrc;
    }
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState({}, "", `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  removeErrorMessage() {
    const section = this.closest("section");
    if (!section) return;

    const productForm = section.querySelector("product-form");
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}`)
      .then((response) => response.text())
      .then((responseText) => {
        const responseHTML = new DOMParser().parseFromString(responseText, "text/html");
        const destination = document.getElementById(`price-${this.dataset.section}`);
        const source = responseHTML.querySelector(".product .price").parentElement;
        if (source && destination) destination.innerHTML = source.innerHTML;

        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute("disabled", "disabled");
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute("disabled");
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("visibility-hidden");
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define("variant-selects", VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll("input")).find((radio) => radio.checked).value;
    });
  }
}

customElements.define("variant-radios", VariantRadios);

class SubscriptionRadios extends HTMLElement {
  constructor() {
    super();

    this.purchaseOptionInputs = Array.from(this.querySelectorAll('input[name="purchase_option"]'));
    this.sellingPlanInputs = Array.from(this.querySelectorAll('input[name="selling_plan"]'));

    this.purchaseOptionInputs.forEach((input) => input.addEventListener("change", this.onPurchaseOptionChange.bind(this)));
  }

  onPurchaseOptionChange(e) {
    const { value, checked } = e.currentTarget;

    if (checked) {
      this.setActiveState();
      this.updateMainPrice(e.currentTarget);

      if (value === "onetime") {
        this.clearSellingPlanValues();
      } else if (value === "autodeliver") {
        this.setDefaultSellingPlan();
      }
    }
  }

  setActiveState() {
    this.purchaseOptionInputs?.forEach((input) => input.closest("label").classList.toggle("bg-wave-200", input.checked));
  }

  updateMainPrice(currentTarget) {
    const currentPrice = currentTarget.closest("label").querySelector(".price");
    const mainPrice = document.querySelector(".main-price .price");

    mainPrice.innerHTML = currentPrice.innerHTML;
  }

  clearSellingPlanValues() {
    this.sellingPlanInputs?.forEach((input) => (input.checked = false));
  }

  setDefaultSellingPlan() {
    const defaultSellingPlanInt = this.dataset.recommendedInterval || 2;
    const defaultSellingPlanInput = this.sellingPlanInputs[defaultSellingPlanInt - 1];

    defaultSellingPlanInput.checked = true;
  }
}

customElements.define("subscription-radios", SubscriptionRadios);

class TabController extends HTMLElement {
  constructor() {
    super();
    this.tablist = this.querySelector("[role=tablist]");
    this.tabs = this.querySelectorAll("[role=tab]");
    this.tabpanels = this.querySelectorAll("[role=tabpanel]");
    this.activeTab = this.querySelector("[role=tab][aria-selected=true]");

    this.addEventListeners();
  }

  // Private function to set event listeners
  addEventListeners() {
    for (let tab of this.tabs) {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        this.setActiveTab(tab.getAttribute("aria-controls"));
      });
      tab.addEventListener("keyup", (e) => {
        if (e.keyCode == 13 || e.keyCode == 32) {
          // return or space
          e.preventDefault();
          this.setActiveTab(tab.getAttribute("aria-controls"));
        }
      });
    }
    this.tablist.addEventListener("keyup", (e) => {
      switch (e.keyCode) {
        case 35: // end key
          e.preventDefault();
          this.setActiveTab(this.tabs[this.tabs.length - 1].getAttribute("aria-controls"));
          break;
        case 36: // home key
          e.preventDefault();
          this.setActiveTab(this.tabs[0].getAttribute("aria-controls"));
          break;
        case 37: // left arrow
          e.preventDefault();
          let previous = [...this.tabs].indexOf(this.activeTab) - 1;
          previous = previous >= 0 ? previous : this.tabs.length - 1;
          this.setActiveTab(this.tabs[previous].getAttribute("aria-controls"));
          break;
        case 39: // right arrow
          e.preventDefault();
          let next = [...this.tabs].indexOf(this.activeTab) + 1;
          next = next < this.tabs.length ? next : 0;
          this.setActiveTab(this.tabs[next].getAttribute("aria-controls"));
          break;
      }
    });
  }

  // Public function to set the tab by id
  // This can be called by the developer too.
  setActiveTab(id) {
    for (let tab of this.tabs) {
      if (tab.getAttribute("aria-controls") == id) {
        tab.setAttribute("aria-selected", "true");
        tab.classList.add("bg-wave-200");
        tab.focus();
        this.activeTab = tab;
      } else {
        tab.setAttribute("aria-selected", "false");
        tab.classList.remove("bg-wave-200");
      }
    }
    for (let tabpanel of this.tabpanels) {
      if (tabpanel.getAttribute("id") == id) {
        tabpanel.setAttribute("aria-expanded", "true");
      } else {
        tabpanel.setAttribute("aria-expanded", "false");
      }
    }
  }
}

customElements.define("tab-controller", TabController);

// TODO: replace instances with swiffy slider and delete
/* class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector("ul");
    this.sliderItems = this.querySelectorAll("li");
    this.pageCount = this.querySelector(".slider-counter--current");
    this.pageTotal = this.querySelector(".slider-counter--total");
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener("scroll", this.update.bind(this));
    this.prevButton.addEventListener("click", this.onButtonClick.bind(this));
    this.nextButton.addEventListener("click", this.onButtonClick.bind(this));
  }

  initPages() {
    const sliderItemsToShow = Array.from(this.sliderItems).filter((element) => element.clientWidth > 0);
    this.sliderLastItem = sliderItemsToShow[sliderItemsToShow.length - 1];
    if (sliderItemsToShow.length === 0) return;
    this.slidesPerPage = Math.floor(this.slider.clientWidth / sliderItemsToShow[0].clientWidth);
    this.totalPages = sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  update() {
    if (!this.pageCount || !this.pageTotal) return;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderLastItem.clientWidth) + 1;

    if (this.currentPage === 1) {
      this.prevButton.setAttribute("disabled", "disabled");
    } else {
      this.prevButton.removeAttribute("disabled");
    }

    if (this.currentPage === this.totalPages) {
      this.nextButton.setAttribute("disabled", "disabled");
    } else {
      this.nextButton.removeAttribute("disabled");
    }

    this.pageCount.textContent = this.currentPage;
    this.pageTotal.textContent = this.totalPages;
  }

  onButtonClick(event) {
    event.preventDefault();
    const slideScrollPosition =
      event.currentTarget.name === "next" ? this.slider.scrollLeft + this.sliderLastItem.clientWidth : this.slider.scrollLeft - this.sliderLastItem.clientWidth;
    console.log(slideScrollPosition);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define("slider-component", SliderComponent); */

// Based on Swiffy Slider: https://swiffyslider.com/docs/
class SliderComponent extends HTMLElement {
  constructor() {
    super();

    this.initSlider(this);
  }

  initSlider(sliderElement) {
    for (let navElement of sliderElement.querySelectorAll(".slider-nav")) {
      let next = navElement.classList.contains("slider-nav-next");
      navElement.addEventListener("click", () => this.slide(sliderElement, next), { passive: true });

      if (this.classList.contains("slider-nav-hide-ends")) {
        sliderElement.querySelector(".slider-nav-prev").classList.add("hidden");
      }
    }
    for (let indicatorElement of sliderElement.querySelectorAll(".slider-indicators")) {
      indicatorElement.addEventListener("click", () => this.slideToByIndicator());
      this.onSlideEnd(sliderElement, () => this.handleIndicators(sliderElement), 60);
    }
    if (sliderElement.classList.contains("slider-nav-autoplay")) {
      const timeout = sliderElement.getAttribute("data-slider-nav-autoplay-interval") ? sliderElement.getAttribute("data-slider-nav-autoplay-interval") : 2500;
      this.autoPlay(sliderElement, timeout, sliderElement.classList.contains("slider-nav-autopause"));
    }
    if (["slider-nav-autohide", "slider-nav-animation"].some((className) => sliderElement.classList.contains(className))) {
      const threshold = sliderElement.getAttribute("data-slider-nav-animation-threshold") ? sliderElement.getAttribute("data-slider-nav-animation-threshold") : 0.3;
      this.setVisibleSlides(sliderElement, threshold);
    }
  }

  setVisibleSlides(sliderElement, threshold = 0.3) {
    let observer = new IntersectionObserver(
      (slides) => {
        slides.forEach((slide) => {
          slide.isIntersecting ? slide.target.classList.add("slide-visible") : slide.target.classList.remove("slide-visible");
        });
        sliderElement.querySelector(".slider-container>*:first-child").classList.contains("slide-visible")
          ? sliderElement.classList.add("slider-item-first-visible")
          : sliderElement.classList.remove("slider-item-first-visible");
        sliderElement.querySelector(".slider-container>*:last-child").classList.contains("slide-visible")
          ? sliderElement.classList.add("slider-item-last-visible")
          : sliderElement.classList.remove("slider-item-last-visible");
      },
      {
        root: sliderElement.querySelector(".slider-container"),
        threshold: threshold,
      }
    );
    for (let slide of sliderElement.querySelectorAll(".slider-container>*")) observer.observe(slide);
  }

  slide(sliderElement, next = true) {
    const container = sliderElement.querySelector(".slider-container");
    const fullpage = sliderElement.classList.contains("slider-nav-page");
    const noloop = sliderElement.classList.contains("slider-nav-noloop");
    const nodelay = sliderElement.classList.contains("slider-nav-nodelay");
    const slides = container.children;
    const gapWidth = parseInt(window.getComputedStyle(container).columnGap);
    const scrollStep = slides[0].offsetWidth + gapWidth;
    let scrollLeftPosition = next ? container.scrollLeft + scrollStep : container.scrollLeft - scrollStep;
    if (fullpage) {
      scrollLeftPosition = next ? container.scrollLeft + container.offsetWidth : container.scrollLeft - container.offsetWidth;
    }
    if (container.scrollLeft < 1 && !next && !noloop) {
      scrollLeftPosition = container.scrollWidth - container.offsetWidth;
    }
    if (container.scrollLeft >= container.scrollWidth - container.offsetWidth && next && !noloop) {
      scrollLeftPosition = 0;
    }
    container.scroll({
      left: scrollLeftPosition,
      behavior: nodelay ? "auto" : "smooth",
    });

    if (this.classList.contains("slider-nav-hide-ends")) {
      if (scrollLeftPosition === 0) {
        sliderElement.querySelector(".slider-nav-prev").classList.add("hidden");
      } else {
        sliderElement.querySelector(".slider-nav-prev").classList.remove("hidden");
      }
    }
  }

  slideToByIndicator() {
    const indicator = window.event.target;
    const indicatorIndex = Array.from(indicator.parentElement.children).indexOf(indicator);
    const indicatorCount = indicator.parentElement.children.length;
    const sliderElement = indicator.closest(".slider");
    const slideCount = sliderElement.querySelector(".slider-container").children.length;
    const relativeSlideIndex = (slideCount / indicatorCount) * indicatorIndex;
    this.slideTo(sliderElement, relativeSlideIndex);
  }

  slideTo(sliderElement, slideIndex) {
    const container = sliderElement.querySelector(".slider-container");
    const gapWidth = parseInt(window.getComputedStyle(container).columnGap);
    const scrollStep = container.children[0].offsetWidth + gapWidth;
    const nodelay = sliderElement.classList.contains("slider-nav-nodelay");
    container.scroll({
      left: scrollStep * slideIndex,
      behavior: nodelay ? "auto" : "smooth",
    });
  }

  onSlideEnd(sliderElement, delegate, timeout = 125) {
    let isScrolling;
    sliderElement.querySelector(".slider-container").addEventListener(
      "scroll",
      function () {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(delegate, timeout);
      },
      { capture: false, passive: true }
    );
  }

  autoPlay(sliderElement, timeout, autopause) {
    timeout = timeout < 750 ? 750 : timeout;
    let autoplayTimer = setInterval(() => this.slide(sliderElement), timeout);
    const autoplayer = () => this.autoPlay(sliderElement, timeout, autopause);
    if (autopause) {
      ["mouseover", "touchstart"].forEach(function (event) {
        sliderElement.addEventListener(
          event,
          function () {
            window.clearTimeout(autoplayTimer);
          },
          { once: true, passive: true }
        );
      });
      ["mouseout", "touchend"].forEach(function (event) {
        sliderElement.addEventListener(
          event,
          function () {
            autoplayer();
          },
          { once: true, passive: true }
        );
      });
    }
    return autoplayTimer;
  }

  handleIndicators(sliderElement) {
    const container = sliderElement.querySelector(".slider-container");
    const slidingAreaWidth = container.scrollWidth - container.offsetWidth;
    const percentSlide = container.scrollLeft / slidingAreaWidth;
    for (let scrollIndicatorContainers of sliderElement.querySelectorAll(".slider-indicators")) {
      let scrollIndicators = scrollIndicatorContainers.children;
      let activeIndicator = Math.abs(Math.round((scrollIndicators.length - 1) * percentSlide));
      for (let element of scrollIndicators) element.classList.remove("active");
      scrollIndicators[activeIndicator].classList.add("active");
    }
  }
}

customElements.define("slider-component", SliderComponent);

// Glide.js: https://glidejs.com/docs/
class GlideSlider extends HTMLElement {
  constructor() {
    super();

    this.id = this.getAttribute("id");
    this.options = {};

    this.initSlider();
  }

  getPath(currentBreakpoint) {
    return currentBreakpoint ? this.options.breakpoints[currentBreakpoint] : this.options;
  }

  addOtherPeek(currentPeek, currentBreakpoint) {
    const otherPeek = ["before", "after"].filter((i) => i !== currentPeek)[0];
    const path = this.getPath(currentBreakpoint);

    return path?.peek?.[otherPeek] ? {} : { [otherPeek]: 0 };
  }

  parseValue(valueString) {
    let value;
    if (isNaN(valueString)) {
      value = ["true", "false"].includes(valueString) ? valueString === "true" : valueString;
    } else {
      value = parseInt(valueString);
    }

    return value;
  }

  buildOptionObject(level1, level2, level3, currentBreakpoint) {
    return {
      [level1]: level3
        ? {
            ...[this.getPath(currentBreakpoint)]?.[level1],
            [level2]: this.parseValue(level3),
            // fixes bug: property fails when only before/after is present
            ...(level1 === "peek" && this.addOtherPeek(level2, currentBreakpoint)),
          }
        : this.parseValue(level2),
    };
  }

  getOptions(optionClasses) {
    const twBreakpoints = JSON.parse('{"2xs":400,"xs":475,"sm":640,"md":768,"lg":1024,"xl":1280,"2xl":1536}');

    optionClasses.forEach((className) => {
      const splitClass = className.split(/[\:\.\-]/);

      // if class has breakpoint modifier
      if (className.includes(":")) {
        const breakpointInt = twBreakpoints[splitClass[0]];

        if (!this.options.breakpoints) {
          this.options.breakpoints = {};
        }

        this.options.breakpoints[breakpointInt] = {
          ...this.options.breakpoints?.[breakpointInt],
          ...this.buildOptionObject(splitClass[1], splitClass[2], splitClass[3], breakpointInt),
        };
      } else {
        this.options = {
          ...this.options,
          ...this.buildOptionObject(splitClass[0], splitClass[1], splitClass[2]),
        };
      }
    });
  }

  initSlider() {
    const classes = Array.from(this.classList);

    if (classes.length > 0) {
      const optionTypes = ["perView", "peek", "focusAt", "type", "bound", "gap"];
      const optionClasses = classes.filter((className) => optionTypes.some((optionType) => className.includes(optionType)));

      if (optionClasses.length > 0) {
        this.getOptions(optionClasses);
      }
    }

    new Glide(`#${this.id}`, this.options).mount();
  }
}

customElements.define("glide-slider", GlideSlider);

// TODO: consider removing - replace with css only solution, or move to only pages that use it
class Accordion {
  constructor(el) {
    this.el = el;
    this.summary = el.querySelector("summary");
    this.content = el.querySelector(".content");
    this.duration = parseInt(el.dataset.duration);

    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;

    this.summary.addEventListener("click", (e) => this.onClick(e));
  }

  onClick(e) {
    e.preventDefault();
    this.el.style.overflow = "hidden";
    if (this.isClosing || !this.el.open) {
      this.open();
    } else if (this.isExpanding || this.el.open) {
      this.shrink();
    }
  }

  shrink() {
    this.isClosing = true;

    const startHeight = `${this.el.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight}px`;

    if (this.animation) {
      this.animation.cancel();
    }

    this.animation = this.el.animate(
      {
        height: [startHeight, endHeight],
      },
      {
        duration: this.duration,
        easing: "ease-in-out",
      }
    );

    this.animation.onfinish = () => this.onAnimationFinish(false);
    this.animation.oncancel = () => (this.isClosing = false);
  }

  open() {
    this.el.style.height = `${this.el.offsetHeight}px`;
    this.el.open = true;
    window.requestAnimationFrame(() => this.expand());
  }

  expand() {
    this.isExpanding = true;
    const startHeight = `${this.el.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

    if (this.animation) {
      this.animation.cancel();
    }

    this.animation = this.el.animate(
      {
        height: [startHeight, endHeight],
      },
      {
        duration: this.duration,
        easing: "ease-in-out",
      }
    );
    this.animation.onfinish = () => this.onAnimationFinish(true);
    this.animation.oncancel = () => (this.isExpanding = false);
  }

  onAnimationFinish(open) {
    this.el.open = open;
    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;
    this.el.style.height = this.el.style.overflow = "";
  }
}

document.querySelectorAll("details.accordion").forEach((el) => {
  new Accordion(el);
});

// add shadow to header when #MainContent reaches top of window
let observer = new IntersectionObserver((entries) => {
  if (entries[0].boundingClientRect.y < 0) {
    document.querySelector("#shopify-section-header").classList.add("shadow-md", "shadow-seaweed-400/5");
  } else {
    document.querySelector("#shopify-section-header").classList.remove("shadow-md", "shadow-seaweed-400/5");
  }
});
observer.observe(document.querySelector("#HeaderScrollPixel"));
