/*
 * <before-after-results> — clinicals before/after module.
 *
 * Each slide holds one drag comparison: the after photo sits on top of the
 * before and is clipped from the left at --ba-pos, so before reads left and
 * after reads right. The handle is a role="slider" for keyboard and screen
 * readers; pointer drag works anywhere on the image. Prev/next cycle the
 * slides; captions and the counter live outside the slides and are swapped
 * from each slide's data attributes.
 *
 * GTM: emits clinicals_ba_drag (once per slide) and clinicals_ba_slide so we
 * can measure whether anyone actually uses the slider before investing more.
 */
if (!customElements.get("before-after-results")) {
  const KEY_STEP = 5;

  const track = (payload) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
    } catch (err) {
      // Tracking must never break the slider.
    }
  };

  class BeforeAfterResults extends HTMLElement {
    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll("[data-ba-slide]"));
      if (!this.slides.length) return;

      this.captionEl = this.querySelector("[data-ba-caption-text]");
      this.counterEl = this.querySelector("[data-ba-counter]");
      this.statusEl = this.querySelector("[data-ba-status]");
      this.productHandle = this.dataset.productHandle;
      this.index = 0;
      this.dragged = new Set();

      this.slides.forEach((slide, i) => this.initComparison(slide, i));

      this.querySelector("[data-ba-prev]")?.addEventListener("click", () => this.go(-1));
      this.querySelector("[data-ba-next]")?.addEventListener("click", () => this.go(1));
    }

    initComparison(slide, slideIndex) {
      const media = slide.querySelector("[data-ba-media]");
      const handle = slide.querySelector("[data-ba-handle]");
      let pointerId = null;

      const setPos = (pct) => {
        const pos = Math.min(100, Math.max(0, pct));
        media.style.setProperty("--ba-pos", `${pos}%`);
        handle.setAttribute("aria-valuenow", Math.round(pos));
        handle.setAttribute("aria-valuetext", `${Math.round(pos)}% before, ${Math.round(100 - pos)}% after`);
      };

      const posFromEvent = (event) => {
        const rect = media.getBoundingClientRect();
        return ((event.clientX - rect.left) / rect.width) * 100;
      };

      const noteDrag = () => {
        if (this.dragged.has(slideIndex)) return;
        this.dragged.add(slideIndex);
        track({
          event: "clinicals_ba_drag",
          product_handle: this.productHandle,
          slide_index: slideIndex + 1,
          slide_label: slide.dataset.baCaption,
        });
      };

      media.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        pointerId = event.pointerId;
        media.setPointerCapture(pointerId);
        media.dataset.dragging = "";
        setPos(posFromEvent(event));
        noteDrag();
      });
      media.addEventListener("pointermove", (event) => {
        if (event.pointerId === pointerId) setPos(posFromEvent(event));
      });
      const endDrag = (event) => {
        if (event.pointerId !== pointerId) return;
        pointerId = null;
        delete media.dataset.dragging;
      };
      media.addEventListener("pointerup", endDrag);
      media.addEventListener("pointercancel", endDrag);

      handle.addEventListener("keydown", (event) => {
        const current = parseFloat(handle.getAttribute("aria-valuenow")) || 50;
        const next = {
          ArrowLeft: current - KEY_STEP,
          ArrowDown: current - KEY_STEP,
          ArrowRight: current + KEY_STEP,
          ArrowUp: current + KEY_STEP,
          Home: 0,
          End: 100,
        }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        setPos(next);
        noteDrag();
      });

      setPos(50);
    }

    go(step) {
      const total = this.slides.length;
      this.index = (this.index + step + total) % total;

      this.slides.forEach((slide, i) => {
        const active = i === this.index;
        slide.hidden = !active;
        slide.toggleAttribute("inert", !active);
      });

      const slide = this.slides[this.index];
      if (this.captionEl) this.captionEl.textContent = slide.dataset.baCaption || "";
      if (this.counterEl) this.counterEl.textContent = `${this.index + 1}/${total}`;
      if (this.statusEl) this.statusEl.textContent = `Slide ${this.index + 1} of ${total}: ${slide.dataset.baCaption || ""}`;

      track({
        event: "clinicals_ba_slide",
        product_handle: this.productHandle,
        slide_index: this.index + 1,
        slide_label: slide.dataset.baCaption,
        direction: step > 0 ? "next" : "prev",
      });
    }
  }

  customElements.define("before-after-results", BeforeAfterResults);
}
