function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute("aria-expanded", "false");

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute(
      "aria-expanded",
      !event.currentTarget.closest("details").hasAttribute("open")
    );
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
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
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
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
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

// add border to header on scroll
let headerBorderObserver = new IntersectionObserver((entries) => {
  const headerWrapper = document.querySelector("#HeaderContent");
  if (entries[0].boundingClientRect.y < 0) {
    headerWrapper.classList.add("border-seaweed-300");
    headerWrapper.classList.remove("border-transparent");
  } else {
    headerWrapper.classList.remove("border-seaweed-300");
    headerWrapper.classList.add("border-transparent");
  }
});
headerBorderObserver.observe(document.querySelector("#HeaderScrollPixel"));

const lazyVideos = [].slice.call(document.querySelectorAll("video.lazy"));
let lazyVideoObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((video) => {
    if (video.isIntersecting) {
      for (var source in video.target.children) {
        var videoSource = video.target.children[source];
        if (typeof videoSource.tagName === "string" && videoSource.tagName === "SOURCE") {
          videoSource.src = videoSource.dataset.src;
        }
      }

      video.target.load();
      video.target.classList.remove("lazy");
      lazyVideoObserver.unobserve(video.target);
    }
  });
});

lazyVideos.forEach((lazyVideo) => {
  lazyVideoObserver.observe(lazyVideo);
});

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });

    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  onInputChange(event) {
    const autodeliverOptionEl = document.querySelector('input[value="autodeliver"]');
    const inputValueInteger = parseInt(event.currentTarget.value);
    const plusButtonEl = this.querySelector('button[name="plus"]');

    if (autodeliverOptionEl && autodeliverOptionEl.checked) {
      this.productForm = document.querySelector("product-form.pdp-product-form");
      if (inputValueInteger > 4) {
        this.input.value = 4;
        this.productForm.handleErrorMessage(
          "You may not subscribe to more than 4 of this product."
        );
        setTimeout(() => this.productForm.handleErrorMessage(), 5000);
        plusButtonEl.setAttribute("disabled", "");
      } else if (inputValueInteger == 4) {
        plusButtonEl.setAttribute("disabled", "");
      } else {
        if (plusButtonEl.disabled) {
          plusButtonEl.removeAttribute("disabled");
        }
        this.productForm.handleErrorMessage();
      }
    }
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

/* Shopify Common JS */
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
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
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

    if (navigator.platform === "iPhone")
      document.documentElement.style.setProperty("--viewport-height", `${window.innerHeight}px`);

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelector(".menu-scrim").addEventListener("click", this.onSummaryClick.bind(this));
    this.querySelectorAll(".submenu-close").forEach((button) =>
      button.addEventListener("click", this.onCloseSubmenu.bind(this))
    );

    const closeButton = this.querySelector(".menu-close");
    closeButton && closeButton.addEventListener("click", this.closeMenuDrawer.bind(this));
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector("summary"))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector("button"));
      summaryElement.nextElementSibling.removeEventListener("transitionend", addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        summaryElement.setAttribute("aria-expanded", true);
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener("transitionend", addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add("overflow-hidden");
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove("menu-opening");
      this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
        details.removeAttribute("open");
        details.classList.remove("menu-opening");
      });
      document.body.classList.remove("overflow-hidden");
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
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
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }

  setMenuTopValue() {
    const drawer = this.querySelector(".menu-drawer");
    const scrim = this.querySelector(".menu-scrim");

    const announcementBar = document.querySelector("#AnnouncementBar");
    const header = document.querySelector("header.header");

    const topValue = announcementBar.offsetHeight + header.offsetHeight;

    drawer.style.top = `${topValue}px`;
    scrim.style.top = `${topValue}px`;
  }
}
customElements.define("menu-drawer", MenuDrawer);

class DismissableAnnoucement extends HTMLElement {
  constructor() {
    super();

    this.dismissableMessage = this.querySelector("#DismissableMessage");
    this.defaultMessage = this.querySelector("#DismissableDefault");
    this.closeButton = this.querySelector("#DismissableClose");

    this.closeButton.addEventListener("click", this.onClose.bind(this));
  }

  connectedCallback() {
    let isDismissed = JSON.parse(sessionStorage.getItem("osea.announcementDismissed"));
    if (isDismissed) {
      this.useDefaultMessage();
    } else {
      const menuDrawer = document.querySelector("menu-drawer");
      menuDrawer.setMenuTopValue();
    }
  }

  onClose() {
    const drawer = document.querySelector("#HamburgerMenu .menu-drawer");
    const scrim = document.querySelector("#HamburgerMenu .menu-scrim");

    drawer.style.removeProperty("top");
    scrim.style.removeProperty("top");

    this.useDefaultMessage();
    sessionStorage.setItem("osea.announcementDismissed", true);
  }

  useDefaultMessage() {
    this.dismissableMessage.classList.add("hidden");
    this.closeButton.classList.add("hidden");
    this.defaultMessage.classList.remove("hidden");
  }
}
customElements.define("dismissable-announcement", DismissableAnnoucement);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener("click", this.hide.bind(this));
    this.querySelectorAll(".close-modal").forEach((i) =>
      i.addEventListener("click", this.hide.bind(this))
    );
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (event.pointerType === "mouse" && !event.target.closest("deferred-media, product-model"))
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target.nodeName === "MODAL-DIALOG") this.hide();
      });
    }
  }

  show(opener) {
    this.openedBy = opener;
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

    const button = this.querySelector("button") || this.querySelector('[type="button"]');

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
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
      this.appendChild(content).focus();
    }
  }
}
customElements.define("deferred-media", DeferredMedia);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
  }

  connectedCallback() {
    this.updateOptions();
    this.updateMasterId();
    this.updateMedia();
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateIsSubscription();
    this.toggleAddButton(true, "", false);
    this.removeErrorMessage();

    // reset purchase option to one-time
    document.querySelector(".purchase-option.onetime").classList.add("bg-wave-200");
    document.querySelector('input[value="onetime"]').checked = true;
    document.querySelector(".purchase-option.autodeliver").classList.remove("bg-wave-200");
    document.querySelector('input[value="autodeliver"]').checked = false;

    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateOptionVisibility();
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

  updateIsSubscription() {
    const isSubscriptionInput = document.querySelector(
      'input[name="properties[_is_subscription]"]'
    );

    if (this.currentVariant) {
      if (this.currentVariant.selling_plan_allocations.length > 0) {
        isSubscriptionInput.value = true;
      } else {
        isSubscriptionInput.value = false;
      }
    }
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;
    if (window.location.pathname.includes("/products/")) {
      // change first image in product page image gallery
      const variantImageEl = document.querySelector("#Product-VariantImage");
      const newImageSrc = this.currentVariant.featured_image.src;
      if (variantImageEl) {
        variantImageEl.srcset = `${newImageSrc}&width=294 1x, ${newImageSrc}&width=588 2x`;
        variantImageEl.src = newImageSrc;
      }
    } else {
      // change image in product card
      const imageElement = document.getElementById(
        `ProductCard-DefaultImage-${this.dataset.section}`
      );
      const newImageSrc = this.currentVariant.featured_media.preview_image.src;

      if (imageElement) {
        imageElement.srcset = `${newImageSrc}&width=328 1x, ${newImageSrc}&width=656 2x`;
        imageElement.src = newImageSrc;
      }
    }
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState({}, "", `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment`
    );
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
    const { id } = this.currentVariant;
    fetch(`${this.dataset.url}?variant=${id}`)
      .then((response) => response.text())
      .then((responseText) => {
        const responseHTML = new DOMParser().parseFromString(responseText, "text/html");

        const replaceContent = (selector, sourceSelector) => {
          const source = responseHTML.querySelector(sourceSelector || selector);
          const destination = document.querySelector(selector);
          if (source && destination) destination.innerHTML = source.innerHTML;
        };

        replaceContent(".product .main-price");
        replaceContent(".subscription .onetime .price");
        replaceContent(".subscription .autodeliver .price");
        replaceContent(".product .benefits");
        replaceContent(`[value="${id}"] ~ button[name="add"] .price`, ".product .main-price");
        replaceContent(".subscription .selling-plan-options");

        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  updateOptionVisibility() {
    if (this.currentVariant && window.location.pathname.includes("/products/")) {
      const subscriptionRadios = document.querySelector("subscription-radios");
      if (subscriptionRadios) {
        const hasSubscriptionOption = this.currentVariant.selling_plan_allocations.length > 0;
        if (hasSubscriptionOption) {
          subscriptionRadios.classList.add("max-h-48");
          subscriptionRadios.classList.remove("max-h-0");
        } else {
          subscriptionRadios.classList.add("max-h-0");
          subscriptionRadios.classList.remove("max-h-48");
        }
      }

      const scentValues = ["Fragrance free", "Scented"];
      const hasScentVariant = this.currentVariant.options.some((r) => scentValues.indexOf(r) >= 0);
      if (hasScentVariant) {
        const scentRadios = document.getElementsByName("Scent");
        const sizeRadios = document.getElementsByName("Size");
        const originalScentInfo = document.querySelectorAll(".scent-scented");
        const fragranceFreeScentInfo = document.querySelectorAll(".scent-fragrance-free");

        originalScentInfo.forEach((i) => {
          i.classList.toggle("hidden", scentRadios[1].checked);
        });
        fragranceFreeScentInfo.forEach((i) => {
          i.classList.toggle("hidden", scentRadios[0].checked);
        });

        var selectedSize = this.currentVariant.option2;
        var selectedScent = this.currentVariant.option1;

        // Enable all options initially
        sizeRadios.forEach((radio) => (radio.disabled = false));
        scentRadios.forEach((radio) => (radio.disabled = false));

        // Disable options based on selected values
        if (selectedSize === "1 fl oz") {
          // Disable Fragrance free when 1 fl oz is selected
          scentRadios.forEach((radio) => {
            if (radio.value === "Fragrance free") {
              radio.disabled = true;
            }
          });
        }

        if (selectedScent === "Fragrance free") {
          // Disable 1 fl oz when Fragrance free is selected
          sizeRadios.forEach((radio) => {
            if (radio.value === "1 fl oz") {
              radio.disabled = true;
            }
          });
        }
      }
    }
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > .label');

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
    if (price) price.classList.add("invisible");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"].variant-data').textContent);
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

    this.isSubscriptionInput = document.querySelector('input[name="properties[_is_subscription]"]');
    this.purchaseOptionInputs = Array.from(this.querySelectorAll('input[name="purchase_option"]'));

    const urlParams = new URLSearchParams(window.location.search);
    const urlPurchaseType = urlParams.get("type");

    this.purchaseOptionInputs.forEach((input) => {
      const isSubscription =
        urlPurchaseType === "subscription" || document.referrer.includes("/pages/subscribe");
      if (isSubscription && input.value === "autodeliver") {
        input.checked = true;
        this.setActiveState();
        this.updateMainPrice(input);
        this.setDefaultSellingPlan();

        document.querySelector("#PayInstallments")?.classList.add("opacity-0");
      }
      input.addEventListener("change", this.onPurchaseOptionChange.bind(this));
    });
  }

  onPurchaseOptionChange(e) {
    const { value, checked } = e.currentTarget;

    if (checked) {
      this.setActiveState();
      this.updateMainPrice(e.currentTarget);

      const plusButtonEl = document.querySelector('.pdp-quantity button[name="plus"]');

      if (value === "onetime") {
        this.clearSellingPlanValues();
        this.isSubscriptionInput.value = false;
        this.productForm = document.querySelector("product-form.pdp-product-form");

        document.querySelector("#PayInstallments")?.classList.remove("opacity-0");

        if (plusButtonEl && plusButtonEl.disabled) plusButtonEl.removeAttribute("disabled");
        this.productForm.handleErrorMessage();
      } else if (value === "autodeliver") {
        this.setDefaultSellingPlan();
        this.isSubscriptionInput.value = true;

        document.querySelector("#PayInstallments")?.classList.add("opacity-0");

        const inputEl = document.querySelector(".pdp-quantity input");
        if (inputEl) {
          const inputValueInteger = parseInt(inputEl.value);

          if (inputValueInteger > 4) {
            inputEl.value = 4;
            plusButtonEl.setAttribute("disabled", "");
          } else if (inputValueInteger == 4) {
            plusButtonEl.setAttribute("disabled", "");
          }
        }
      }
    }
  }

  setActiveState() {
    this.purchaseOptionInputs?.forEach((input) =>
      input.closest(".purchase-option").classList.toggle("bg-wave-200", input.checked)
    );
  }

  updateMainPrice(currentTarget) {
    const currentPrice = currentTarget.closest(".purchase-option").querySelector(".price");
    const mainPrice = document.querySelector(".main-price.price");

    mainPrice.innerHTML = currentPrice.innerHTML;
  }

  clearSellingPlanValues() {
    Array.from(this.querySelectorAll('input[name="selling_plan"]'))?.forEach(
      (input) => (input.checked = false)
    );
  }

  setDefaultSellingPlan() {
    const defaultSellingPlanInt = this.dataset.recommendedInterval || 2;
    const defaultSellingPlanInput = Array.from(this.querySelectorAll('input[name="selling_plan"]'))[
      defaultSellingPlanInt - 1
    ];

    defaultSellingPlanInput.checked = true;
  }
}
customElements.define("subscription-radios", SubscriptionRadios);

class ProductStickyAtc extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.atcObserver = new IntersectionObserver((entries) => {
      if (entries[0].intersectionRatio <= 0) {
        this.classList.remove("invisible", "opacity-0");
      } else {
        this.classList.add("invisible", "opacity-0");
      }
    });

    this.atcObserver.observe(document.querySelector(".product-form.pdp-product-form"));
  }

  disconnectedCallback() {
    if (this.atcObserver) {
      this.atcObserver.disconnect();
    }
  }
}
customElements.define("product-sticky-atc", ProductStickyAtc);

class TabController extends HTMLElement {
  constructor() {
    super();
    this.tablist = this.querySelector("[role=tablist]");
    this.tabs = this.querySelectorAll("[role=tab]");
    this.tabpanels = this.querySelectorAll("[role=tabpanel]");
    this.activeTab = this.querySelector("[role=tab][aria-selected=true]");

    this.addEventListeners();
    this.checkUrlParameters();
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
        case 38: // up arrow
          e.preventDefault();
          let previous = [...this.tabs].indexOf(this.activeTab) - 1;
          previous = previous >= 0 ? previous : this.tabs.length - 1;
          this.setActiveTab(this.tabs[previous].getAttribute("aria-controls"));
          break;
        case 39: // right arrow
        case 40: // right arrow
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
  setActiveTab(id, skipFocus = false) {
    const activeTabClass = this.dataset.activeClass?.split(" ") || ["bg-wave-200"];
    for (let tab of this.tabs) {
      if (tab.getAttribute("aria-controls") == id) {
        tab.setAttribute("aria-selected", "true");
        activeTabClass.forEach((i) => tab.classList.add(i));
        !skipFocus && tab.focus();
        this.activeTab = tab;
      } else {
        tab.setAttribute("aria-selected", "false");
        activeTabClass.forEach((i) => tab.classList.remove(i));
      }
    }
    for (let tabpanel of this.tabpanels) {
      if (tabpanel.getAttribute("id") == id) {
        if (tabpanel.getAttribute("aria-expanded") === "true") {
          !skipFocus && tabpanel.focus();
        } else {
          tabpanel.setAttribute("aria-expanded", "true");
        }
      } else {
        tabpanel.setAttribute("aria-expanded", "false");
      }
    }
  }

  checkUrlParameters() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let { tab, question } = params;

    if (tab) {
      this.setActiveTab(`tab-${tab}`, true);

      if (question) {
        const questionEl = this.querySelector(
          `#tab-${tab} ul.accordion li:nth-child(${question}) details`
        );

        if (questionEl) {
          questionEl.setAttribute("open", "");
          setTimeout(() => questionEl.scrollIntoView({ block: "start" }), 1000);
        }
      }
    }
  }
}
customElements.define("tab-controller", TabController);

class HorizontalScrollBox extends HTMLElement {
  constructor() {
    super();
    this.scrollBox = this.querySelector(".scroll-box");
    this.navNext = this.querySelector("nav .next");
    this.navPrev = this.querySelector("nav .prev");

    this.addEventListeners();
    this.handleShowNav();
  }

  addEventListeners() {
    if (this.scrollBox.getBoundingClientRect().width < this.scrollBox.scrollWidth) {
      this.navNext.addEventListener("click", () => this.scrollContainer("next"));
      this.navPrev.addEventListener("click", () => this.scrollContainer("prev"));

      this.scrollBox.addEventListener("scroll", this.handleShowNav.bind(this));
    }
  }

  scrollContainer(direction) {
    this.scrollBox.scrollTo({
      left:
        direction === "next" ? this.scrollBox.scrollLeft + 120 : this.scrollBox.scrollLeft - 120,
      behavior: "smooth",
    });
  }

  handleShowNav() {
    this.navNext.classList.toggle(
      "nav-hide",
      this.scrollBox.scrollWidth - this.scrollBox.scrollLeft ==
        this.scrollBox.getBoundingClientRect().width
    );
    this.navPrev.classList.toggle("nav-hide", this.scrollBox.scrollLeft == 0);
  }
}
customElements.define("horizontal-scroll-box", HorizontalScrollBox);

// TODO: replace all sliders with CSS-only solution
// Glide.js: https://glidejs.com/docs/
class GlideSlider extends HTMLElement {
  constructor() {
    super();

    this.id = this.getAttribute("id");
    this.options = {};
    this.twBreakpoints = JSON.parse(
      '{"2xs":412,"xs":472,"sm":640,"md":768,"lg":1024,"xl":1280,"2xl":1536}'
    );

    const { breakpointLimit } = this.dataset;
    const viewportWidth = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    );
    if (breakpointLimit === "none") {
      this.initSlider();
    } else {
      if (viewportWidth <= this.twBreakpoints[breakpointLimit]) {
        this.initSlider();
      } else {
        this.classList.remove("glide");
        this.classList.add("relative");

        const track = this.querySelector(".glide__track");
        const slides = this.querySelector(".glide__slides");

        track.classList.forEach((i) => {
          if (i !== "glide__track") {
            slides.classList.add(i);
          }
        });

        track.replaceWith(...track.childNodes);
      }
    }
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
    optionClasses.forEach((className) => {
      const splitClass = className.split(/[\:\.\-]/);

      // if class has breakpoint modifier
      if (className.includes(":")) {
        const breakpointInt = this.twBreakpoints[splitClass[0]];

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
      const optionTypes = ["perView", "peek", "focusAt", "type", "bound", "gap", "autoplay"];
      const optionClasses = classes.filter((className) =>
        optionTypes.some((optionType) => className.includes(optionType))
      );

      if (optionClasses.length > 0) {
        this.getOptions(optionClasses);
      }
    }
    new Glide(`#${this.id}`, this.options).mount();
  }
}
customElements.define("glide-slider", GlideSlider);

class GiftWithPurchaseUrl extends HTMLElement {
  constructor() {
    super();

    this.cart =
      document.querySelector("cart-notification") || document.querySelector("cart-drawer");
    const { productId } = this.dataset;

    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let gwpParam = params.gwp;

    if (gwpParam === productId) {
      this.checkGiftQualifiers();
    }
  }

  checkGiftQualifiers() {
    const { threshold, variantId } = this.dataset;

    fetch(window.Shopify.routes.root + "cart.js")
      .then((response) => response.json())
      .then((data) => {
        if (!data.items.map((i) => i.id).includes(variantId)) {
          if (Number(threshold) === 0) {
            this.cart.addFreeGift(variantId);
          } else if (Number(threshold) > 0) {
            if (localStorage.getItem("osea.gwpUrlVariantId") !== variantId) {
              document.getElementById("GwpUrlModal").show();
              localStorage.setItem("osea.gwpUrlVariantId", variantId);
            }

            if (data.total_price >= threshold) {
              this.cart.addFreeGift(variantId);
            }
          }
        }
      })
      .catch((error) => console.error(error));
  }
}
customElements.define("gift-with-purchase-url", GiftWithPurchaseUrl);

class CountdownComponent extends HTMLElement {
  constructor() {
    super();
    this.updateTimer();
  }

  updateTimer() {
    setInterval(() => {
      const dateArray = this.dataset.date.split("/");
      const sortedDateArray = [dateArray[2], dateArray[0], dateArray[1]];
      const future = new Date(`${sortedDateArray.join("-")}T${this.dataset.time}:00-07:00`);
      const now = new Date();
      const diff = future - now;

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor(diff / (1000 * 60));
      const s = Math.floor(diff / 1000);

      this.querySelector(".countdown-days").textContent = d;
      this.querySelector(".countdown-hours").textContent = h - d * 24;
      this.querySelector(".countdown-minutes").textContent = m - h * 60;
      this.querySelector(".countdown-seconds").textContent = s - m * 60;
    }, 1000);
  }
}
customElements.define("countdown-component", CountdownComponent);

class GiftCardFields extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onInputChange);
  }

  onInputChange(event) {
    document.querySelector(`product-form.pdp-product-form #sktc${event.target.id}`).value =
      event.target.value;
  }
}
customElements.define("gift-card-fields", GiftCardFields);

class CollectionAnchors extends HTMLElement {
  constructor() {
    super();

    this.querySelectorAll("a").forEach((anchor) =>
      anchor.addEventListener("click", () => this.onAnchorClick(anchor))
    );
  }

  onAnchorClick(anchor) {
    document.querySelectorAll("details.subcollection").forEach((subcollection) => {
      if (subcollection.id === anchor.getAttribute("href").substring(1)) {
        subcollection.setAttribute("open", "");
      } else {
        subcollection.removeAttribute("open");
      }
    });
  }
}
customElements.define("collection-anchors", CollectionAnchors);

class CollectionVideo extends HTMLElement {
  constructor() {
    super();

    this.verticalVideo = this.querySelector(".vertical-video");
    this.horizontalVideo = this.querySelector(".horizontal-video");
    this.closeButton = this.querySelector(".video-close");

    this.closeButton.addEventListener("click", this.closeHorizontalVideo.bind(this));
  }

  connectedCallback() {
    if (!localStorage.getItem("osea.hideCollectionVideo")) {
      this.videoObserver = new IntersectionObserver((entries) => {
        if (entries[0].intersectionRatio <= 0) {
          this.showHorizontalVideo();
        } else {
          this.hideHorizontalVideo();
        }
      });

      this.videoObserver.observe(this.verticalVideo);
    }
  }

  disconnectedCallback() {
    if (this.videoObserver) {
      this.videoObserver.disconnect();
    }
  }

  hideHorizontalVideo() {
    this.horizontalVideo.classList.remove("opacity-100", "visible");
    this.horizontalVideo.classList.add("opacity-0", "invisible");
  }

  showHorizontalVideo() {
    this.horizontalVideo.classList.add("opacity-100", "visible");
    this.horizontalVideo.classList.remove("opacity-0", "invisible");
  }

  closeHorizontalVideo(event) {
    event.preventDefault();
    this.hideHorizontalVideo();
    this.videoObserver.disconnect();
    localStorage.setItem("osea.hideCollectionVideo", true);
  }
}
customElements.define("collection-video", CollectionVideo);

// TODO: consider removing - replace with css only solution, or move to only pages that use it
class Accordion {
  constructor(el) {
    this.el = el;
    this.summary = el.querySelector("summary");
    this.content = el.querySelector(".content");
    this.duration = parseInt(el.dataset.duration);

    this.animation = null;
    this.isCollapsing = false;
    this.isExpanding = false;

    this.summary.addEventListener("click", (e) => this.onClick(e));
  }

  onClick(e) {
    e.preventDefault();
    this.el.style.overflow = "hidden";
    if (this.isCollapsing || !this.el.open) {
      this.open();
    } else if (this.isExpanding || this.el.open) {
      this.shrink();
    }
  }

  shrink() {
    this.isCollapsing = true;

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
    this.animation.oncancel = () => (this.isCollapsing = false);
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
    this.isCollapsing = false;
    this.isExpanding = false;
    this.el.style.height = this.el.style.overflow = "";
  }
}
document.querySelectorAll("details.accordion").forEach((el) => {
  new Accordion(el);
});
