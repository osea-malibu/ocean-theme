class OnetimeBundleBuilder extends HTMLElement {
  connectedCallback() {
    this.qty = this.minQty;

    this.querySelectorAll('.bb-card[data-variant-id]').forEach((card) => {
      card.addEventListener('click', () => this.toggleCard(card));
    });

    this.querySelector('[data-qty-decrement]').addEventListener('click', () => this.changeQty(-1));
    this.querySelector('[data-qty-increment]').addEventListener('click', () => this.changeQty(1));
    this.querySelector('[data-atc]').addEventListener('click', () => this.addToCart());

    this.update();
  }

  get minQty() {
    return parseInt(this.dataset.minQty) || 6;
  }

  get maxQty() {
    return parseInt(this.dataset.maxQty) || 24;
  }

  get discount() {
    return parseFloat(this.dataset.discount) || 0;
  }

  get bagVariantId() {
    return this.dataset.bagVariantId || null;
  }

  get cartImage() {
    return this.dataset.cartImage || null;
  }

  toggleCard(card) {
    const pressed = card.getAttribute('aria-pressed') === 'true';
    card.setAttribute('aria-pressed', String(!pressed));
    this.update();
  }

  changeQty(delta) {
    const next = this.qty + delta;
    if (next < this.minQty || next > this.maxQty) return;
    this.qty = next;
    this.querySelector('[data-qty-value]').textContent = this.qty;
    this.update();
  }

  getSelectedCards() {
    return Array.from(this.querySelectorAll('.bb-card[aria-pressed="true"]'));
  }

  update() {
    const selected = this.getSelectedCards();
    const pillsEl = this.querySelector('[data-pills]');
    const origEl = this.querySelector('[data-price-original]');
    const finalEl = this.querySelector('[data-price-final]');
    const noteEl = this.querySelector('[data-price-note]');
    const atcBtn = this.querySelector('[data-atc]');
    const decrementBtn = this.querySelector('[data-qty-decrement]');
    const incrementBtn = this.querySelector('[data-qty-increment]');

    decrementBtn.disabled = this.qty <= this.minQty;
    incrementBtn.disabled = this.qty >= this.maxQty;

    if (selected.length === 0) {
      pillsEl.innerHTML =
        '<span class="text-sm italic text-seaweed-400">None selected yet</span>';
      origEl.classList.add('invisible');
      finalEl.textContent = '—';
      noteEl.textContent = 'Select products to see pricing';
      atcBtn.disabled = true;
      return;
    }

    const productPills = selected
      .map(
        (c) =>
          `<span class="inline-block text-xs bg-seaweed-700 text-white rounded-full px-2.5 py-0.5">${c.dataset.name}</span>`
      )
      .join('');
    const bagPill = this.bagVariantId
      ? '<span class="inline-block text-xs bg-seaweed-400 text-white rounded-full px-2.5 py-0.5">Vegan leather bag</span>'
      : '';
    pillsEl.innerHTML = productPills + bagPill;

    const totalCents = selected.reduce(
      (sum, c) => sum + parseInt(c.dataset.price) * this.qty,
      0
    );
    const discountedCents = Math.round(totalCents * (1 - this.discount / 100));

    origEl.classList.remove('invisible');
    origEl.textContent = this.formatMoney(totalCents);
    finalEl.textContent = this.formatMoney(discountedCents);
    noteEl.textContent = `${this.qty} bundle${this.qty !== 1 ? 's' : ''} · ${selected.length} product${selected.length !== 1 ? 's' : ''} each${this.bagVariantId ? ' + bag' : ''}`;
    atcBtn.disabled = false;
  }

  formatMoney(cents) {
    const currency = window.Shopify?.currency?.active || 'USD';
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency });
  }

  async addToCart() {
    const selected = this.getSelectedCards();
    if (selected.length === 0) return;

    const atcBtn = this.querySelector('[data-atc]');
    const bundleId = crypto.randomUUID();

    const makeProps = () => ({
      _bundleId: bundleId,
      _bundleDiscount: this.discount,
      _isOnetimeBundle: true,
      ...(this.cartImage ? { _bundleCartImage: this.cartImage } : {}),
    });

    const items = selected.map((card) => ({
      id: parseInt(card.dataset.variantId),
      quantity: this.qty,
      properties: makeProps(),
    }));

    if (this.bagVariantId) {
      items.push({
        id: parseInt(this.bagVariantId),
        quantity: this.qty,
        properties: makeProps(),
      });
    }

    atcBtn.disabled = true;
    atcBtn.textContent = 'Adding…';

    try {
      const cartDrawer = document.querySelector('cart-drawer');
      const sections =
        cartDrawer?.getSectionsToRender?.().map((s) => s.id).join(',') ?? 'cart-drawer';

      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items, sections }),
      });

      const data = await response.json();

      if (data.status) {
        throw new Error(data.description || 'Cart add failed');
      }

      if (cartDrawer) {
        cartDrawer.renderContents(data, atcBtn);
      } else {
        window.location = window.routes?.cart_url ?? '/cart';
      }
    } catch (error) {
      console.error('[OnetimeBundleBuilder] addToCart error:', error);
      atcBtn.disabled = false;
      atcBtn.textContent = 'Add to cart';
    }
  }
}

customElements.define('onetime-bundle-builder', OnetimeBundleBuilder);
