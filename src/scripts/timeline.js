class TimelineSection extends HTMLElement {
  connectedCallback() {
    this.animateOnScroll = this.dataset.animateOnScroll === "true";
    this.animateDelay = parseInt(this.dataset.animateDelay, 10) || 0;
    this.flippable = this.dataset.flippable === "true";
    this.horizontal = this.dataset.horizontal === "true";
    this.hijackScroll = this.dataset.hijackScroll === "true";
    this.showProgress = this.dataset.showProgress === "true";

    this.cards = Array.from(this.querySelectorAll(".timeline-card"));
    this.track = this.querySelector(".timeline-track");

    if (this.animateOnScroll) this._initScrollAnimation();
    if (this.flippable) this._initFlip();
    if (this.horizontal) this._initHorizontal();
    if (this.showProgress) this._initProgress();
  }

  disconnectedCallback() {
    this._scrollObserver?.disconnect();
    this._removeHorizontalListeners?.();
  }

  // --- Scroll-in animation ---

  _initScrollAnimation() {
    this._scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target;
            this._scrollObserver.unobserve(card);
            setTimeout(() => card.classList.add("timeline-card--visible"), this.animateDelay);
          }
        });
      },
      { threshold: 0.15 }
    );

    this.cards.forEach((card) => this._scrollObserver.observe(card));
  }

  // --- Flippable cards ---

  _initFlip() {
    this.cards.forEach((card) => {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "Flip card to read more");

      card.addEventListener("click", () => this._flipCard(card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this._flipCard(card);
        }
      });
    });
  }

  _flipCard(card) {
    const isFlipped = card.classList.toggle("timeline-card--flipped");
    card.setAttribute("aria-label", isFlipped ? "Flip card back" : "Flip card to read more");
  }

  // --- Horizontal scroll + optional hijack + keyboard nav ---

  _initHorizontal() {
    if (!this.track) return;

    if (this.hijackScroll) {
      this._bindHijack();
    }

    this._bindKeyboard();
  }

  _bindHijack() {
    let isScrolling = false;

    const onWheel = (e) => {
      if (!this._isTimelineActive()) return;

      const track = this.track;
      const atStart = track.scrollLeft === 0 && e.deltaY < 0;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2 && e.deltaY > 0;

      if (atStart || atEnd) return;

      e.preventDefault();

      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(() => {
          track.scrollLeft += e.deltaY;
          isScrolling = false;
        });
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });

    this._removeHorizontalListeners = () => {
      window.removeEventListener("wheel", onWheel);
    };
  }

  _bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (!this._isTimelineActive()) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        this.track.scrollBy({ left: 320, behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.track.scrollBy({ left: -320, behavior: "smooth" });
      }
    });
  }

  _isTimelineActive() {
    const rect = this.getBoundingClientRect();
    return rect.top <= 0 && rect.bottom >= window.innerHeight;
  }

  // --- Progress indicator ---

  _initProgress() {
    const bar = this.querySelector(".timeline-progress-bar");
    if (!bar) return;

    const update = () => {
      if (this.horizontal && this.track) {
        const { scrollLeft, scrollWidth, clientWidth } = this.track;
        bar.style.width = `${(scrollLeft / (scrollWidth - clientWidth)) * 100}%`;
        this.track.addEventListener("scroll", update, { passive: true });
      } else {
        const rect = this.getBoundingClientRect();
        const total = this.offsetHeight - window.innerHeight;
        const progress = Math.min(1, Math.max(0, -rect.top / total));
        bar.style.width = `${progress * 100}%`;
      }
    };

    if (!this.horizontal) {
      window.addEventListener("scroll", update, { passive: true });
    }

    update();
  }
}

customElements.define("timeline-section", TimelineSection);
