const Store = (() => {
  const CART_KEY = "cart";
  const ORDER_KEY = "lunaria_order_draft";
  const currency = (APP_FLAGS && APP_FLAGS.currency) || "es-CO";

  const safeParse = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const readMoney = (...values) => {
    for (const value of values) {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    return null;
  };

  const normalizeCartItem = (item) => {
    if (!item || item.id === undefined || item.id === null) return null;
    return {
      id: String(item.id),
      nombre: String(item.nombre || ""),
      precio: Math.max(0, Number(item.precio) || 0),
      qty: Math.max(1, Number(item.qty) || 1),
      sku: String(item.sku || ""),
      note: typeof item.note === "string" ? item.note : "",
      foto: typeof item.foto === "string" ? item.foto : "",
      descripcion: typeof item.descripcion === "string" ? item.descripcion : "",
    };
  };

  const normalizeCart = (cart) =>
    Array.isArray(cart)
      ? cart
          .map(normalizeCartItem)
          .filter(Boolean)
      : [];

  const defaultOrder = () => ({
    notes: "",
    deliveryType: "domicilio",
    customer: {
      name: "",
      phone: "",
      address: "",
      reference: "",
    },
    payment: "efectivo",
    tip: 0,
  });

  const normalizeOrder = (order) => {
    const base = defaultOrder();
    return {
      notes: typeof order?.notes === "string" ? order.notes : base.notes,
      deliveryType: order?.deliveryType === "recoger" ? "recoger" : base.deliveryType,
      customer: {
        name:
          typeof order?.customer?.name === "string"
            ? order.customer.name
            : base.customer.name,
        phone:
          typeof order?.customer?.phone === "string"
            ? order.customer.phone
            : base.customer.phone,
        address:
          typeof order?.customer?.address === "string"
            ? order.customer.address
            : base.customer.address,
        reference:
          typeof order?.customer?.reference === "string"
            ? order.customer.reference
            : base.customer.reference,
      },
      payment:
        order?.payment === "transferencia" ? "transferencia" : base.payment,
      tip: Math.max(0, Number(order?.tip) || 0),
    };
  };

  const state = {
    items: [],
    cfg: {},
    cart: normalizeCart(safeParse(CART_KEY, [])),
    order: normalizeOrder(safeParse(ORDER_KEY, {})),
  };

  const fmt = (v) => new Intl.NumberFormat(currency).format(Number(v) || 0);

  const Events = {
    fns: {},
    on: (ev, fn) => (Events.fns[ev] = (Events.fns[ev] || []).concat(fn)),
    emit: (ev, d) => (Events.fns[ev] || []).forEach((fn) => fn(d)),
  };

  const persistCart = () => {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    Events.emit("cart:updated", state.cart.slice());
  };

  const persistOrder = () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(state.order));
    Events.emit("order:updated", normalizeOrder(state.order));
  };

  const findCartIndex = (id) =>
    state.cart.findIndex((item) => String(item.id) === String(id));

  const getItemById = (id) =>
    state.items.find((item) => String(item.id) === String(id)) || null;

  const getCartQty = (id) => {
    const index = findCartIndex(id);
    return index >= 0 ? state.cart[index].qty : 0;
  };

  const upsertCartItem = (source, qty) => {
    const nextQty = Math.max(0, Number(qty) || 0);
    const index = findCartIndex(source?.id);

    if (nextQty <= 0) {
      if (index >= 0) {
        state.cart.splice(index, 1);
        persistCart();
      }
      return;
    }

    const itemData = normalizeCartItem({
      ...getItemById(source?.id),
      ...source,
      qty: nextQty,
    });

    if (!itemData) return;

    if (index >= 0) {
      state.cart[index] = { ...state.cart[index], ...itemData, qty: nextQty };
    } else {
      state.cart.push(itemData);
    }

    persistCart();
  };

  const addToCart = (item, delta = 1) => {
    if (!item || item.id === undefined || item.id === null) return;
    upsertCartItem(item, getCartQty(item.id) + (Number(delta) || 1));
  };

  const setQtyById = (id, qty, source) => {
    const existing = findCartIndex(id) >= 0 ? state.cart[findCartIndex(id)] : null;
    upsertCartItem(source || existing || getItemById(id) || { id }, qty);
  };

  const incById = (id, source) => {
    setQtyById(id, getCartQty(id) + 1, source);
  };

  const decById = (id, source) => {
    setQtyById(id, getCartQty(id) - 1, source);
  };

  const removeById = (id) => {
    setQtyById(id, 0);
  };

  const inc = (i) => {
    if (!state.cart[i]) return;
    incById(state.cart[i].id, state.cart[i]);
  };

  const dec = (i) => {
    if (!state.cart[i]) return;
    decById(state.cart[i].id, state.cart[i]);
  };

  const del = (i) => {
    if (!state.cart[i]) return;
    removeById(state.cart[i].id);
  };

  const clear = () => {
    state.cart = [];
    persistCart();
  };

  const updateOrder = (patch = {}) => {
    state.order = normalizeOrder({
      ...state.order,
      ...patch,
      customer: {
        ...state.order.customer,
        ...(patch.customer || {}),
      },
    });
    persistOrder();
  };

  const setCustomerField = (field, value) => {
    if (!Object.prototype.hasOwnProperty.call(state.order.customer, field)) return;
    updateOrder({ customer: { [field]: value } });
  };

  const setNotes = (notes) => {
    updateOrder({ notes: typeof notes === "string" ? notes : "" });
  };

  const setPayment = (payment) => {
    updateOrder({
      payment: payment === "transferencia" ? "transferencia" : "efectivo",
    });
  };

  const setTip = (tip) => {
    updateOrder({ tip: Math.max(0, Number(tip) || 0) });
  };

  const setDeliveryType = (type) => {
    updateOrder({ deliveryType: type === "recoger" ? "recoger" : "domicilio" });
  };

  const subtotal = () =>
    state.cart.reduce((sum, item) => sum + item.precio * item.qty, 0);

  const deliveryFee = () =>
    state.order.deliveryType === "recoger" ? 0 :
    readMoney(
      state.cfg.delivery_fee,
      state.cfg.deliveryFee,
      state.cfg.costo_domicilio,
      state.cfg.costoDomicilio,
      state.cfg.domicilio,
      state.cfg.valor_domicilio,
      3000
    ) || 0;

  const total = () => subtotal() + deliveryFee();

  return {
    state,
    fmt,
    saveCart: persistCart,
    saveOrder: persistOrder,
    addToCart,
    setQtyById,
    incById,
    decById,
    removeById,
    getCartQty,
    getItemById,
    subtotal,
    deliveryFee,
    total,
    updateOrder,
    setCustomerField,
    setNotes,
    setPayment,
    setTip,
    setDeliveryType,
    inc,
    dec,
    del,
    clear,
    Events,
  };
})();
