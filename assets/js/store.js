const Store = (() => {
  const safeParse = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const currency = (APP_FLAGS && APP_FLAGS.currency) || "es-CO";

  const state = {
    items: [],
    cfg: {},
    cart: safeParse("cart", []),
  };

  const fmt = (v) => new Intl.NumberFormat(currency).format(Number(v) || 0);

  const Events = {
    fns: {},
    on: (ev, fn) =>
      (Events.fns[ev] = (Events.fns[ev] || []).concat(fn)),
    emit: (ev, d) => (Events.fns[ev] || []).forEach((fn) => fn(d)),
  };

  const persistCart = () => {
    localStorage.setItem("cart", JSON.stringify(state.cart));
    Events.emit("cart:updated");
  };

  const addToCart = (it) => {
    if (!it) return;
    const existing = state.cart.find((c) => c.id === it.id);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({
        id: it.id,
        nombre: it.nombre,
        precio: Number(it.precio) || 0,
        qty: 1,
        sku: it.sku || "",
        note: "",
      });
    }
    persistCart();
  };

  const inc = (i) => {
    if (!state.cart[i]) return;
    state.cart[i].qty += 1;
    persistCart();
  };

  const dec = (i) => {
    if (!state.cart[i]) return;
    state.cart[i].qty = Math.max(1, state.cart[i].qty - 1);
    persistCart();
  };

  const del = (i) => {
    state.cart.splice(i, 1);
    persistCart();
  };

  const clear = () => {
    state.cart = [];
    persistCart();
  };

  const total = () =>
    state.cart.reduce((sum, item) => sum + item.precio * item.qty, 0);

  return {
    state,
    fmt,
    saveCart: persistCart,
    addToCart,
    inc,
    dec,
    del,
    clear,
    total,
    Events,
  };
})();
