class IngredientGlossary extends HTMLElement {
  constructor() {
    super();
    this.selectedCategories = [];
    this.sortByValue = "az";
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.metaObjects = [];
    this.loading = true;

    this.filterForm = document.getElementById("filter-form");
    this.sortForm = document.getElementById("sort-form");
    this.searchForm = document.getElementById("search-form");
    this.listCountFieldset = document.getElementById("list-count");

    // Initialize filters, sorts, and list count from URL if available
    this.initializeFromUrl();

    // Set up event listeners
    this.initializeFilters();
    this.initializeSorts();
    this.initializeSearch();
    this.initializeListCount();

    // Fetch ingredients and render page
    this.getAllIngredients();
  }

  // Initialize the state from URL parameters
  initializeFromUrl() {
    const params = new URLSearchParams(window.location.search);

    // Set page if present
    if (params.has("page")) {
      this.currentPage = parseInt(params.get("page"), 10);
    }

    // Set categories if present
    if (params.has("category")) {
      this.selectedCategories = params.get("category").split(",");
      this.filterForm.querySelectorAll('input[name="category"]').forEach((checkbox) => {
        if (this.selectedCategories.includes(checkbox.value)) {
          checkbox.checked = true;
        } else {
          checkbox.checked = false;
        }
      });

      // Uncheck the 'All' checkbox if specific categories are selected
      const allCheckbox = this.filterForm.querySelector('input[value="all"]');
      const categoryDropdownText = this.querySelector(".category-dropdown-text");
      if (this.selectedCategories.length > 0 && !this.selectedCategories.includes("all")) {
        allCheckbox.checked = false;
        categoryDropdownText.innerText = `${this.selectedCategories.join(", ")}`;
      } else {
        allCheckbox.checked = true; // Check 'All' if no specific category is selected
        categoryDropdownText.innerText = "All";
      }
    }

    // Set sort if present
    if (params.has("sort")) {
      this.sortByValue = params.get("sort");
      this.sortForm.querySelector("select").value = this.sortByValue;
    }

    // Set list count if present
    if (params.has("listcount")) {
      const listCount = params.get("listcount");
      this.itemsPerPage = parseInt(listCount, 10); // Parse specific counts
      const listCountInput = this.listCountFieldset.querySelector(`input[value="${listCount}"]`);
      if (listCountInput) {
        listCountInput.checked = true; // Set the checked property if the input exists
      } else {
        console.warn(`Input with value "${listCount}" not found.`);
      }

      // Update the bold class on the currently selected list count label
      this.listCountFieldset.querySelectorAll("label").forEach((label) => {
        label.classList.remove("font-bold"); // Remove bold from all labels
      });
      const listCountLabel = this.listCountFieldset.querySelector(`label[for="${listCount}"]`);
      if (listCountLabel) {
        listCountLabel.classList.add("font-bold"); // Add bold to the selected label
      }
    }

    // Set search query if present
    if (params.has("search")) {
      this.searchQuery = params.get("search").trim().toLowerCase();
      const searchInput = this.searchForm.querySelector('input[type="text"]');
      searchInput.value = this.searchQuery; // Populate the search field with the search query
    }

    // After initializing, apply filters and render the page
    this.renderPage(); // Ensure that the page is rendered with the applied filters
  }

  // Update the URL with the current settings
  updateUrlParams() {
    const params = new URLSearchParams();

    // Add page
    params.set("page", this.currentPage);

    // Add categories
    if (this.selectedCategories.length > 0) {
      params.set("category", this.selectedCategories.join(","));
    }

    // Add sort option
    params.set("sort", this.sortByValue);

    // Add list count
    params.set("listcount", this.itemsPerPage); // Always use the numerical value (e.g., 10, 50, 100)

    // Add search query
    if (this.searchQuery) {
      params.set("search", this.searchQuery); // Add search query if present
    }

    // Update the URL without reloading the page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, "", newUrl);
  }

  // Async method to fetch all metaobjects
  async fetchAllMetaObjects() {
    const storefrontAccessToken = "2cca99031c2d35261e7d140b5a386156";
    const shopifyStoreDomain = "osea-malibu.myshopify.com";

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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
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
        console.error("GraphQL Error:", data.errors);
        return [];
      }

      // Ensure metaobjects field exists
      if (data.data && data.data.metaobjects) {
        const metaobjects = data.data.metaobjects.edges.map((edge) => edge.node);
        allMetaObjects = allMetaObjects.concat(metaobjects); // Collect all items
        hasNextPage = data.data.metaobjects.pageInfo.hasNextPage; // Check if there's more to fetch

        // Update cursor for the next batch
        if (hasNextPage) {
          cursor = data.data.metaobjects.edges[data.data.metaobjects.edges.length - 1].cursor;
        }
      } else {
        console.error("No metaobjects found in the response");
        hasNextPage = false; // Stop if no data is found
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
      console.error("Error fetching metaobjects:", error);
      this.loading = false;
    }
  }

  // Initialize the category filter
  initializeFilters() {
    this.filterForm.addEventListener("change", (event) => {
      const categoryCheckboxes = this.filterForm.querySelectorAll('input[name="category"]');
      const allCheckbox = this.filterForm.querySelector('input[value="all"]');
      const categoryDropdownText = this.querySelector(".category-dropdown-text");

      if (event.target.value === "all") {
        if (event.target.checked) {
          // If 'All' is selected, uncheck all specific category checkboxes
          categoryCheckboxes.forEach((checkbox) => {
            checkbox.checked = true;
            categoryDropdownText.innerText = "All";
          });
        } else {
          // If 'All' is deselected, uncheck all categories
          categoryCheckboxes.forEach((checkbox) => {
            checkbox.checked = false;
            categoryDropdownText.innerText = "All";
          });
        }
        this.selectedCategories = []; // Reset selected categories
      } else {
        // If a specific category is checked, uncheck the 'All' checkbox
        const selectedCheckboxes = this.filterForm.querySelectorAll(
          'input[name="category"]:checked'
        );
        this.selectedCategories = Array.from(selectedCheckboxes).map((checkbox) => checkbox.value);

        // Uncheck the 'All' checkbox if any specific category is selected
        if (
          this.selectedCategories.length > 0 &&
          this.selectedCategories.length < categoryCheckboxes.length
        ) {
          allCheckbox.checked = false;
          categoryDropdownText.innerText = `${this.selectedCategories.join(", ")}`;
        }

        // Check 'All' checkbox if all categories are selected
        if (this.selectedCategories.length === categoryCheckboxes.length) {
          allCheckbox.checked = true;
          categoryDropdownText.innerText = "All";
        }
      }

      this.currentPage = 1; // Reset to the first page
      this.updateUrlParams(); // Update the URL
      this.renderPage(); // Re-render the list with the filtered items
    });
  }

  // Initialize the sort options
  initializeSorts() {
    this.sortForm.addEventListener("change", (event) => {
      this.sortByValue = event.target.value;
      this.currentPage = 1; // Reset to the first page
      this.updateUrlParams(); // Update the URL
      this.renderPage(); // Re-render the list with the filtered items
    });
  }

  // Initialize the search
  initializeSearch() {
    this.searchForm.addEventListener("submit", (event) => {
      event.preventDefault(); // Prevent the form from submitting and reloading the page

      const searchInput = this.searchForm
        .querySelector('input[type="text"]')
        .value.trim()
        .toLowerCase();
      this.searchQuery = searchInput; // Save the search query

      this.currentPage = 1; // Reset to the first page when a new search is performed
      this.updateUrlParams(); // Update the URL with the current state
      this.renderPage(); // Re-render the list with the filtered items
    });
  }

  // Initialize the list count change
  initializeListCount() {
    this.listCountFieldset.addEventListener("change", (event) => {
      const selectedCount = event.target.value;

      // Update the itemsPerPage based on the selected count
      this.itemsPerPage = parseInt(selectedCount, 10); // Parse as a number for specific counts

      // Update the radio button labels to apply the 'font-bold' class to the selected one
      this.listCountFieldset.querySelectorAll("label").forEach((label) => {
        label.classList.remove("font-bold"); // Remove bold from all labels
      });
      this.listCountFieldset
        .querySelector(`label[for="${selectedCount}"]`)
        .classList.add("font-bold"); // Add bold to the selected label

      this.currentPage = 1; // Reset to the first page
      this.updateUrlParams(); // Update the URL
      this.renderPage(); // Re-render the page with the new item count
    });
  }

  // Filter and paginate the metaobjects
  filterItems() {
    const allCheckbox = this.filterForm.querySelector('input[value="all"]');

    // Step 1: Filter by categories
    let filteredItems = this.metaObjects;
    if (this.selectedCategories.length > 0 && !allCheckbox.checked) {
      filteredItems = filteredItems.filter((item) => {
        const categoryField = item.fields.find((field) => field.key === "category");
        if (categoryField) {
          const categoryArray = JSON.parse(categoryField.value); // Assume this is a JSON array of categories
          return categoryArray.some((category) => this.selectedCategories.includes(category));
        }
        return false;
      });
    }

    // Step 2: Filter by search query
    if (this.searchQuery) {
      filteredItems = filteredItems.filter((item) => {
        const nameField = item.fields.find((field) => field.key === "name");
        const commonNameField = item.fields.find((field) => field.key === "common_name");

        const nameMatch = nameField && nameField.value.toLowerCase().includes(this.searchQuery);
        const commonNameMatch =
          commonNameField && commonNameField.value.toLowerCase().includes(this.searchQuery);

        return nameMatch || commonNameMatch;
      });
    }

    return filteredItems; // Return the filtered items
  }

  // Render a specific page of items
  renderPage() {
    const ingredientContainer = this.querySelector(".ingredient-list");
    ingredientContainer.querySelector("div:first-of-type").focus(); // Set focus to first list item

    const skeletonList = this.querySelector(".skeleton-list");
    if (this.loading) {
      skeletonList.classList.remove("hidden"); // Show skeleton when loading
      ingredientContainer.classList.add("hidden"); // Hide ingredients list
      return;
    } else {
      skeletonList.classList.add("hidden"); // Hide skeleton when loaded
      ingredientContainer.classList.remove("hidden"); // Show ingredients list
    }

    const filteredItems = this.filterItems();
    const findNameValue = (object) => object.fields.find((i) => i.key === "name").value;
    const sortedAzItems = filteredItems.sort((a, b) =>
      findNameValue(a).localeCompare(findNameValue(b))
    );
    const filteredSortedItems = this.sortByValue === "az" ? sortedAzItems : sortedAzItems.reverse();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, filteredSortedItems.length);
    const paginatedItems = filteredSortedItems.slice(startIndex, endIndex);

    const resultsElement = this.querySelector(".results-count");
    resultsElement.innerHTML = `${filteredItems.length} result${
      filteredItems.length > 1 ? "s" : ""
    }`;

    ingredientContainer.innerHTML = ""; // Clear the previous content

    // Add the paginated items to the container
    paginatedItems.forEach((item) => {
      const nameField = item.fields.find((field) => field.key === "name");
      const commonNameField = item.fields.find((field) => field.key === "common_name");
      const definitionField = item.fields.find((field) => field.key === "definition");
      const categoryField = item.fields.find((field) => field.key === "category");
      const categoryArray = categoryField ? JSON.parse(categoryField.value) : [];
      const tagClass = "rounded-full px-2 py-0.5 bg-wave-200 text-xs";

      const itemElement = document.createElement("div");
      itemElement.classList.add(
        "border-b",
        "border-seaweed-300",
        "flex",
        "flex-col",
        "justify-center",
        "min-h-32",
        "py-3"
      );
      itemElement.innerHTML = `
        <h3><b>${nameField ? nameField.value : "Unnamed"}</b></h3>
        ${commonNameField ? `<em>${commonNameField.value}</em>` : ""}
        <p>${definitionField ? definitionField.value : ""}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          ${categoryArray.map((i) => `<div class="${tagClass}">${i}</div>`).join("")}
        </div>
      `;

      ingredientContainer.appendChild(itemElement);
    });

    // Display the current count (e.g., "Showing 1 - 10 of 308")
    const currentCountElement = this.querySelector(".current-count");
    currentCountElement.textContent = `Showing ${startIndex + 1} - ${endIndex} of ${
      filteredItems.length
    }`;

    this.renderPagination(filteredItems.length); // Update pagination controls
  }

  // Render pagination controls
  renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    const paginationContainer = this.querySelector(".pagination");
    paginationContainer.innerHTML = ""; // Clear previous pagination

    const maxVisiblePages = 2; // Number of pages to show before and after the current page

    // Previous page link
    if (this.currentPage > 1) {
      const prevLink = document.createElement("a");
      prevLink.classList.add("px-1");
      prevLink.href = "#";
      prevLink.setAttribute("aria-label", "Go to previous page");
      prevLink.innerHTML = `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Previous">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>`;
      prevLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.currentPage--;
        this.updateUrlParams(); // Update URL on pagination change
        this.renderPage();
      });
      paginationContainer.appendChild(prevLink);
    }

    // First page link
    const firstPageLink = document.createElement("a");
    firstPageLink.href = "#";
    firstPageLink.textContent = 1;
    firstPageLink.classList.add("w-4", "link");
    firstPageLink.setAttribute("aria-label", "Go to first page");
    if (this.currentPage === 1) {
      firstPageLink.classList.add("font-bold"); // Bold current page
    }
    firstPageLink.addEventListener("click", (e) => {
      e.preventDefault();
      this.currentPage = 1;
      this.updateUrlParams(); // Update URL on pagination change
      this.renderPage();
    });
    paginationContainer.appendChild(firstPageLink);

    // Ellipsis after first page if needed
    if (this.currentPage > maxVisiblePages + 2) {
      const ellipsis = document.createElement("span");
      ellipsis.classList.add("font-bold");
      ellipsis.textContent = "…";
      paginationContainer.appendChild(ellipsis);
    }

    // Pages around the current page
    const startPage = Math.max(2, this.currentPage - maxVisiblePages);
    const endPage = Math.min(totalPages - 1, this.currentPage + maxVisiblePages);

    for (let i = startPage; i <= endPage; i++) {
      const pageLink = document.createElement("a");
      pageLink.classList.add("w-4", "link");
      pageLink.href = "#";
      pageLink.textContent = i;
      pageLink.setAttribute("aria-label", `Go to page ${i}`);
      if (i === this.currentPage) {
        pageLink.classList.add("font-bold"); // Bold current page
      }
      pageLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.currentPage = i;
        this.updateUrlParams(); // Update URL on pagination change
        this.renderPage();
      });
      paginationContainer.appendChild(pageLink);
    }

    // Ellipsis before last page if needed
    if (this.currentPage < totalPages - maxVisiblePages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.classList.add("font-bold");
      ellipsis.textContent = "…";
      paginationContainer.appendChild(ellipsis);
    }

    // Last page link
    if (totalPages > 1) {
      const lastPageLink = document.createElement("a");
      lastPageLink.classList.add("link");
      lastPageLink.href = "#";
      lastPageLink.textContent = totalPages;
      lastPageLink.setAttribute("aria-label", `Go to page ${totalPages}`);
      if (this.currentPage === totalPages) {
        lastPageLink.classList.add("font-bold"); // Bold current page
      }
      lastPageLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.currentPage = totalPages;
        this.updateUrlParams(); // Update URL on pagination change
        this.renderPage();
      });
      paginationContainer.appendChild(lastPageLink);
    }

    // Next page link
    if (this.currentPage < totalPages) {
      const nextLink = document.createElement("a");
      nextLink.classList.add("px-1");
      nextLink.href = "#";
      nextLink.setAttribute("aria-label", "Go to next page");
      nextLink.innerHTML = `<svg class="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="Next">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>`;
      nextLink.addEventListener("click", (e) => {
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
