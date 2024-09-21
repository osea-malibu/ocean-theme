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

/* Manual Redirects */
if (window.location.pathname === "/a/loop_subscriptions/bundle/eee9c289024140ab984c3fb75988e223") {
  window.location.replace("https://oseamalibu.com/collections/skincare-sets-1");
}
if (window.location.pathname === "/pages/labor-day-2024") {
  if (utmSource === "facebook_ad" && utmMedium === "display") {
    window.location.replace("https://oseamalibu.com/collections/body-care");
  }
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

class IngredientGlossary extends HTMLElement {
  constructor() {
    super();
    this.selectedCategories = [];
    this.sortByValue = 'az';
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.metaObjects = [];
    this.loading = true;
    
    this.filterForm = document.getElementById('filter-form');
    this.sortForm = document.getElementById('sort-form');
    this.listCountFieldset = document.getElementById('list-count');

    // Initialize filters, sorts, and list count from URL if available
    this.initializeFromUrl();

    // Set up event listeners
    this.initializeFilters();
    this.initializeSorts();
    this.initializeListCount();
    
    // Fetch ingredients and render page
    this.getAllIngredients();
  }

  // Initialize the state from URL parameters
  initializeFromUrl() {
    const params = new URLSearchParams(window.location.search);
  
    // Set page if present
    if (params.has('page')) {
      this.currentPage = parseInt(params.get('page'), 10);
    }
  
    // Set categories if present
    if (params.has('category')) {
      this.selectedCategories = params.get('category').split(',');
      this.filterForm.querySelectorAll('input[name="category"]').forEach((checkbox) => {
        if (this.selectedCategories.includes(checkbox.value)) {
          checkbox.checked = true;
        } else {
          checkbox.checked = false;
        }
      });
  
      // Uncheck the 'All' checkbox if specific categories are selected
      const allCheckbox = this.filterForm.querySelector('input[value="all"]');
      if (this.selectedCategories.length > 0 && !this.selectedCategories.includes('all')) {
        allCheckbox.checked = false;
      } else {
        allCheckbox.checked = true; // Check 'All' if no specific category is selected
      }
    }
  
    // Set sort if present
    if (params.has('sort')) {
      this.sortByValue = params.get('sort');
      this.sortForm.querySelector('select').value = this.sortByValue;
    }
  
    // Set list count if present
    if (params.has('listcount')) {
      const listCount = params.get('listcount');
      this.itemsPerPage = parseInt(listCount, 10); // Parse specific counts
      const listCountInput = this.listCountFieldset.querySelector(`input[value="${listCount}"]`);
      if (listCountInput) {
        listCountInput.checked = true; // Set the checked property if the input exists
      } else {
        console.warn(`Input with value "${listCount}" not found.`);
      }
  
      // Update the bold class on the currently selected list count label
      this.listCountFieldset.querySelectorAll('label').forEach((label) => {
        label.classList.remove('font-bold'); // Remove bold from all labels
      });
      const listCountLabel = this.listCountFieldset.querySelector(`label[for="${listCount}"]`);
      if (listCountLabel) {
        listCountLabel.classList.add('font-bold'); // Add bold to the selected label
      }
    }
  
    // After initializing, apply filters and render the page
    this.renderPage(); // Ensure that the page is rendered with the applied filters
  }

  // Update the URL with the current settings
  updateUrlParams() {
    const params = new URLSearchParams();
  
    // Add page
    params.set('page', this.currentPage);
  
    // Add categories
    if (this.selectedCategories.length > 0) {
      params.set('category', this.selectedCategories.join(','));
    }
  
    // Add sort option
    params.set('sort', this.sortByValue);
  
    // Add list count
    params.set('listcount', this.itemsPerPage); // Always use the numerical value (e.g., 10, 50, 100)
  
    // Update the URL without reloading the page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, '', newUrl);
  }
  
  // Async method to fetch all metaobjects
  async fetchAllMetaObjects() {
    const storefrontAccessToken = '2cca99031c2d35261e7d140b5a386156';
    const shopifyStoreDomain = 'osea-malibu.myshopify.com';
  
    const query = `
      query($first: Int!, $after: String) {
        metaobjects(first: $first, after: $after, type: "ingredient_glossary") {
          edges {
            node {
              id
              fields {
                key
                value
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;
  
    let allMetaObjects = [];
    let hasNextPage = true;
    let cursor = null;
  
    // Loop to fetch all pages of metaobjects
    while (hasNextPage) {
      const response = await fetch(`https://${shopifyStoreDomain}/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
        },
        body: JSON.stringify({
          query: query,
          variables: {
            first: 50, // Fetch 50 items at a time
            after: cursor,
          },
        }),
      });
  
      const data = await response.json();
  
      // Check for GraphQL errors
      if (data.errors) {
        console.error('GraphQL Error:', data.errors);
        return [];
      }
  
      // Ensure metaobjects field exists
      if (data.data && data.data.metaobjects) {
        const metaobjects = data.data.metaobjects.edges.map(edge => edge.node);
        allMetaObjects = allMetaObjects.concat(metaobjects); // Collect all items
        hasNextPage = data.data.metaobjects.pageInfo.hasNextPage; // Check if there's more to fetch
  
        // Update cursor for the next batch
        if (hasNextPage) {
          cursor = data.data.metaobjects.edges[data.data.metaobjects.edges.length - 1].cursor;
        }
      } else {
        console.error('No metaobjects found in the response');
        hasNextPage = false;  // Stop if no data is found
      }
    }
  
    return allMetaObjects; // Return all fetched metaobjects
  }

  // Fetch and log all ingredients
  async getAllIngredients() {
    try {
      this.loading = true; // Show loading state
      const allMetaObjects = await this.fetchAllMetaObjects();
      this.metaObjects = allMetaObjects; // Store fetched ingredients
      this.loading = false; // Hide loading state
      this.renderPage(); // Render the page with the applied filters and sorting
    } catch (error) {
      console.error('Error fetching metaobjects:', error);
      this.loading = false;
    }
  }

  // Initialize the category filter
  initializeFilters() {
    this.filterForm.addEventListener('change', (event) => {
      const categoryCheckboxes = this.filterForm.querySelectorAll('input[name="category"]');
      const allCheckbox = this.filterForm.querySelector('input[value="all"]');
  
      if (event.target.value === 'all') {
        if (event.target.checked) {
          // If 'All' is selected, uncheck all specific category checkboxes
          categoryCheckboxes.forEach((checkbox) => {
            checkbox.checked = true;
            categoryDropdownText.innerText = 'All';
          });
        } else {
          // If 'All' is deselected, uncheck all categories
          categoryCheckboxes.forEach((checkbox) => {
            checkbox.checked = false;
            categoryDropdownText.innerText = 'All';
          });
        }
        this.selectedCategories = []; // Reset selected categories
      } else {
        // If a specific category is checked, uncheck the 'All' checkbox
        const categoryDropdownText = this.querySelector('.category-dropdown-text');
        const selectedCheckboxes = this.filterForm.querySelectorAll('input[name="category"]:checked');
        this.selectedCategories = Array.from(selectedCheckboxes).map((checkbox) => checkbox.value);
  
        // Uncheck the 'All' checkbox if any specific category is selected
        if (this.selectedCategories.length > 0 && this.selectedCategories.length < categoryCheckboxes.length) {
          allCheckbox.checked = false;
          categoryDropdownText.innerText = `${this.selectedCategories.join(', ')}`;
        }
  
        // Check 'All' checkbox if all categories are selected
        if (this.selectedCategories.length === categoryCheckboxes.length) {
          allCheckbox.checked = true;
          categoryDropdownText.innerText = 'All';
        }
      }
  
      this.currentPage = 1; // Reset to the first page
      this.updateUrlParams(); // Update the URL
      this.renderPage(); // Re-render the list with the filtered items
    });
  }

  // Initialize the sort options
  initializeSorts() {
    this.sortForm.addEventListener('change', (event) => {
      this.sortByValue = event.target.value;
      this.currentPage = 1; // Reset to the first page
      this.updateUrlParams(); // Update the URL
      this.renderPage(); // Re-render the list with the filtered items
    });
  }

  // Initialize the list count change
  initializeListCount() {
    this.listCountFieldset.addEventListener('change', (event) => {
      const selectedCount = event.target.value;
  
      // Update the itemsPerPage based on the selected count
      this.itemsPerPage = parseInt(selectedCount, 10); // Parse as a number for specific counts
  
      // Update the radio button labels to apply the 'font-bold' class to the selected one
      this.listCountFieldset.querySelectorAll('label').forEach((label) => {
        label.classList.remove('font-bold'); // Remove bold from all labels
      });
      this.listCountFieldset.querySelector(`label[for="${selectedCount}"]`).classList.add('font-bold'); // Add bold to the selected label
  
      this.currentPage = 1; // Reset to the first page
      this.updateUrlParams(); // Update the URL
      this.renderPage(); // Re-render the page with the new item count
    });
  }

  // Filter and paginate the metaobjects
  filterItems() {
    // If the "All" checkbox is checked, or no specific categories are selected, return all items
    const allCheckbox = this.filterForm.querySelector('input[value="all"]');
    if (this.selectedCategories.length === 0 || allCheckbox.checked) {
      return this.metaObjects;
    }
  
    // Filter the metaobjects based on the selected categories
    return this.metaObjects.filter((item) => {
      const categoryField = item.fields.find((field) => field.key === 'category');
      if (categoryField) {
        const categoryArray = JSON.parse(categoryField.value); // Assume this is a JSON array of categories
        // Return true if any category in the ingredient matches a selected category
        return categoryArray.some((category) => this.selectedCategories.includes(category));
      }
      return false;
    });
  }

  // Render a specific page of items
  renderPage() {    
    const ingredientContainer = this.querySelector('.ingredient-list');
    ingredientContainer.querySelector('div:first-of-type').focus(); // Set focus to first list item
    
    const skeletonList = this.querySelector('.skeleton-list');
    if (this.loading) {
      skeletonList.classList.remove('hidden');  // Show skeleton when loading
      ingredientContainer.classList.add('hidden');  // Hide ingredients list
      return;
    } else {
      skeletonList.classList.add('hidden');  // Hide skeleton when loaded
      ingredientContainer.classList.remove('hidden');  // Show ingredients list
    }
    
    const filteredItems = this.filterItems();
    const findNameValue = (object) => object.fields.find((i) => i.key === 'name').value;
    const sortedAzItems = filteredItems.sort((a, b) => findNameValue(a).localeCompare(findNameValue(b)));
    const filteredSortedItems = this.sortByValue === 'az' ? sortedAzItems : sortedAzItems.reverse();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, filteredSortedItems.length);
    const paginatedItems = filteredSortedItems.slice(startIndex, endIndex);
    
    const resultsElement = this.querySelector('.results-count');
    resultsElement.innerHTML = `${filteredItems.length} results`;

    ingredientContainer.innerHTML = ''; // Clear the previous content

    // Add the paginated items to the container
    paginatedItems.forEach(item => {
      const nameField = item.fields.find(field => field.key === 'name');
      const commonNameField = item.fields.find(field => field.key === 'common_name');
      const definitionField = item.fields.find(field => field.key === 'definition');
      const categoryField = item.fields.find(field => field.key === 'category');
      const categoryArray = categoryField ? JSON.parse(categoryField.value) : [];
      const tagClass = 'rounded-full px-2 py-0.5 bg-wave-200 text-xs';

      const itemElement = document.createElement('div');
      itemElement.classList.add('border-b', 'border-seaweed-300', 'flex', 'flex-col', 'justify-center', 'min-h-32', 'py-3');
      itemElement.innerHTML = `
        <h3><b>${nameField ? nameField.value : 'Unnamed'}</b></h3>
        ${commonNameField ? `<em>${commonNameField.value}</em>` : ''}
        <p>${definitionField ? definitionField.value : ''}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          ${categoryArray.map((i) => `<div class="${tagClass}">${i}</div>`).join('')}
        </div>
      `;

      ingredientContainer.appendChild(itemElement);
    });

    // Display the current count (e.g., "Showing 1 - 10 of 308")
    const currentCountElement = this.querySelector('.current-count');
    currentCountElement.textContent = `Showing ${startIndex + 1} - ${endIndex} of ${filteredItems.length}`;

    this.renderPagination(filteredItems.length); // Update pagination controls
  }

  // Render pagination controls
  renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    const paginationContainer = this.querySelector('.pagination');
    paginationContainer.innerHTML = ''; // Clear previous pagination

    const maxVisiblePages = 2; // Number of pages to show before and after the current page

    // Previous page link
    if (this.currentPage > 1) {
      const prevLink = document.createElement('a');
      prevLink.classList.add('px-1');
      prevLink.href = '#';
      prevLink.setAttribute('aria-label', 'Go to previous page');
      prevLink.innerHTML = `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Previous">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>`;
      prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentPage--;
        this.updateUrlParams(); // Update URL on pagination change
        this.renderPage();
      });
      paginationContainer.appendChild(prevLink);
    }

    // First page link
    const firstPageLink = document.createElement('a');
    firstPageLink.href = '#';
    firstPageLink.textContent = 1;
    firstPageLink.classList.add('w-4');
    firstPageLink.setAttribute('aria-label', 'Go to first page');
    if (this.currentPage === 1) {
      firstPageLink.classList.add('font-bold'); // Bold current page
    }
    firstPageLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.currentPage = 1;
      this.updateUrlParams(); // Update URL on pagination change
      this.renderPage();
    });
    paginationContainer.appendChild(firstPageLink);

    // Ellipsis after first page if needed
    if (this.currentPage > maxVisiblePages + 2) {
      const ellipsis = document.createElement('span');
      ellipsis.classList.add('font-bold');
      ellipsis.textContent = '…';
      paginationContainer.appendChild(ellipsis);
    }

    // Pages around the current page
    const startPage = Math.max(2, this.currentPage - maxVisiblePages);
    const endPage = Math.min(totalPages - 1, this.currentPage + maxVisiblePages);

    for (let i = startPage; i <= endPage; i++) {
      const pageLink = document.createElement('a');
      pageLink.classList.add('w-4');
      pageLink.href = '#';
      pageLink.textContent = i;
      pageLink.setAttribute('aria-label', `Go to page ${i}`);
      if (i === this.currentPage) {
        pageLink.classList.add('font-bold'); // Bold current page
      }
      pageLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentPage = i;
        this.updateUrlParams(); // Update URL on pagination change
        this.renderPage();
      });
      paginationContainer.appendChild(pageLink);
    }

    // Ellipsis before last page if needed
    if (this.currentPage < totalPages - maxVisiblePages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.classList.add('font-bold');
      ellipsis.textContent = '…';
      paginationContainer.appendChild(ellipsis);
    }

    // Last page link
    if (totalPages > 1) {
      const lastPageLink = document.createElement('a');
      lastPageLink.href = '#';
      lastPageLink.textContent = totalPages;
      lastPageLink.setAttribute('aria-label', `Go to page ${totalPages}`);
      if (this.currentPage === totalPages) {
        lastPageLink.classList.add('font-bold'); // Bold current page
      }
      lastPageLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentPage = totalPages;
        this.updateUrlParams(); // Update URL on pagination change
        this.renderPage();
      });
      paginationContainer.appendChild(lastPageLink);
    }

    // Next page link
    if (this.currentPage < totalPages) {
      const nextLink = document.createElement('a');
      nextLink.classList.add('px-1');
      nextLink.href = '#';
      nextLink.setAttribute('aria-label', 'Go to next page');
      nextLink.innerHTML = `<svg class="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Next">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>`;
      nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentPage++;
        this.updateUrlParams(); // Update URL on pagination change
        this.renderPage();
      });
      paginationContainer.appendChild(nextLink);
    }
  }
}
customElements.define("ingredient-glossary", IngredientGlossary);

class ShippingCalculator extends HTMLElement {
  constructor() {
    super();

    this.zipForm = this.querySelector("form");
    this.zipInput = this.querySelector("#shippingzip");
    this.output = this.querySelector("#transitTimeOutput");

    this.zipForm.addEventListener("submit", (e) => this.onZipSubmit(e));
  }

  onZipSubmit(e) {
    e.preventDefault();

    const { st, transitTime } = this.getStateData(this.zipInput.value);
    const { transitionStart, transitionEnd } = this.output.dataset;

    this.output.innerHTML = `${st}: ${transitTime}`;
    this.output.classList.remove(...transitionStart.split(" "));
    this.output.classList.add(...transitionEnd.split(" "));
  }

  getStateData(zipString) {
    /* Ensure param is a string to prevent unpredictable parsing results */
    if (typeof zipString !== "string") {
      console.error("Must pass the zipcode as a string.");
      return;
    }

    /* Ensure we have exactly 5 characters to parse */
    if (zipString.length !== 5) {
      console.error("Must pass a 5-digit zipcode.");
      return;
    }

    /* Ensure we don't parse strings starting with 0 as octal values */
    const zipcode = parseInt(zipString, 10);

    let st;
    let state;
    let transitTime;

    /* Code cases alphabetized by state */
    if (zipcode >= 35000 && zipcode <= 36999) {
      st = "AL";
      state = "Alabama";
      transitTime = "5-6 days";
    } else if (zipcode >= 99500 && zipcode <= 99999) {
      st = "AK";
      state = "Alaska";
      transitTime = "5-6 days";
    } else if (zipcode >= 85000 && zipcode <= 86999) {
      st = "AZ";
      state = "Arizona";
      transitTime = "2-3 days";
    } else if (zipcode >= 71600 && zipcode <= 72999) {
      st = "AR";
      state = "Arkansas";
      transitTime = "4-5 days";
    } else if (zipcode >= 90000 && zipcode <= 96699) {
      st = "CA";
      state = "California";
      transitTime = "2-3 days";
    } else if (zipcode >= 80000 && zipcode <= 81999) {
      st = "CO";
      state = "Colorado";
      transitTime = "3-4 days";
    } else if ((zipcode >= 6000 && zipcode <= 6389) || (zipcode >= 6391 && zipcode <= 6999)) {
      st = "CT";
      state = "Connecticut";
      transitTime = "5-6 days";
    } else if (zipcode >= 19700 && zipcode <= 19999) {
      st = "DE";
      state = "Delaware";
      transitTime = "5-6 days";
    } else if (zipcode >= 32000 && zipcode <= 34999) {
      st = "FL";
      state = "Florida";
      transitTime = "5-6 days";
    } else if ((zipcode >= 30000 && zipcode <= 31999) || (zipcode >= 39800 && zipcode <= 39999)) {
      st = "GA";
      state = "Georgia";
      transitTime = "4-5 days";
    } else if (zipcode >= 96700 && zipcode <= 96999) {
      st = "HI";
      state = "Hawaii";
      transitTime = "5-6 days";
    } else if (zipcode >= 83200 && zipcode <= 83999 && zipcode != 83414) {
      st = "ID";
      state = "Idaho";
      transitTime = "3-4 days";
    } else if (zipcode >= 60000 && zipcode <= 62999) {
      st = "IL";
      state = "Illinois";
      transitTime = "5-6 days";
    } else if (zipcode >= 46000 && zipcode <= 47999) {
      st = "IN";
      state = "Indiana";
      transitTime = "5-6 days";
    } else if (zipcode >= 50000 && zipcode <= 52999) {
      st = "IA";
      state = "Iowa";
      transitTime = "4-5 days";
    } else if (zipcode >= 66000 && zipcode <= 67999) {
      st = "KS";
      state = "Kansas";
      transitTime = "4-5 days";
    } else if (zipcode >= 40000 && zipcode <= 42999) {
      st = "KY";
      state = "Kentucky";
      transitTime = "4-5 days";
    } else if (zipcode >= 70000 && zipcode <= 71599) {
      st = "LA";
      state = "Louisiana";
      transitTime = "4-5 days";
    } else if (zipcode >= 3900 && zipcode <= 4999) {
      st = "ME";
      state = "Maine";
      transitTime = "5-6 days";
    } else if (zipcode >= 20600 && zipcode <= 21999) {
      st = "MD";
      state = "Maryland";
      transitTime = "5-6 days";
    } else if ((zipcode >= 1000 && zipcode <= 2799) || zipcode == 5501 || zipcode == 5544) {
      st = "MA";
      state = "Massachusetts";
      transitTime = "5-6 days";
    } else if (zipcode >= 48000 && zipcode <= 49999) {
      st = "MI";
      state = "Michigan";
      transitTime = "4-5 days";
    } else if (zipcode >= 55000 && zipcode <= 56899) {
      st = "MN";
      state = "Minnesota";
      transitTime = "4-5 days";
    } else if (zipcode >= 38600 && zipcode <= 39999) {
      st = "MS";
      state = "Mississippi";
      transitTime = "4-5 days";
    } else if (zipcode >= 63000 && zipcode <= 65999) {
      st = "MO";
      state = "Missouri";
      transitTime = "4-5 days";
    } else if (zipcode >= 59000 && zipcode <= 59999) {
      st = "MT";
      state = "Montana";
      transitTime = "4-5 days";
    } else if (zipcode >= 68000 && zipcode <= 69999) {
      st = "NE";
      state = "Nebraska";
      transitTime = "4-5 days";
    } else if (zipcode >= 88900 && zipcode <= 89999) {
      st = "NV";
      state = "Nevada";
      transitTime = "2-3 days";
    } else if (zipcode >= 3000 && zipcode <= 3899) {
      st = "NH";
      state = "New Hampshire";
      transitTime = "5-6 days";
    } else if (zipcode >= 7000 && zipcode <= 8999) {
      st = "NJ";
      state = "New Jersey";
      transitTime = "5-6 days";
    } else if (zipcode >= 87000 && zipcode <= 88499) {
      st = "NM";
      state = "New Mexico";
      transitTime = "3-4 days";
    } else if (
      (zipcode >= 10000 && zipcode <= 14999) ||
      zipcode == 6390 ||
      zipcode == 501 ||
      zipcode == 544
    ) {
      st = "NY";
      state = "New York";
      transitTime = "5-6 days";
    } else if (zipcode >= 27000 && zipcode <= 28999) {
      st = "NC";
      state = "North Carolina";
      transitTime = "4-5 days";
    } else if (zipcode >= 58000 && zipcode <= 58999) {
      st = "ND";
      state = "North Dakota";
      transitTime = "3-4 days";
    } else if (zipcode >= 43000 && zipcode <= 45999) {
      st = "OH";
      state = "Ohio";
      transitTime = "4-5 days";
    } else if ((zipcode >= 73000 && zipcode <= 73199) || (zipcode >= 73400 && zipcode <= 74999)) {
      st = "OK";
      state = "Oklahoma";
      transitTime = "3-4 days";
    } else if (zipcode >= 97000 && zipcode <= 97999) {
      st = "OR";
      state = "Oregon";
      transitTime = "3-4 days";
    } else if (zipcode >= 15000 && zipcode <= 19699) {
      st = "PA";
      state = "Pennsylvania";
      transitTime = "5-6 days";
    } else if (zipcode >= 300 && zipcode <= 999) {
      st = "PR";
      state = "Puerto Rico";
      transitTime = "5-6 days";
    } else if (zipcode >= 2800 && zipcode <= 2999) {
      st = "RI";
      state = "Rhode Island";
      transitTime = "5-6 days";
    } else if (zipcode >= 29000 && zipcode <= 29999) {
      st = "SC";
      state = "South Carolina";
      transitTime = "4-5 days";
    } else if (zipcode >= 57000 && zipcode <= 57999) {
      st = "SD";
      state = "South Dakota";
      transitTime = "3-4 days";
    } else if (zipcode >= 37000 && zipcode <= 38599) {
      st = "TN";
      state = "Tennessee";
      transitTime = "4-5 days";
    } else if (
      (zipcode >= 75000 && zipcode <= 79999) ||
      (zipcode >= 73301 && zipcode <= 73399) ||
      (zipcode >= 88500 && zipcode <= 88599)
    ) {
      st = "TX";
      state = "Texas";
      transitTime = "3-4 days";
    } else if (zipcode >= 84000 && zipcode <= 84999) {
      st = "UT";
      state = "Utah";
      transitTime = "3-4 days";
    } else if (zipcode >= 5000 && zipcode <= 5999) {
      st = "VT";
      state = "Vermont";
      transitTime = "5-6 days";
    } else if (
      (zipcode >= 20100 && zipcode <= 20199) ||
      (zipcode >= 22000 && zipcode <= 24699) ||
      zipcode == 20598
    ) {
      st = "VA";
      state = "Virginia";
      transitTime = "4-5 days";
    } else if (
      (zipcode >= 20000 && zipcode <= 20099) ||
      (zipcode >= 20200 && zipcode <= 20599) ||
      (zipcode >= 56900 && zipcode <= 56999)
    ) {
      st = "DC";
      state = "Washington DC";
      transitTime = "4-5 days";
    } else if (zipcode >= 98000 && zipcode <= 99499) {
      st = "WA";
      state = "Washington";
      transitTime = "3-4 days";
    } else if (zipcode >= 24700 && zipcode <= 26999) {
      st = "WV";
      state = "West Virginia";
      transitTime = "5-6 days";
    } else if (zipcode >= 53000 && zipcode <= 54999) {
      st = "WI";
      state = "Wisconsin";
      transitTime = "4-5 days";
    } else if ((zipcode >= 82000 && zipcode <= 83199) || zipcode == 83414) {
      st = "WY";
      state = "Wyoming";
      transitTime = "4-5 days";
    } else {
      st = "none";
      state = "none";
      transitTime =
        "Sorry, we could not find that zipcode in our database. Please contact Customer Care for shipping times.";
    }

    return { st, state, transitTime };
  }
}
customElements.define("shipping-calculator", ShippingCalculator);

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
    this.addEventListener("change", () => {
      this.onVariantChange();
    });
    this.addEventListener("click", () => {});
  }

  connectedCallback() {
    const executeMethods = () => {
      this.updateOptions();
      this.updateMasterId();
      this.updateMedia();
    };
    document.addEventListener("DOMContentLoaded", executeMethods);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateIsSubscription();
    this.toggleAddButton(true, "", false);
    this.removeErrorMessage();
    this.resetPurchaseOption();

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

  resetPurchaseOption() {
    // reset purchase option to one-time
    if (
      window.location.pathname.includes("/products/") &&
      document.querySelector("subscription-radios")
    ) {
      document.querySelector(".purchase-option.onetime").classList.add("bg-wave-200");
      document.querySelector('input[value="onetime"]').checked = true;
      document.querySelector(".purchase-option.autodeliver").classList.remove("bg-wave-200");
      document.querySelector('input[value="autodeliver"]').checked = false;
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
        replaceContent(
          `[value="${id}"]:not(.mini-card-id-input) ~ button[name="add"] .price`,
          ".product .main-price"
        );
        replaceContent(".subscription .selling-plan-options");

        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  updateOptionVisibility() {
    if (this.currentVariant && window.location.pathname.includes("/products/")) {
      const subscriptionRadios = document.querySelector("subscription-radios");
      if (subscriptionRadios) {
        const allcoationGroupIds = this.currentVariant.selling_plan_allocations.map(
          (i) => i.selling_plan_group_id
        );
        const hasSubscriptionOption =
          this.currentVariant.selling_plan_allocations.length > 0 &&
          allcoationGroupIds.includes(subscriptionRadios.dataset.subscriptionGroupId);
        if (hasSubscriptionOption) {
          subscriptionRadios.classList.add("max-h-52");
          subscriptionRadios.classList.remove("max-h-0");
        } else {
          subscriptionRadios.classList.add("max-h-0");
          subscriptionRadios.classList.remove("max-h-52");
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

        const isSubscriptionInput = document.querySelector(
          'input[name="properties[_is_subscription]"]'
        );
        isSubscriptionInput.value = true;

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
    this.purchaseOptionInputs?.forEach((input) => {
      input.closest(".purchase-option").classList.toggle("bg-wave-200", input.checked);
      input.closest(".purchase-option").classList.toggle("bg-white", !input.checked);
    });
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
