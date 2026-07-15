/**
 * <events-map> — interactive Mapbox GL JS map synced to an event list.
 *
 * Cost control: Mapbox bills per map *load* (each GL JS initialization). This
 * component lazy-initializes the map only when it scrolls near the viewport, so
 * a visitor who never reaches the map is never counted. Panning/zooming after
 * load is free. The homepage embed does NOT use this component — it is a static
 * image (see sections/events-map-mini.liquid) and never loads GL JS.
 *
 * Expected markup:
 *   <events-map data-token data-style data-zoom data-center-lat data-center-lng data-pin-color>
 *     <ol data-event-list> <li data-event-id="…">…</li> … </ol>
 *     <div data-map></div>
 *     <script type="application/json" data-events>[ {id,title,date,venue,lat,lng,url}, … ]</script>
 *   </events-map>
 */

const MAPBOX_VERSION = "v3.9.0";

class EventsMap extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.markers = new Map(); // event id -> mapbox Marker
    this.initialized = false;
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

    const bounds = new window.mapboxgl.LngLatBounds();
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
      bounds.extend([ev.lng, ev.lat]);
    });

    if (this.events.length > 1) {
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
      // Let real links (RSVP, etc.) behave normally.
      if (event.target.closest("a")) return;
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
    this.mapEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
}

if (!customElements.get("events-map")) {
  customElements.define("events-map", EventsMap);
}

export { EventsMap, MAPBOX_VERSION };
