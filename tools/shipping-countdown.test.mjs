import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { getGwpEligibleTotal } from "../src/scripts/utils.js";

const source = await readFile(new URL("../src/scripts/global.js", import.meta.url), "utf8");
const start = source.indexOf("class ShippingCountdown extends HTMLElement");
const end = source.indexOf(
  'customElements.define("shipping-countdown", ShippingCountdown);',
  start
);
assert.ok(start >= 0 && end > start);
const countdownSource = `${source.slice(start, end)}\ncustomElements.define("shipping-countdown", ShippingCountdown);`;
const routineSource = await readFile(
  new URL("../src/scripts/product-routine.js", import.meta.url),
  "utf8"
);
const cartSource = await readFile(new URL("../src/scripts/cart.js", import.meta.url), "utf8");
const giftStart = cartSource.indexOf("  handleGiftWithPurchase(parsedState) {");
const giftEnd = cartSource.indexOf("  onCustomerLogin() {", giftStart);
assert.ok(giftStart >= 0 && giftEnd > giftStart);
const giftSource = `class GiftHandler {\n${cartSource.slice(giftStart, giftEnd)}\n}\ncustomElements.define("test-gift-handler", GiftHandler);`;

function fixture({
  routine = false,
  threshold = "50",
  failReads = false,
  failWrites = false,
  broadcastChannel = class {},
} = {}) {
  const classes = new Map();
  const timers = new Map();
  const calls = [];
  const window = new EventTarget();
  const document = new EventTarget();
  document.querySelector = () => null;
  let now = 0;
  let timerId = 0;
  let cart = { total_price: 0, item_count: 0, items: [] };
  let nextReadDelay = 5;
  let updateSignals = 0;
  document.addEventListener("cart:updated", () => updateSignals++);
  const setTimer = (callback, delay) => {
    const id = ++timerId;
    timers.set(id, { at: now + delay, callback });
    return id;
  };
  window.Shopify = { routes: { root: "/" }, currency: { active: "USD" } };
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    const read = /\/cart\.js$/.test(url);
    const snapshot = structuredClone(cart);
    const delay = read ? nextReadDelay : 5;
    nextReadDelay = 5;
    calls.push({ url, init });
    await new Promise((resolve) => setTimer(resolve, delay));
    return {
      ok: !((read && failReads) || (!read && failWrites)),
      json: async () => snapshot,
    };
  };
  class HTMLElement extends EventTarget {
    dataset = {};
    isConnected = true;
    text = { textContent: "" };
    querySelector(selector) {
      return selector === ".shipping-countdown-text" ? this.text : null;
    }
    getAttribute() {
      return threshold;
    }
  }
  const context = vm.createContext({
    window,
    document,
    HTMLElement,
    CustomEvent,
    localStorage: { setItem() {} },
    BroadcastChannel: broadcastChannel,
    customElements: {
      define: (name, value) => classes.set(name, value),
      get: (name) => classes.get(name),
    },
    setTimeout: setTimer,
    clearTimeout: (id) => timers.delete(id),
    fetch: (...args) => window.fetch(...args),
    Shopify: window.Shopify,
    getGwpEligibleTotal,
    console,
  });
  vm.runInContext(countdownSource, context);
  const element = new (classes.get("shipping-countdown"))();
  if (routine) {
    vm.runInContext(routineSource, context);
    const component = new (classes.get("product-routine"))();
    const button = new EventTarget();
    component.querySelector = (selector) =>
      selector === "[data-routine-bundle]" ? { querySelector: () => button } : null;
    component.querySelectorAll = () => [];
    // Exercise the real routine event subscription and cart reader, without its pricing DOM.
    component.updateBundle = () => {};
    component.connectedCallback();
  }
  const settle = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  };
  return {
    element,
    calls,
    window,
    document,
    get signals() {
      return updateSignals;
    },
    get cart() {
      return structuredClone(cart);
    },
    set cart(value) {
      cart = value;
    },
    set readDelay(value) {
      nextReadDelay = value;
    },
    giftHandler(settings) {
      window.gwpSettings = settings;
      vm.runInContext(giftSource, context);
      const handler = new (classes.get("test-gift-handler"))();
      handler.cart = {
        addFreeGift(variants) {
          for (const variant of variants) {
            const tier = settings.tiers.find((tier) => tier.variant === variant);
            cart.items.push({ product_id: Number(tier.product), quantity: 1, final_line_price: 0 });
            cart.item_count++;
          }
          return window.fetch("/cart/add", { method: "POST" });
        },
      };
      handler.removeGift = (line) => {
        cart.items.splice(line - 1, 1);
        cart.item_count--;
        return window.fetch("/cart/change", { method: "POST" });
      };
      return handler;
    },
    async tick(duration) {
      const target = now + duration;
      await settle();
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
        await settle();
      }
      now = target;
      await settle();
    },
  };
}

test("idle countdown and product routine settle without a read/event feedback loop", async () => {
  const f = fixture({ routine: true });
  f.element.connectedCallback();
  await f.tick(1000);
  assert.equal(f.calls.length, 1);
  assert.equal(f.signals, 0);
  assert.equal(f.element.text.textContent, "Free Shipping on Orders $50+");
  assert.equal(f.calls[0].init.oseaShippingCountdownRead, undefined);
  assert.equal(f.calls[0].init.credentials, "same-origin");
  assert.equal(f.calls[0].init.cache, "no-store");
});

test("ordinary cart reads still notify existing consumers and then settle", async () => {
  const f = fixture({ routine: true });
  f.element.connectedCallback();
  await f.tick(1000);
  const read = f.window.fetch("/cart.js");
  await f.tick(1000);
  await read;
  assert.ok(f.signals > 0);
  const count = f.calls.length;
  await f.tick(1000);
  assert.equal(f.calls.length, count);
});

test("two tabs do not broadcast countdown reads or create a cross-tab feedback loop", async () => {
  const channels = [];
  const broadcasts = [];
  class SharedChannel extends EventTarget {
    constructor(name) {
      super();
      this.name = name;
      channels.push(this);
    }
    postMessage(data) {
      broadcasts.push(data);
      for (const channel of channels) {
        if (channel !== this && channel.name === this.name) {
          const event = new MessageEvent("message", { data });
          channel.onmessage?.(event);
          channel.dispatchEvent(event);
        }
      }
    }
  }
  const a = fixture({ broadcastChannel: SharedChannel });
  const b = fixture({ broadcastChannel: SharedChannel });
  a.element.connectedCallback();
  b.element.connectedCallback();
  await a.tick(1000);
  await b.tick(1000);
  assert.equal(channels.length, 0, "countdowns must not create a BroadcastChannel");
  assert.equal(broadcasts.length, 0, "countdown reads must never notify other tabs");
  assert.equal(a.calls.length, 1);
  assert.equal(b.calls.length, 1);

  a.cart = { total_price: 2500, item_count: 1, items: [] };
  const update = a.window.fetch("/cart/change.js", { method: "POST" });
  await a.tick(1000);
  await update;
  await b.tick(1000);
  assert.equal(a.element.text.textContent, "Add $25 to bag for free shipping");
  assert.equal(b.calls.length, 1, "the other tab must not refresh from a read broadcast");
  assert.equal(broadcasts.length, 0);
  const reads = a.calls.length;
  await a.tick(5000);
  await b.tick(5000);
  assert.equal(a.calls.length, reads);
  assert.equal(b.calls.length, 1);
  a.element.disconnectedCallback();
  b.element.disconnectedCallback();
});

test("cart mutations refresh the remaining amount, free-shipping state, and empty state", async () => {
  const f = fixture({ routine: true });
  f.element.connectedCallback();
  await f.tick(1000);
  for (const [total, count, expected] of [
    [2000, 1, "Add $30 to bag for free shipping"],
    [6000, 2, "You get free shipping!"],
    [0, 0, "Free Shipping on Orders $50+"],
  ]) {
    f.cart = { total_price: total, item_count: count, items: [] };
    const update = f.window.fetch("/cart/change.js", { method: "POST" });
    await f.tick(1000);
    await update;
    assert.equal(f.element.text.textContent, expected);
    const reads = f.calls.length;
    await f.tick(500);
    assert.equal(f.calls.length, reads);
  }
});

test("a genuine cart update during an in-flight read is not lost", async () => {
  const f = fixture();
  f.readDelay = 400;
  f.element.connectedCallback();
  await f.tick(20);
  f.cart = { total_price: 2000, item_count: 1, items: [] };
  const update = f.window.fetch("/cart/change.js", { method: "POST" });
  await f.tick(1000);
  await update;
  assert.equal(f.element.text.textContent, "Add $30 to bag for free shipping");
});

test("explicit restore/bundle-style update events still refresh the shipping message", async () => {
  const f = fixture();
  f.element.connectedCallback();
  await f.tick(1000);
  f.cart = { total_price: 2500, item_count: 1, items: [] };
  f.document.dispatchEvent(new CustomEvent("cart:updated"));
  await f.tick(1000);
  assert.equal(f.element.text.textContent, "Add $25 to bag for free shipping");
});

test("the theme's non-.js mutation routes still update shipping without a polling loop", async () => {
  const f = fixture({ routine: true });
  f.element.connectedCallback();
  await f.tick(1000);
  f.cart = { total_price: 3000, item_count: 1, items: [] };
  const update = f.window.fetch("/cart/change", { method: "POST" });
  await f.tick(1000);
  await update;
  assert.equal(f.element.text.textContent, "Add $20 to bag for free shipping");
});

test("a detached countdown does not queue a new read after an in-flight update", async () => {
  const f = fixture();
  f.readDelay = 400;
  f.element.connectedCallback();
  await f.tick(20);
  f.document.dispatchEvent(new CustomEvent("cart:updated"));
  f.element.isConnected = false;
  f.element.disconnectedCallback();
  await f.tick(1000);
  assert.equal(f.calls.length, 1);
});

test("failed cart reads show the existing fallback without retrying forever", async () => {
  const f = fixture({ failReads: true });
  f.element.connectedCallback();
  await f.tick(1000);
  assert.equal(f.element.text.textContent, "Free Shipping on Orders $50+");
  assert.equal(f.calls.length, 1);
});

test("a zero threshold still needs no cart read", async () => {
  const f = fixture({ threshold: "0" });
  f.element.connectedCallback();
  await f.tick(1000);
  assert.equal(f.calls.length, 0);
  assert.equal(f.element.text.textContent, "You get free shipping!");
});

test("a failed mutation does not publish a successful cart update", async () => {
  const f = fixture({ failWrites: true });
  f.element.connectedCallback();
  await f.tick(1000);
  const mutation = f.window.fetch("/cart/add.js", { method: "POST" });
  await f.tick(1000);
  await mutation;
  assert.equal(f.signals, 0);
  assert.equal(f.calls.length, 2);
});

test("locale-aware mutation routes and the existing GET clear route still notify", async () => {
  const f = fixture();
  f.element.connectedCallback();
  await f.tick(1000);
  for (const [url, init] of [
    ["/en/cart/update?sections=cart-icon-bubble", { method: "POST" }],
    ["/cart/clear.js", undefined],
  ]) {
    const before = f.signals;
    const mutation = f.window.fetch(url, init);
    await f.tick(1000);
    await mutation;
    assert.ok(f.signals > before);
  }
});

test("gift qualification and removal still update shipping without restarting polling", async () => {
  const f = fixture({ routine: true });
  f.cart = {
    total_price: 6000,
    item_count: 1,
    items: [{ product_id: 123, quantity: 1, final_line_price: 6000 }],
  };
  const gifts = f.giftHandler({
    enabled: true,
    type: "auto",
    loyaltyOnly: false,
    productQualifierEnabled: false,
    tiers: [{ product: "456", variant: "789", threshold: 5000 }],
  });
  f.element.connectedCallback();
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(2000);
  assert.ok(f.cart.items.some((item) => item.product_id === 456));
  assert.equal(f.element.text.textContent, "You get free shipping!");
  const lowerCart = f.cart;
  lowerCart.total_price = 2000;
  lowerCart.items[0].final_line_price = 2000;
  f.cart = lowerCart;
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(2000);
  assert.ok(!f.cart.items.some((item) => item.product_id === 456));
  assert.equal(f.element.text.textContent, "Add $30 to bag for free shipping");
  const requests = f.calls.length;
  await f.tick(2000);
  assert.equal(f.calls.length, requests);
});

const twoGiftTiers = [
  { product: "457", variant: "790", threshold: 10000 },
  { product: "456", variant: "789", threshold: 5000 },
];
const giftSettings = (extra = {}) => ({
  enabled: true,
  type: "auto",
  loyaltyOnly: false,
  productQualifierEnabled: false,
  tiers: twoGiftTiers,
  ...extra,
});
const giftIds = (f) =>
  f.cart.items
    .filter((item) => item.product_id >= 456)
    .map((item) => item.product_id)
    .sort();

test("two gift tiers add once and step down independently without restarting reads", async () => {
  const f = fixture({ routine: true });
  f.cart = {
    total_price: 6000,
    item_count: 1,
    items: [{ product_id: 123, quantity: 1, final_line_price: 6000 }],
  };
  const gifts = f.giftHandler(giftSettings());
  f.element.connectedCallback();
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(2000);
  assert.deepEqual(giftIds(f), [456]);
  for (const [total, expected] of [
    [12000, [456, 457]],
    [6000, [456]],
    [2000, []],
  ]) {
    const next = f.cart;
    next.total_price = total;
    next.items[0].final_line_price = total;
    f.cart = next;
    gifts.handleGiftWithPurchase(f.cart);
    await f.tick(2000);
    assert.deepEqual(giftIds(f), expected);
    const count = f.calls.length;
    gifts.handleGiftWithPurchase(f.cart);
    gifts.handleGiftWithPurchase(f.cart);
    await f.tick(2000);
    assert.equal(f.calls.length, count, "Repeated checks must not add gifts or restart reads");
  }
  assert.equal(f.element.text.textContent, "Add $30 to bag for free shipping");
});

test("a product qualifier controls both gifts even when spending remains above both tiers", async () => {
  const f = fixture({ routine: true });
  f.cart = {
    total_price: 12000,
    item_count: 1,
    items: [{ product_id: 124, quantity: 1, final_line_price: 12000 }],
  };
  const gifts = f.giftHandler(
    giftSettings({
      productQualifierEnabled: true,
      productQualifierIds: [123],
    })
  );
  f.element.connectedCallback();
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(1000);
  assert.deepEqual(giftIds(f), []);
  const qualified = f.cart;
  qualified.items.push({ product_id: 123, quantity: 1, final_line_price: 2000 });
  qualified.total_price += 2000;
  qualified.item_count++;
  f.cart = qualified;
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(2000);
  assert.deepEqual(giftIds(f), [456, 457]);
  const unqualified = f.cart;
  unqualified.items = unqualified.items.filter((item) => item.product_id !== 123);
  unqualified.total_price -= 2000;
  unqualified.item_count--;
  f.cart = unqualified;
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(2000);
  assert.deepEqual(giftIds(f), []);
  const count = f.calls.length;
  await f.tick(2000);
  assert.equal(f.calls.length, count);
});

test("gift-card-only value cannot unlock either gift", async () => {
  const f = fixture();
  f.cart = {
    total_price: 15000,
    item_count: 1,
    items: [{ product_id: 125, gift_card: true, quantity: 1, final_line_price: 15000 }],
  };
  const gifts = f.giftHandler(giftSettings());
  f.element.connectedCallback();
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(1000);
  assert.deepEqual(giftIds(f), []);
  assert.equal(f.calls.length, 1);
});

test("loyalty-only gifts remain gated for guests and respond to the logged-in state", async () => {
  const f = fixture();
  f.cart = {
    total_price: 12000,
    item_count: 1,
    items: [{ product_id: 123, quantity: 1, final_line_price: 12000 }],
  };
  const gifts = f.giftHandler(giftSettings({ loyaltyOnly: true }));
  f.element.connectedCallback();
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(1000);
  assert.deepEqual(giftIds(f), []);
  // This exercises the theme's state gate, not authentication with the loyalty provider.
  f.window.customerLoggedIn = true;
  gifts.handleGiftWithPurchase(f.cart);
  await f.tick(2000);
  assert.deepEqual(giftIds(f), [456, 457]);
});
