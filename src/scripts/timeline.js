class TimelineSection extends HTMLElement {
  connectedCallback() {
    this.animateOnScroll = this.dataset.animateOnScroll === "true";
    this.flippable = this.dataset.flippable === "true";
    this.horizontal = this.dataset.horizontal === "true";
    this.showProgress = this.dataset.showProgress === "true";
    this.showDateLabels = this.dataset.showDateLabels === "true";
    this.scrollNudges = this.dataset.scrollNudges === "true";

    this.cards = Array.from(this.querySelectorAll(".timeline-card"));
    this.track = this.querySelector(".timeline-track");

    if (this.animateOnScroll) this._initScrollAnimation();
    if (this.flippable) this._initFlip();
    if (this.horizontal) this._initHorizontal();
    if (this.showProgress && this.horizontal) this._initProgress();
    if (!this.horizontal && this.showProgress) this._initLineProgress();
    if (this.horizontal && this.scrollNudges) this._initScrollNudges();
  }

  disconnectedCallback() {
    this._scrollObserver?.disconnect();
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

  // --- Horizontal scroll + keyboard nav ---

  _initHorizontal() {
    if (!this.track) return;

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

      if (this.showDateLabels && card.dataset.date) {
        const label = document.createElement("span");
        label.className = "timeline-dot-label";
        label.textContent = card.dataset.date;
        dot.appendChild(label);
      }

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
    entries.forEach((entry, i) => {
      if (initiallyVisible.has(entry.card)) {
        entry.revealed = true;
        entry.dot.classList.add("is-visible");
        const label = entry.dot.querySelector(".timeline-dot-label");
        if (label) {
          setTimeout(() => label.classList.add("is-visible"), i * 80);
        }
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

          // Step 1: dot grows + label pops in shortly after
          entry.dot.classList.add("is-visible");
          const label = entry.dot.querySelector(".timeline-dot-label");
          if (label) setTimeout(() => label.classList.add("is-visible"), 150);

          // Step 2: line extends down + Step 3: card scales in — simultaneous
          setTimeout(() => {
            entry.line.style.height = `${entry.targetHeight}px`;
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

  _bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      const rect = this.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isVisible) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        this.track.scrollBy({ left: 320, behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.track.scrollBy({ left: -320, behavior: "smooth" });
      }
    });
  }

  // --- Vertical line progress ---

  _initLineProgress() {
    const fill = this.querySelector(".timeline-sidebar-fill");
    if (!fill) return;

    let rafId = null;
    const update = () => {
      const rect = this.getBoundingClientRect();
      const total = this.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      fill.style.height = `${progress * fill.parentElement.offsetHeight}px`;
      rafId = null;
    };

    window.addEventListener("scroll", () => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  // --- Scroll nudges (auto-nudge on view + label fade) ---

  _initScrollNudges() {
    const label = this.querySelector(".timeline-scroll-label");

    let nudgeDone = false;

    const dismiss = () => {
      if (label) label.classList.add("is-hidden");
      this.track.removeEventListener("pointerdown", dismiss);
      this.track.removeEventListener("touchstart", dismiss);
      this.track.removeEventListener("wheel", onWheel);
    };

    // Wheel fires on trackpad/mouse scroll — safe to use for dismiss since
    // our nudge uses scrollLeft directly, not wheel events
    const onWheel = () => { if (nudgeDone) dismiss(); };

    this.track.addEventListener("pointerdown", dismiss, { passive: true, once: true });
    this.track.addEventListener("touchstart", dismiss, { passive: true, once: true });
    this.track.addEventListener("wheel", onWheel, { passive: true });

    const nudge = () => {
      const start = this.track.scrollLeft;
      const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      this.track.style.scrollSnapType = "none";

      const peek = (distance, duration) => new Promise((resolve) => {
        let startTime = null;
        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const wave = progress < 0.5 ? ease(progress * 2) : ease((1 - progress) * 2);
          this.track.scrollLeft = start + wave * distance;
          if (progress < 1) requestAnimationFrame(animate);
          else resolve();
        };
        requestAnimationFrame(animate);
      });

      peek(22, 520).then(() => peek(6, 280)).then(() => {
        this.track.style.scrollSnapType = "";
        nudgeDone = true;
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          setTimeout(nudge, 700);
        });
      },
      { threshold: 0.5 }
    );
    io.observe(this);
  }

  // --- Horizontal progress bar ---

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
