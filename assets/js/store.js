const Store = (() => {
    const state = {
        items: [],
        cfg: {},
        cart: JSON.parse(localStorage.getItem('cart') || '[]')
    };

    const fmt = v => new Intl.NumberFormat('es-CO').format(Number(v) || 0);

    function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); Events.emit('cart:updated'); }
    function addToCart(it) {
        const f = state.cart.find(c => c.id === it.id);
        if (f) f.qty += 1;
        else state.cart.push({ id: it.id, nombre: it.nombre, precio: Number(it.precio) || 0, qty: 1, sku: it.sku || '', note: '' });
        saveCart();
    }

    function inc(i) { state.cart[i].qty += 1; saveCart(); }
    function dec(i) { state.cart[i].qty = Math.max(1, state.cart[i].qty - 1); saveCart(); }
    function del(i) { state.cart.splice(i, 1); saveCart(); }
    function clear() { state.cart = []; saveCart(); }
    function total() { return state.cart.reduce((a, b) => a + b.precio * b.qty, 0); }

    const Events = { fns: {}, on: (ev, fn) => (Events.fns[ev] = (Events.fns[ev] || []).concat(fn)), emit: (ev, d) => (Events.fns[ev] || []).forEach(fn => fn(d)) };

    return { state, fmt, saveCart, addToCart, inc, dec, del, clear, total, Events };
})();
