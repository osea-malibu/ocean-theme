import { onKeyUpEscape, focusVisiblePolyfill } from "./utils.js";

/**
 * Adds aria attributes to summary elements
 */
export function setupSummaryAriaAttributes() {
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
    summary.parentElement.addEventListener("keyup", (event) => onKeyUpEscape(event));
  });
}

/**
 * Adds polyfill for browsers that don't support :focus-visible
 */
export function setupFocusVisiblePolyfill() {
  try {
    document.querySelector(":focus-visible");
  } catch {
    focusVisiblePolyfill();
  }
}

/**
 * Intersection observer to add/remove border to header when scrolling
 * + also show navbar only at top
 */
export function setupHeaderBorderObserver() {
  const headerWrapper = document.querySelector("#HeaderContent");
  const pixelTarget = document.querySelector("#HeaderScrollPixel");
  const navbar = document.getElementById("SiteNavbar");
  if (!pixelTarget) return;

  const io = new IntersectionObserver((entries) => {
    const entry = entries[0];

    // Existing border behavior (unchanged)
    if (headerWrapper) {
      if (entry.boundingClientRect.y < 0) {
        headerWrapper.classList.add("border-seaweed-300");
        headerWrapper.classList.remove("border-transparent");
      } else {
        headerWrapper.classList.remove("border-seaweed-300");
        headerWrapper.classList.add("border-transparent");
      }
    }

    // Visible only at top: use transform/opacity (no layout shift)
    if (navbar) {
      if (entry.boundingClientRect.y < 0) {
        navbar.classList.add("-mt-7", "opacity-0", "pointer-events-none");
        navbar.classList.remove("-mt-1", "opacity-100");
      } else {
        navbar.classList.remove("-mt-7", "opacity-0", "pointer-events-none");
        navbar.classList.add("-mt-1", "opacity-100");
      }
    }
  });

  io.observe(pixelTarget);
}

/**
 * Add lazy loading to video elements with class "lazy"
 */
export function setupLazyVideos() {
  const lazyVideos = [].slice.call(document.querySelectorAll("video.lazy"));

  if (!lazyVideos.length) return;

  let observer = new IntersectionObserver((entries, observer) => {
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
        observer.unobserve(video.target);
      }
    });
  });

  lazyVideos.forEach((lazyVideo) => observer.observe(lazyVideo));
}

/**
 * Add redirects for pages that are not handled by Shopify
 */
export function setupManualRedirects() {
  const pathname = window.location.pathname;
  const utmSource = new URLSearchParams(window.location.search).get("utm_source");
  const utmMedium = new URLSearchParams(window.location.search).get("utm_medium");

  const loopBundles = [
    "/a/loop_subscriptions/bundle/f32e72b2b9174c49afc9418fdc687742",
    "/a/loop_subscriptions/bundle/eee9c289024140ab984c3fb75988e223",
    "/a/loop_subscriptions/bundle/b4e1b70501be453eaeac952c14a0a778",
  ];

  if (loopBundles.includes(pathname)) {
    window.location.replace("https://oseamalibu.com/collections/skincare-sets");
  }

  if (pathname === "/pages/labor-day-2024") {
    if (utmSource === "facebook_ad" && utmMedium === "display") {
      window.location.replace("https://oseamalibu.com/collections/body-care");
    }
  }
}

/**
 * Adds Shopify common functions to the window object
 */
export function setupShopifyCommon() {
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

    countryHandler: function () {
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
}
