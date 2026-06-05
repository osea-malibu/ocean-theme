class CollectionRecentlyViewed extends HTMLElement {
  constructor() {
    super();

    const min = parseInt(this.dataset.minRecentlyViewed, 10) || 4;
    const limit = parseInt(this.dataset.limit, 10) || 8;
    const recentlyViewed = JSON.parse(localStorage.getItem("osea.recentlyViewed")) || [];

    if (recentlyViewed.length >= min) {
      this.loadRecentlyViewed(recentlyViewed.slice(0, limit));
    }
  }

  loadRecentlyViewed(handles) {
    // Fetch each product's card HTML via Shopify's Section Rendering API.
    // /products/{handle}?sections=collection-recently-viewed-item renders the section
    // in that product's context, returning a fully server-rendered product-card.liquid slide.
    const fetches = handles.map((handle) =>
      fetch(`/products/${handle}?sections=product-card-slide`)
        .then((r) => r.json())
        .then((data) => {
          const html = data["product-card-slide"];
          if (!html) return null;
          // The response wraps our <li> in a <section> tag — extract the inner HTML
          const tmp = document.createElement("div");
          tmp.innerHTML = html;
          const section = tmp.firstElementChild;
          return section ? section.innerHTML.trim() : null;
        })
        .catch(() => null)
    );

    Promise.all(fetches).then((results) => {
      const slides = results.filter((html) => html !== null);
      if (slides.length < 4) return;

      const sectionId = this.dataset.sectionId;
      const dotCount = Math.max(1, Math.round(slides.length / 2));

      const dotsHtml = Array.from(
        { length: dotCount },
        (_, i) =>
          `<li class="glide__bullet p-2${i === 0 ? " active" : ""}" data-glide-dir="=${i}">
          <span class="sr-only">Go to slide ${i + 1}</span>
          <span class="block w-2 h-2 bg-seaweed-700 rounded-full"></span>
        </li>`
      ).join("");

      const arrowPrev = `<svg aria-hidden="true" focusable="false" class="h-10 w-10 text-seaweed-700 bg-white rounded-full block border-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
      const arrowNext = `<svg aria-hidden="true" focusable="false" class="h-10 w-10 text-seaweed-700 bg-white rounded-full block border-white rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;

      const sliderHtml = `<glide-slider
          class="glide relative type-carousel -ml-1 gap-16 sm:gap-8 perView-4 lg:perView-3 md:perView-2 sm:perView-2 xs:perView-2 2xs:perView-1"
          id="rv-slider-${sectionId}"
          data-breakpoint-limit="none"
        >
          <div class="glide__track pb-2" data-glide-el="track">
            <ul class="glide__slides min-h-full xs:w-full xs:mr-0">${slides.join("")}</ul>
          </div>
          <div class="glide__arrows" data-glide-el="controls">
            <button class="glide__arrow glide__arrow--left left-0 top-1/2 -mt-12" aria-label="Go to previous" data-glide-dir="<">${arrowPrev}</button>
            <button class="glide__arrow glide__arrow--right right-0 top-1/2 -mt-12" aria-label="Go to next" data-glide-dir=">">${arrowNext}</button>
          </div>
          <ol class="glide__bullets flex justify-center bottom-0" data-glide-el="controls[nav]">${dotsHtml}</ol>
        </glide-slider>`;

      const rvContainer = this.querySelector(".rv-slider-container");

      // Show the container BEFORE setting innerHTML so Glide can measure widths when it initializes
      this.querySelector(".fallback-slider-container").classList.add("hidden");
      this.querySelector(".fallback-heading").classList.add("hidden");
      rvContainer.classList.remove("hidden");
      this.querySelector(".rv-heading").classList.remove("hidden");

      rvContainer.innerHTML = sliderHtml;
    });
  }
}

customElements.define("collection-recently-viewed", CollectionRecentlyViewed);
