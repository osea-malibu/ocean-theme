/**
 * <events-map> — interactive Mapbox GL JS map synced to an event list,
 * with optional address/ZIP location search + radius filtering.
 *
 * Cost control: Mapbox bills per map *load* (each GL JS initialization). This
 * component lazy-initializes the map only when it scrolls near the viewport, so
 * a visitor who never reaches the map is never counted. Panning/zooming and
 * geocoding after load are free (geocoding is a separate, cheap API). The
 * homepage embed does NOT use this component — it is a static image
 * (see sections/events-map-mini.liquid) and never loads GL JS.
 *
 * Expected markup:
 *   <events-map data-token data-style data-zoom data-center-lat data-center-lng data-pin-color>
 *     <form data-geo-search> <input data-geo-input> <select data-geo-radius> <button data-geo-reset> </form>
 *     <p data-geo-status></p>
 *     <ol data-event-list> <li data-event-id="…">…</li> … </ol>
 *     <div data-map></div>
 *     <script type="application/json" data-events>[ {id,title,date,venue,lat,lng,url}, … ]</script>
 *   </events-map>
 */

const MAPBOX_VERSION = "v3.9.0";
const EARTH_RADIUS_MI = 3958.8;
const SEARCH_MARKER_COLOR = "#1D4D41"; // brand seaweed — distinct from the coral event pins

class EventsMap extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.markers = new Map(); // event id -> mapbox Marker
    this.initialized = false;
    this.searchMarker = null;
    this.lastCenter = null; // [lng, lat] of the most recent search
    this.lastPlace = "";
  }

  connectedCallback() {
    this.mapEl = this.querySelector("[data-map]");
    this.listEl = this.querySelector("[data-event-list]");
    this.token = this.dataset.token;
    this.mapStyle = this.dataset.style || "mapbox://styles/mapbox/light-v11";
    this.pinColor = this.dataset.pinColor || "#2f4f4f";
    this.defaultZoom = parseFloat(this.dataset.zoom || "3");
    this.defaultCenter = [
      parseFloat(this.dataset.centerLng || "-98.5"),
      parseFloat(this.dataset.centerLat || "39.8"),
    ];
    this.events = this.readEvents();

    if (!this.token || !this.mapEl || !this.events.length) return;

    this.bindList();
    this.setupSearch();
    this.setupMobileSheet();

    // Lazy init: spin up Mapbox only when the map nears the viewport.
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.observer.disconnect();
            this.init();
          }
        },
        { rootMargin: "200px" }
      );
      this.observer.observe(this.mapEl);
    } else {
      this.init();
    }
  }

  readEvents() {
    const script = this.querySelector('script[type="application/json"][data-events]');
    if (!script) return [];
    try {
      const parsed = JSON.parse(script.textContent);
      // Drop any event missing valid coordinates (empty metaobject fields serialize to null).
      return parsed.filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lng));
    } catch (err) {
      console.error("[events-map] Could not parse event data", err);
      return [];
    }
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    await this.ensureMapboxLoaded();
    if (!window.mapboxgl) {
      console.error("[events-map] Mapbox GL JS failed to load");
      return;
    }

    window.mapboxgl.accessToken = this.token;
    this.map = new window.mapboxgl.Map({
      container: this.mapEl,
      style: this.mapStyle,
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      cooperativeGestures: true, // require ⌘/ctrl or two fingers to zoom while scrolling the page
    });
    this.map.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    this.events.forEach((ev) => {
      const popup = new window.mapboxgl.Popup({ offset: 24, closeButton: false }).setHTML(
        this.popupHTML(ev)
      );
      const marker = new window.mapboxgl.Marker({ color: this.pinColor })
        .setLngLat([ev.lng, ev.lat])
        .setPopup(popup)
        .addTo(this.map);
      marker.getElement().addEventListener("click", () => this.highlightListItem(ev.id));
      this.markers.set(String(ev.id), marker);
    });

    // If a search happened before the map finished loading, honor it; else fit all.
    if (this.lastCenter) {
      this.applyResults(this.currentRadius());
    } else {
      this.fitToAll();
    }
  }

  fitToAll() {
    if (!this.map) return;
    if (this.events.length > 1) {
      const bounds = new window.mapboxgl.LngLatBounds();
      this.events.forEach((ev) => bounds.extend([ev.lng, ev.lat]));
      this.map.fitBounds(bounds, { padding: 64, maxZoom: 12, duration: 0 });
    } else {
      this.map.setCenter([this.events[0].lng, this.events[0].lat]);
      this.map.setZoom(11);
    }
  }

  /** Resolve once window.mapboxgl exists (loaded via the CDN <script> in the section). */
  ensureMapboxLoaded() {
    if (window.mapboxgl) return Promise.resolve();
    if (window.__mapboxglLoading) return window.__mapboxglLoading;
    window.__mapboxglLoading = new Promise((resolve, reject) => {
      let waited = 0;
      const poll = () => {
        if (window.mapboxgl) return resolve();
        waited += 50;
        if (waited > 10000) return reject(new Error("timeout"));
        setTimeout(poll, 50);
      };
      poll();
    });
    return window.__mapboxglLoading.catch(() => {});
  }

  bindList() {
    if (!this.listEl) return;
    this.listEl.addEventListener("click", (event) => {
      const item = event.target.closest("[data-event-id]");
      if (!item || !this.listEl.contains(item)) return;
      // Let real links (RSVP) and the read-more toggle (label/checkbox) behave normally.
      if (event.target.closest("a, label, input")) return;
      this.focusEvent(item.dataset.eventId);
    });
  }

  focusEvent(id) {
    if (!this.map) {
      // Clicked before the map lazy-loaded — init, then focus.
      this.init().then(() => this.focusEvent(id));
      return;
    }
    const marker = this.markers.get(String(id));
    if (!marker) return;
    this.map.flyTo({ center: marker.getLngLat(), zoom: 12, essential: true });
    if (!marker.getPopup().isOpen()) marker.togglePopup();
    this.highlightListItem(id);
    // On mobile, close the list sheet so the selected pin is visible.
    this.classList.remove("list-open");
    this.mapEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------- Mobile list bottom-sheet ---------- */

  setupMobileSheet() {
    this.querySelector("[data-list-toggle]")?.addEventListener("click", () => {
      this.classList.add("list-open");
    });
    this.querySelectorAll("[data-list-close]").forEach((btn) => {
      btn.addEventListener("click", () => this.classList.remove("list-open"));
    });
  }

  highlightListItem(id) {
    if (!this.listEl) return;
    this.listEl.querySelectorAll("[data-event-id]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.eventId === String(id));
    });
  }

  popupHTML(ev) {
    const parts = ['<div class="em-popup">'];
    if (ev.date) parts.push(`<span class="em-popup__date">${ev.date}</span>`);
    parts.push(`<strong class="em-popup__title">${ev.title || ""}</strong>`);
    if (ev.venue) parts.push(`<span class="em-popup__venue">${ev.venue}</span>`);
    if (ev.url) parts.push(`<a class="em-popup__link" href="${ev.url}">Details &rarr;</a>`);
    parts.push("</div>");
    return parts.join("");
  }

  /* ---------- Location search ---------- */

  setupSearch() {
    this.form = this.querySelector("[data-geo-search]");
    if (!this.form) return;
    this.input = this.querySelector("[data-geo-input]");
    this.radiusEl = this.querySelector("[data-geo-radius]");
    this.resetEl = this.querySelector("[data-geo-reset]");
    this.statusEl = this.querySelector("[data-geo-status]");

    // Snapshot the original list order so we can restore it on reset.
    this.originalItems = this.listEl ? Array.from(this.listEl.querySelectorAll("li")) : [];
    this.itemsById = new Map();
    this.originalItems.forEach((li) => {
      if (li.dataset.eventId) this.itemsById.set(li.dataset.eventId, li);
    });

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.runSearch();
    });
    this.radiusEl?.addEventListener("change", () => {
      if (this.lastCenter) this.applyResults(this.currentRadius());
    });
    this.resetEl?.addEventListener("click", () => this.clearSearch());
  }

  currentRadius() {
    // When the radius control is hidden (mobile, below sm), treat the search as
    // "any distance" so it always surfaces the nearest events sorted by proximity
    // instead of a "no events within X mi" dead end the visitor can't widen.
    if (!this.radiusEl || this.radiusEl.offsetParent === null) return NaN;
    const v = parseFloat(this.radiusEl.value);
    return Number.isFinite(v) ? v : NaN; // NaN = "any distance"
  }

  async runSearch() {
    const q = (this.input?.value || "").trim();
    if (!q) {
      this.input?.focus();
      return;
    }
    this.setStatus("Searching…");
    if (!this.map) await this.init();

    let result = null;
    try {
      result = await this.geocode(q);
    } catch (err) {
      console.error("[events-map] Geocoding failed", err);
    }
    if (!result) {
      this.setStatus("We couldn’t find that location. Try a ZIP code or city.");
      return;
    }
    this.lastCenter = result.center;
    this.lastPlace = result.place;
    this.applyResults(this.currentRadius());
  }

  async geocode(query) {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?country=us&limit=1&types=postcode,address,place,locality,neighborhood` +
      `&access_token=${this.token}`;
    const res = await fetch(url);
    const data = await res.json();
    const f = data.features && data.features[0];
    if (!f) return null;
    return { center: f.center, place: (f.place_name || f.text || query).split(",").slice(0, 2).join(",") };
  }

  haversineMiles(lat1, lng1, lat2, lng2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  applyResults(radiusMiles) {
    if (!this.lastCenter) return;
    const [clng, clat] = this.lastCenter;
    const scored = this.events
      .map((ev) => ({ ev, dist: this.haversineMiles(clat, clng, ev.lat, ev.lng) }))
      .sort((a, b) => a.dist - b.dist);
    const hasRadius = Number.isFinite(radiusMiles);
    const matches = hasRadius ? scored.filter((s) => s.dist <= radiusMiles) : scored;
    const matchIds = new Set(matches.map((s) => String(s.ev.id)));

    // Markers: show matches, hide the rest.
    this.markers.forEach((marker, id) => {
      marker.getElement().style.display = matchIds.has(id) ? "" : "none";
    });

    // List: move matches (nearest first) to the top with a distance badge; hide the rest.
    matches.forEach((s) => {
      const li = this.itemsById.get(String(s.ev.id));
      if (!li) return;
      li.style.display = "";
      this.setDistanceBadge(li, s.dist);
      this.listEl.appendChild(li);
    });
    this.originalItems.forEach((li) => {
      const id = li.dataset.eventId;
      if (!id || !matchIds.has(id)) {
        li.style.display = "none";
        this.setDistanceBadge(li, null);
      }
    });

    this.setSearchMarker(this.lastCenter);

    if (this.map) {
      if (matches.length) {
        const bounds = new window.mapboxgl.LngLatBounds();
        bounds.extend(this.lastCenter);
        matches.forEach((s) => bounds.extend([s.ev.lng, s.ev.lat]));
        this.map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 600 });
      } else {
        this.map.flyTo({ center: this.lastCenter, zoom: 9, essential: true });
      }
    }

    const near = this.lastPlace ? ` near ${this.lastPlace}` : "";
    const within = hasRadius ? ` within ${radiusMiles} mi` : "";
    if (matches.length) {
      this.setStatus(`${matches.length} event${matches.length === 1 ? "" : "s"}${within}${near}.`);
    } else {
      this.setStatus(`No events${within}${near}. Try a larger radius.`);
    }
    this.resetEl?.classList.remove("hidden");
  }

  clearSearch() {
    this.lastCenter = null;
    this.lastPlace = "";
    if (this.input) this.input.value = "";
    // Restore original list order + visibility, remove badges.
    this.originalItems.forEach((li) => {
      li.style.display = "";
      this.setDistanceBadge(li, null);
      this.listEl.appendChild(li);
    });
    this.markers.forEach((marker) => {
      marker.getElement().style.display = "";
    });
    if (this.searchMarker) {
      this.searchMarker.remove();
      this.searchMarker = null;
    }
    this.fitToAll();
    this.setStatus("");
    this.resetEl?.classList.add("hidden");
  }

  setSearchMarker(center) {
    if (!this.map) return;
    if (this.searchMarker) this.searchMarker.remove();
    this.searchMarker = new window.mapboxgl.Marker({ color: SEARCH_MARKER_COLOR })
      .setLngLat(center)
      .setPopup(new window.mapboxgl.Popup({ offset: 24, closeButton: false }).setHTML(
        `<div class="em-popup"><strong class="em-popup__title">Your location</strong></div>`
      ))
      .addTo(this.map);
  }

  setDistanceBadge(li, dist) {
    let badge = li.querySelector("[data-dist]");
    if (dist == null) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement("span");
      badge.setAttribute("data-dist", "");
      badge.className = "events-map__dist";
      li.appendChild(badge);
    }
    badge.textContent = `${dist < 10 ? dist.toFixed(1) : Math.round(dist)} mi away`;
  }

  setStatus(text) {
    if (!this.statusEl) return;
    this.statusEl.textContent = text || "";
    // Collapse the element entirely when empty so it takes no grid space.
    this.statusEl.classList.toggle("hidden", !text);
  }
}

if (!customElements.get("events-map")) {
  customElements.define("events-map", EventsMap);
}

export { EventsMap, MAPBOX_VERSION };
