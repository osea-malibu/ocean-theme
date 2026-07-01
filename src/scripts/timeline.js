class TimelineSection extends HTMLElement {
  connectedCallback() {
    this.animateOnScroll = this.dataset.animateOnScroll === "true";
    this.flippable = this.dataset.flippable === "true";
    this.horizontal = this.dataset.horizontal === "true";
    this.hijackScroll = this.dataset.hijackScroll === "true";
    this.showProgress = this.dataset.showProgress === "true";

    this.cards = Array.from(this.querySelectorAll(".timeline-card"));
    this.track = this.querySelector(".timeline-track");

    if (this.animateOnScroll) this._initScrollAnimation();
    if (this.flippable) this._initFlip();
    if (this.horizontal) this._initHorizontal();
    if (this.showProgress && this.horizontal) this._initProgress();
    if (!this.horizontal && this.showProgress) this._initLineProgress();
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
            card.classList.add("timeline-card--visible");
          }
        });
      },
      { threshold: 0.4 }
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

    if (this.hijackScroll) this._bindHijack();
    this._bindKeyboard();
    this._initHorizontalDots();
  }

  _initHorizontalDots() {
    const progressTrack = this.querySelector(".timeline-progress-track");
    if (!progressTrack) return;

    const entries = this.cards.map((card) => {
      const line = document.createElement("div");
      line.className = "timeline-progress-line";
      progressTrack.appendChild(line);

      const dot = document.createElement("div");
      dot.className = "timeline-progress-dot";
      progressTrack.appendChild(dot);

      return { card, dot, line, targetHeight: 0, revealed: false };
    });

    const update = () => {
      const progressRect = progressTrack.getBoundingClientRect();
      entries.forEach((entry) => {
        const cardRect = entry.card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2 - progressRect.left;
        const h = Math.max(0, cardRect.top - progressRect.top - progressRect.height / 2);

        entry.targetHeight = h;
        entry.dot.style.left = `${centerX}px`;
        entry.line.style.left = `${centerX}px`;

        if (entry.revealed) {
          entry.line.style.height = `${h}px`;
        }
      });
    };

    // Determine which cards are visible in the scroll container on load
    const trackRect = this.track.getBoundingClientRect();
    const initiallyVisible = new Set(
      this.cards.filter((card) => {
        const r = card.getBoundingClientRect();
        return r.left < trackRect.right && r.right > trackRect.left;
      })
    );

    // Reveal initially visible entries without animation
    entries.forEach((entry) => {
      if (initiallyVisible.has(entry.card)) {
        entry.revealed = true;
        entry.dot.classList.add("is-visible");
      } else {
        entry.card.classList.add("timeline-card--h-animated");
      }
    });

    // Orchestrated animation for cards that scroll into view
    const io = new IntersectionObserver(
      (observations) => {
        observations.forEach((obs) => {
          if (!obs.isIntersecting) return;
          const entry = entries.find((e) => e.card === obs.target);
          if (!entry || entry.revealed) return;

          entry.revealed = true;
          io.unobserve(obs.target);

          // Step 1: dot grows
          entry.dot.classList.add("is-visible");

          // Step 2: line extends down
          setTimeout(() => {
            entry.line.style.height = `${entry.targetHeight}px`;
          }, 300);

          // Step 3: card scales in — starts as line finishes (300ms delay + 350ms line transition)
          setTimeout(() => {
            entry.card.classList.add("is-visible");
          }, 300);
        });
      },
      { root: this.track, threshold: 0.5 }
    );

    entries.forEach((entry) => {
      if (!initiallyVisible.has(entry.card)) {
        io.observe(entry.card);
      }
    });

    this.track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    const ro = new ResizeObserver(() => {
      update();
      // Set heights for initially visible entries without triggering transition
      entries.forEach((entry) => {
        if (entry.revealed && !initiallyVisible.has(entry.card)) return;
        if (entry.revealed) {
          entry.line.style.transition = "none";
          entry.line.style.height = `${entry.targetHeight}px`;
          entry.line.getBoundingClientRect(); // force reflow
          entry.line.style.transition = "";
        }
      });
      ro.disconnect();
    });
    ro.observe(this.track);
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

  // --- Vertical line progress ---

  _initLineProgress() {
    const update = () => {
      const rect = this.getBoundingClientRect();
      const total = this.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      this.track.style.setProperty("--line-progress-px", `${progress * this.track.offsetHeight}px`);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  // --- Progress indicator ---

  _initProgress() {
    const bar = this.querySelector(".timeline-progress-bar");
    if (!bar) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = this.track;
      bar.style.width = `${(scrollLeft / (scrollWidth - clientWidth)) * 100}%`;
    };

    this.track.addEventListener("scroll", update, { passive: true });
    update();
  }
}

customElements.define("timeline-section", TimelineSection);
