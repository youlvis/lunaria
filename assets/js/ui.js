const UI = (() => {
  // --- Cached DOM references ---
  const DOM = {
    actionBar: null,
    catTabs: null,
    optionsBar: null,
    searchPanel: null,
    searchUnified: null,
    clearSearch: null,
    openSearch: null,
    openCatMenu: null,
    catMenu: null,
    catMenuOverlay: null,
    content: null,
    detailModal: null,
    detailImg: null,
    detailSkeleton: null,
    detailName: null,
    detailDesc: null,
    detailPrice: null,
    detailCartControls: null,
    closeDetail: null,
    currentCat: null,
    viewOrderCta: null,
    viewOrderCount: null,
    viewOrderTotal: null,
    orderFlow: null,
    orderCheckoutScreen: null,
    orderSummaryScreen: null,
    orderBackBtn: null,
    orderCheckoutBody: null,
    orderCartItems: null,
    orderDeliveryFields: null,
    orderNotes: null,
    orderName: null,
    orderPhone: null,
    orderAddress: null,
    orderReference: null,
    customTipBtn: null,
    customTipWrap: null,
    customTipInput: null,
    orderSubtotal: null,
    orderDelivery: null,
    orderTipRow: null,
    orderTipAmount: null,
    orderTotal: null,
    orderReviewBtn: null,
    summaryBackBtn: null,
    summaryItems: null,
    summarySubtotal: null,
    summaryDelivery: null,
    summaryTip: null,
    summaryTotal: null,
    summaryAddress: null,
    summaryCustomer: null,
    summaryPayment: null,
    summaryNotesBlock: null,
    summaryNotes: null,
    sendOrderBtn: null,
    lastOrderBtn: null,
    lastOrderModal: null,
    lastOrderItems: null,
    lastOrderTotal: null,
    repeatOrderBtn: null,
  };

  const initDOM = () => {
    DOM.actionBar = document.getElementById("actionBar");
    DOM.catTabs = document.getElementById("catTabs");
    DOM.optionsBar = document.getElementById("optionsBar");
    DOM.searchPanel = document.getElementById("searchPanel");
    DOM.searchUnified = document.getElementById("searchUnified");
    DOM.clearSearch = document.getElementById("clearSearch");
    DOM.openSearch = document.getElementById("openSearch");
    DOM.openCatMenu = document.getElementById("openCatMenu");
    DOM.catMenu = document.getElementById("catMenu");
    DOM.catMenuOverlay = document.getElementById("catMenuOverlay");
    DOM.content = document.getElementById("content");
    DOM.detailModal = document.getElementById("detailModal");
    DOM.detailImg = document.getElementById("detailImg");
    DOM.detailSkeleton = document.getElementById("detailSkeleton");
    DOM.detailName = document.getElementById("detailName");
    DOM.detailDesc = document.getElementById("detailDesc");
    DOM.detailPrice = document.getElementById("detailPrice");
    DOM.detailCartControls = document.getElementById("detailCartControls");
    DOM.closeDetail = document.getElementById("closeDetail");
    DOM.currentCat = document.getElementById("currentCat");
    DOM.viewOrderCta = document.getElementById("viewOrderCta");
    DOM.viewOrderCount = document.getElementById("viewOrderCount");
    DOM.viewOrderTotal = document.getElementById("viewOrderTotal");
    DOM.orderFlow = document.getElementById("orderFlow");
    DOM.orderCheckoutScreen = document.getElementById("orderCheckoutScreen");
    DOM.orderSummaryScreen = document.getElementById("orderSummaryScreen");
    DOM.orderBackBtn = document.getElementById("orderBackBtn");
    DOM.orderCheckoutBody = document.getElementById("orderCheckoutBody");
    DOM.orderCartItems = document.getElementById("orderCartItems");
    DOM.orderDeliveryFields = document.getElementById("orderDeliveryFields");
    DOM.orderNotes = document.getElementById("orderNotes");
    DOM.orderName = document.getElementById("orderName");
    DOM.orderPhone = document.getElementById("orderPhone");
    DOM.orderAddress = document.getElementById("orderAddress");
    DOM.orderReference = document.getElementById("orderReference");
    DOM.customTipBtn = document.getElementById("customTipBtn");
    DOM.customTipWrap = document.getElementById("customTipWrap");
    DOM.customTipInput = document.getElementById("customTipInput");
    DOM.orderSubtotal = document.getElementById("orderSubtotal");
    DOM.orderDelivery = document.getElementById("orderDelivery");
    DOM.orderTipRow = document.getElementById("orderTipRow");
    DOM.orderTipAmount = document.getElementById("orderTipAmount");
    DOM.orderTotal = document.getElementById("orderTotal");
    DOM.orderReviewBtn = document.getElementById("orderReviewBtn");
    DOM.summaryBackBtn = document.getElementById("summaryBackBtn");
    DOM.summaryItems = document.getElementById("summaryItems");
    DOM.summarySubtotal = document.getElementById("summarySubtotal");
    DOM.summaryDelivery = document.getElementById("summaryDelivery");
    DOM.summaryTip = document.getElementById("summaryTip");
    DOM.summaryTotal = document.getElementById("summaryTotal");
    DOM.summaryAddress = document.getElementById("summaryAddress");
    DOM.summaryCustomer = document.getElementById("summaryCustomer");
    DOM.summaryPayment = document.getElementById("summaryPayment");
    DOM.summaryNotesBlock = document.getElementById("summaryNotesBlock");
    DOM.summaryNotes = document.getElementById("summaryNotes");
    DOM.sendOrderBtn = document.getElementById("sendOrderBtn");
    DOM.lastOrderBtn = document.getElementById("lastOrderBtn");
    DOM.lastOrderModal = document.getElementById("lastOrderModal");
    DOM.lastOrderItems = document.getElementById("lastOrderItems");
    DOM.lastOrderTotal = document.getElementById("lastOrderTotal");
    DOM.repeatOrderBtn = document.getElementById("repeatOrderBtn");
    document.body.classList.toggle("order-mode", Boolean(AppMode?.isOrder));
  };

  const $ = (s) => document.querySelector(s);
  const hide = (el) => el?.classList.add("hidden");
  const show = (el) => el?.classList.remove("hidden");
  const toggleHidden = (el, force) => el?.classList.toggle("hidden", force);
  const getContent = () => DOM.content;
  const getSections = () => DOM.content ? Array.from(DOM.content.querySelectorAll(".menu__section")) : [];
  const getScrollY = () =>
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;
  const MENU_HISTORY_KEY = "__menuView";
  const ORDER_PRESET_TIPS = [0, 2000, 5000];

  const getSearchState = () => {
    const query = (DOM.searchUnified?.value || "").trim();
    return {
      isOpen: DOM.searchPanel ? !DOM.searchPanel.classList.contains("hidden") : false,
      query,
    };
  };

  const setSearchUI = (open) => {
    if (open) {
      show(DOM.searchPanel);
      hide(DOM.catTabs);
      DOM.searchUnified?.focus();
    } else {
      hide(DOM.searchPanel);
      show(DOM.catTabs);
    }
  };

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const cloudi = (url, w = 400) => {
    if (!url || typeof url !== "string") return url;
    if (!url.includes("res.cloudinary.com")) return url;
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;
    return `${parts[0]}/upload/c_fill,f_auto,q_auto,w_${w}/${parts[1]}`;
  };

  const debounce = (fn, wait = 400) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const withCompositionGuard = (inputEl, handler) => {
    if (!inputEl) return;
    let composing = false;
    inputEl.addEventListener("compositionstart", () => (composing = true));
    inputEl.addEventListener("compositionend", () => {
      composing = false;
      handler();
    });
    inputEl.addEventListener("input", () => {
      if (!composing) handler();
    });
  };

  const addPress = (el, handler) => {
    if (!el) return;
    el.addEventListener("click", handler);
    el.addEventListener("touchend", (ev) => {
      ev.preventDefault();
      handler(ev);
    }, { passive: false });
  };

  function groupByCategory(items) {
    const map = new Map();
    const cats = [];
    items.forEach((it) => {
      const cat = String(it.categoria || "Otros");
      if (!map.has(cat)) {
        map.set(cat, []);
        cats.push(cat);
      }
      map.get(cat).push(it);
    });
    return { cats, map: Object.fromEntries(map) };
  }

  function calcOffset() {
    const off = DOM.actionBar?.offsetHeight || 0;
    document.documentElement.style.setProperty("--sticky-offset", `${off}px`);
    return off;
  }

  function buildTabs(cats) {
    const wrap = DOM.catTabs;
    if (!wrap) return;
    wrap.innerHTML = "";
    cats.forEach((c, idx) => {
      const b = document.createElement("button");
      b.className = "category-tabs__item";
      b.dataset.target = `#sec-${slug(c)}`;
      b.textContent = c;
      if (idx === 0) b.classList.add("is-active");
      b.onclick = () => goToCategory(b.dataset.target, "smooth");
      wrap.appendChild(b);
    });
  }

  function buildCatMenus(cats) {
    if (DOM.catMenu) DOM.catMenu.innerHTML = "";

    cats.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "overlay__item";
      btn.textContent = c;
      btn.onclick = () => {
        closeOverlay("catMenuOverlay");
        goToCategory(`#sec-${slug(c)}`, "smooth");
      };
      DOM.catMenu.appendChild(btn);
    });
  }

  function buildSections({ cats, map }) {
    const cont = getContent();
    if (!cont) return;
    cont.innerHTML = "";

    cats.forEach((c) => {
      const sec = document.createElement("section");
      sec.id = `sec-${slug(c)}`;
      sec.className = "menu__section";
      sec.innerHTML = `<h2 class="menu__section-title">${c}</h2><div class="menu__list" id="list-${slug(c)}"></div>`;
      cont.appendChild(sec);

      const list = sec.querySelector(`#list-${slug(c)}`);
      (map[c] || []).forEach((it) => list.appendChild(rowItem(it)));
    });
  }

  function cartControlsMarkup(id, qty) {
    return `<div class="menu-item__cart" data-cart-controls><button class="qty-btn" type="button" data-cart-action="dec" data-item-id="${id}" aria-label="Quitar uno" ${qty <= 0 ? "disabled" : ""}>-</button><span class="qty-value" data-cart-qty="${id}">${qty}</span><button class="qty-btn" type="button" data-cart-action="inc" data-item-id="${id}" aria-label="Agregar uno">+</button></div>`;
  }

  function rowItem(it) {
    const hasDesc = Boolean(it.descripcion && String(it.descripcion).trim().length);
    const div = document.createElement("div");
    div.className = "menu-item";
    div.setAttribute("data-detail", it.id);
    div.dataset.itemId = it.id;
    const titleNorm = norm(it.nombre || "");
    const textNorm = norm(`${it.nombre || ""} ${it.descripcion || ""}`);
    div.dataset.searchTitle = titleNorm;
    div.dataset.searchText = textNorm;
    const thumb = cloudi(it.foto, 240);
    const thumb2x = cloudi(it.foto, 480);
    const qty = AppMode?.isOrder ? Store.getCartQty(it.id) : 0;
    const priceMarkup = `<div class="menu-item__price">$${Store.fmt(it.precio || 0)}</div>`;
    const bottomMarkup = AppMode?.isOrder
      ? `<div class="menu-item__meta">${priceMarkup}${cartControlsMarkup(
          it.id,
          qty
        )}</div>`
      : priceMarkup;
    div.innerHTML = `<div class="menu-item__thumb" data-detail="${it.id}"><img loading="lazy" decoding="async" fetchpriority="low" width="160" height="160" src="${thumb || ""}" srcset="${thumb || ""} 1x, ${thumb2x || thumb || ""} 2x" sizes="(max-width: 640px) 160px, 180px" alt="${it.nombre || ""}"></div><div class="menu-item__body"><div class="menu-item__title">${it.nombre || ""}</div>${hasDesc ? `<p class="menu-item__desc">${it.descripcion || ""}</p>` : ""}${bottomMarkup}</div>`;
    return div;
  }

  const syncSearchInputs = (value = "") => {
    if (DOM.searchUnified) DOM.searchUnified.value = value;
  };

  function openSearchPanel() {
    setSearchUI(true);
  }

  function closeSearchPanel(clear = true) {
    const hadQuery = Boolean((DOM.searchUnified?.value || "").trim());
    setSearchUI(false);
    if (clear) syncSearchInputs("");
    if (hadQuery) applySearch();
  }

  function ensureEmptyBanner() {
    let emptyBanner = document.getElementById("noResults");
    if (!emptyBanner) {
      emptyBanner = document.createElement("div");
      emptyBanner.id = "noResults";
      emptyBanner.className = "hidden menu__empty";
      const content = getContent();
      content?.parentNode?.insertBefore(emptyBanner, content.nextSibling);
    }
    return emptyBanner;
  };

  const ensureOrderIndexes = (sections) => {
    sections.forEach((sec, secIdx) => {
      if (!sec.dataset.sectionIndex) sec.dataset.sectionIndex = String(secIdx);
      Array.from(sec.querySelectorAll(".menu-item")).forEach((row, idx) => {
        if (!row.dataset.orderIndex) row.dataset.orderIndex = String(idx);
      });
    });
  };

  const resetSections = (sections, container) => {
    sections.forEach((sec) => {
      sec.classList.remove("hidden");
      const rows = Array.from(sec.querySelectorAll(".menu-item"));
      sec.style.display = "";
      sec.dataset.searchScore = "0";
      sec.style.marginTop = "";
      rows.forEach((row) => {
        row.style.display = "";
        row.dataset.searchScore = "0";
      });
      const parent = rows[0]?.parentNode;
      if (parent) {
        rows.slice().sort((a, b) => Number(a.dataset.orderIndex || 0) - Number(b.dataset.orderIndex || 0)).forEach((row) => parent.appendChild(row));
      }
    });

    if (container) {
      sections.slice().sort((a, b) => Number(a.dataset.sectionIndex || 0) - Number(b.dataset.sectionIndex || 0)).forEach((sec) => container.appendChild(sec));
    }
  };

  function applySearch() {
    const raw = (DOM.searchUnified?.value || "").trim();
    if (raw === applySearch.lastRaw) return;
    applySearch.lastRaw = raw;
    const q = norm(raw);
    const sections = getSections();
    const container = getContent();
    if (!sections.length || !container) return;

    ensureOrderIndexes(sections);
    const emptyBanner = ensureEmptyBanner();

    if (!q) {
      resetSections(sections, container);
      hide(emptyBanner);
      return;
    }

    let matches = 0;

    sections.forEach((sec) => {
      const heading = sec.querySelector(".menu__section-title")?.textContent || "";
      const headingMatch = norm(heading).includes(q);
      const rows = Array.from(sec.querySelectorAll(".menu-item"));
      let sectionMatch = false;
      let sectionScore = 0;

      rows.forEach((row) => {
        const titleText = row.dataset.searchTitle || "";
        const fullText = row.dataset.searchText || "";
        let score = 0;
        if (titleText.includes(q)) score = 3;
        else if (fullText.includes(q)) score = 2;
        else if (headingMatch) score = 1;

        if (score) {
          row.style.display = "";
          row.dataset.searchScore = String(score);
          sectionMatch = true;
          sectionScore = Math.max(sectionScore, score);
        } else {
          row.style.display = "none";
          row.dataset.searchScore = "0";
        }
      });

      toggleHidden(sec, !sectionMatch);
      sec.style.display = sectionMatch ? "" : "none";
      sec.dataset.searchScore = String(sectionScore);

      if (sectionMatch) {
        const parent = rows[0]?.parentNode;
        if (parent) {
          rows.filter((row) => row.style.display !== "none").sort((a, b) => {
            const sa = Number(a.dataset.searchScore || 0);
            const sb = Number(b.dataset.searchScore || 0);
            if (sa !== sb) return sb - sa;
            return Number(a.dataset.orderIndex || 0) - Number(b.dataset.orderIndex || 0);
          }).forEach((row) => parent.appendChild(row));
        }
        matches++;
      }
    });

    const visibleSections = sections.filter((sec) => sec.style.display !== "none");
    visibleSections.sort((a, b) => {
      const sa = Number(a.dataset.searchScore || 0);
      const sb = Number(b.dataset.searchScore || 0);
      if (sa !== sb) return sb - sa;
      return Number(a.dataset.sectionIndex || 0) - Number(b.dataset.sectionIndex || 0);
    }).forEach((sec, idx) => {
      container.appendChild(sec);
      sec.style.marginTop = idx === 0 ? "0px" : "";
    });

    if (!matches) {
      emptyBanner.textContent = `No encontramos coincidencias con "${raw}". Prueba con otro término.`;
      show(emptyBanner);
    } else {
      hide(emptyBanner);
    }
  }

  let currentOrderScreen = "menu";
  let customTipOpen = false;

  function isOrderMode() {
    return Boolean(AppMode?.isOrder);
  }

  function formatMoney(value) {
    return `$${Store.fmt(value || 0)}`;
  }

  function paymentLabel(value) {
    return value === "transferencia" ? "Transferencia" : "Efectivo";
  }

  function getCartCount() {
    return Store.state.cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  function getCheckoutSnapshot(snapshot) {
    return buildMenuSnapshot(snapshot);
  }

  function resolveCartItem(item) {
    const source = Store.getItemById(item.id) || {};
    return {
      ...source,
      ...item,
      id: item.id,
      nombre: item.nombre || source.nombre || "",
      descripcion: item.descripcion || source.descripcion || "",
      foto: item.foto || source.foto || "",
      precio: Number(item.precio ?? source.precio) || 0,
      qty: Math.max(1, Number(item.qty) || 1),
    };
  }

  function syncFieldValue(field, value) {
    if (!field) return;
    const next = typeof value === "string" ? value : String(value || "");
    if (field.value !== next) field.value = next;
  }

  function getOrderWhatsAppPhone() {
    const cfg = Store.state.cfg || {};
    const raw =
      cfg.telefono_whatsapp ||
      cfg.whatsapp ||
      cfg.telefono ||
      (typeof EVENTOS_WA_PHONE !== "undefined" ? EVENTOS_WA_PHONE : "");
    return String(raw || "").replace(/\D/g, "");
  }

  function buildOrderMessage() {
    const order = Store.state.order;
    const subtotal = Store.subtotal();
    const delivery = Store.deliveryFee();
    const total = Store.total();
    const isRecoger = order.deliveryType === "recoger";
    const items = Store.state.cart
      .map((item) => {
        const resolved = resolveCartItem(item);
        return `${resolved.qty}x ${resolved.nombre} - ${formatMoney(
          resolved.precio * resolved.qty
        )}`;
      })
      .join("\n");

    const lines = [
      "Hola, quiero hacer este pedido:",
      "",
      items,
      "",
      `Subtotal: ${formatMoney(subtotal)}`
    ];

    if (!isRecoger) {
      lines.push(`Domicilio: ${formatMoney(delivery)}`);
    }

    lines.push(`Total: ${formatMoney(total)}`);
    lines.push("");
    lines.push(`Tipo de entrega: ${isRecoger ? "Recoger en tienda" : "A Domicilio"}`);
    lines.push(`Nombre: ${order.customer.name || "-"}`);
    lines.push(`Telefono: ${order.customer.phone || "-"}`);

    if (!isRecoger) {
      lines.push(`Direccion: ${order.customer.address || "-"}`);
      lines.push(`Referencia: ${order.customer.reference || "-"}`);
    }

    lines.push(`Pago: ${paymentLabel(order.payment)}`);
    lines.push(`Notas: ${order.notes || "-"}`);

    return lines.join("\n");
  }

  function renderMenuCartControls() {
    if (!isOrderMode()) return;
    document.querySelectorAll("[data-cart-qty]").forEach((qtyEl) => {
      const id = qtyEl.getAttribute("data-cart-qty");
      const qty = Store.getCartQty(id);
      qtyEl.textContent = String(qty);
      const controls = qtyEl.closest("[data-cart-controls]");
      const decBtn = controls?.querySelector('[data-cart-action="dec"]');
      if (decBtn) decBtn.disabled = qty <= 0;
    });
  }

  function renderOrderCta() {
    if (!DOM.viewOrderCta) return;
    const itemCount = getCartCount();
    const shouldShow = isOrderMode() && currentOrderScreen === "menu" && itemCount > 0;
    toggleHidden(DOM.viewOrderCta, !shouldShow);
    if (!shouldShow) return;
    if (DOM.viewOrderCount) DOM.viewOrderCount.textContent = String(itemCount);
    if (DOM.viewOrderTotal) DOM.viewOrderTotal.textContent = formatMoney(Store.subtotal());
  }

  function renderCheckoutItems() {
    if (!DOM.orderCartItems) return;
    DOM.orderCartItems.innerHTML = Store.state.cart
      .map((item) => {
        const resolved = resolveCartItem(item);
        const img = cloudi(resolved.foto, 180) || resolved.foto || "";
        return `<article class="order-item"><div class="order-item__media">${img ? `<img src="${img}" alt="${resolved.nombre}" loading="lazy" decoding="async">` : ""}</div><div class="order-item__body"><h3 class="order-item__title">${resolved.nombre}</h3><div class="order-item__price">${formatMoney(
          resolved.precio
        )}</div></div><div class="order-item__actions"><button class="order-item__remove" type="button" data-order-action="remove" data-item-id="${resolved.id}" aria-label="Eliminar plato"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 12h10l1-12" /><path d="M9 7V4h6v3" /></svg></button><div class="order-item__qty"><button class="qty-btn" type="button" data-order-action="dec" data-item-id="${resolved.id}" aria-label="Quitar uno">-</button><span class="qty-value">${resolved.qty}</span><button class="qty-btn" type="button" data-order-action="inc" data-item-id="${resolved.id}" aria-label="Agregar uno">+</button></div></div></article>`;
      })
      .join("");
  }

  function syncOrderDraftFields() {
    const order = Store.state.order;
    syncFieldValue(DOM.orderNotes, order.notes || "");
    syncFieldValue(DOM.orderName, order.customer.name || "");
    syncFieldValue(DOM.orderPhone, order.customer.phone || "");
    syncFieldValue(DOM.orderAddress, order.customer.address || "");
    syncFieldValue(DOM.orderReference, order.customer.reference || "");
    syncFieldValue(
      DOM.customTipInput,
      ORDER_PRESET_TIPS.includes(order.tip) ? "" : String(order.tip || "")
    );

    const isRecoger = order.deliveryType === "recoger";
    toggleHidden(DOM.orderDeliveryFields, isRecoger);

    document.querySelectorAll("[data-delivery]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-delivery") === order.deliveryType);
    });

    document.querySelectorAll("[data-payment]").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        btn.getAttribute("data-payment") === order.payment
      );
    });

    const isCustomTip =
      customTipOpen || !ORDER_PRESET_TIPS.includes(Number(order.tip || 0));
    document.querySelectorAll("[data-tip]").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        !isCustomTip &&
          Number(btn.getAttribute("data-tip")) === Number(order.tip || 0)
      );
    });

    DOM.customTipBtn?.classList.toggle("is-active", isCustomTip);
    toggleHidden(DOM.customTipWrap, !isCustomTip);
  }

  function renderCheckoutTotals() {
    const subtotal = Store.subtotal();
    const delivery = Store.deliveryFee();
    const total = Store.total();

    if (DOM.orderSubtotal) DOM.orderSubtotal.textContent = formatMoney(subtotal);
    if (DOM.orderDelivery) DOM.orderDelivery.textContent = formatMoney(delivery);
    if (DOM.orderTotal) DOM.orderTotal.textContent = formatMoney(total);
  }

  function renderSummaryView() {
    if (!DOM.summaryItems) return;

    DOM.summaryItems.innerHTML = Store.state.cart
      .map((item) => {
        const resolved = resolveCartItem(item);
        return `<div class="summary-card__item"><span>${resolved.qty}x ${resolved.nombre}</span><strong>${formatMoney(
          resolved.precio * resolved.qty
        )}</strong></div>`;
      })
      .join("");

    const subtotal = Store.subtotal();
    const delivery = Store.deliveryFee();
    const total = Store.total();
    const order = Store.state.order;
    const isRecoger = order.deliveryType === "recoger";

    if (DOM.summarySubtotal) DOM.summarySubtotal.textContent = formatMoney(subtotal);
    if (DOM.summaryDelivery) DOM.summaryDelivery.textContent = isRecoger ? "Gratis (Recoger)" : formatMoney(delivery);
    if (DOM.summaryTotal) DOM.summaryTotal.textContent = formatMoney(total);
    if (DOM.summaryAddress) {
      DOM.summaryAddress.textContent = isRecoger ? "Recoger en el local" : (order.customer.address || "Sin direccion");
    }
    if (DOM.summaryCustomer) {
      const meta = [order.customer.name, order.customer.phone].filter(Boolean).join(" - ");
      DOM.summaryCustomer.textContent = meta || "Completa tus datos para enviar el pedido.";
    }
    if (DOM.summaryPayment) {
      DOM.summaryPayment.textContent = paymentLabel(order.payment);
    }
    if (DOM.summaryNotes) {
      DOM.summaryNotes.textContent = order.notes || "";
    }
    if (DOM.sendOrderBtn) {
      DOM.sendOrderBtn.disabled = !Store.state.cart.length;
    }
    toggleHidden(DOM.summaryNotesBlock, !order.notes);
  }

  function renderCheckoutView() {
    renderCheckoutItems();
    syncOrderDraftFields();
    renderCheckoutTotals();
  }

  function renderOrderViews() {
    renderMenuCartControls();
    renderOrderCta();
    if (!isOrderMode()) return;
    renderCheckoutView();
    renderSummaryView();
  }

  function setFieldError(fieldElement, hasError) {
    if (!fieldElement) return;
    fieldElement.classList.toggle("has-error", hasError);
    const errorMsg = fieldElement.querySelector(".order-field__error");
    if (errorMsg) {
      errorMsg.classList.toggle("hidden", !hasError);
    }
  }

  function validateOrderBeforeSummary() {
    const { customer, deliveryType } = Store.state.order;
    let isValid = true;

    if (!Store.state.cart.length) {
      alert("Agrega al menos un plato antes de continuar.");
      return false;
    }

    const fieldName = DOM.orderName?.closest(".order-field");
    const fieldPhone = DOM.orderPhone?.closest(".order-field");
    const fieldAddress = DOM.orderAddress?.closest(".order-field");

    const nameValid = Boolean(customer.name.trim());
    setFieldError(fieldName, !nameValid);
    if (!nameValid) isValid = false;

    const phoneValid = Boolean(customer.phone.trim());
    setFieldError(fieldPhone, !phoneValid);
    if (!phoneValid) isValid = false;

    if (deliveryType === "domicilio") {
      const addressValid = Boolean(customer.address.trim());
      setFieldError(fieldAddress, !addressValid);
      if (!addressValid) isValid = false;
    } else {
      setFieldError(fieldAddress, false);
    }

    if (!isValid) {
      const firstError = document.querySelector(".has-error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  }

  function setOrderFlowOpen(open) {
    toggleHidden(DOM.orderFlow, !open);
    document.body.classList.toggle("order-flow-open", open);
  }

  function setOrderScreen(screen, options = {}) {
    if (!isOrderMode()) return;
    const nextScreen =
      screen === "summary" ? "summary" : screen === "checkout" ? "checkout" : "menu";
    const snapshot = getCheckoutSnapshot(options.snapshot);

    if (options.history === "push") {
      pushMenuHistoryState({ ...snapshot, screen: nextScreen, detailId: null });
    } else if (options.history === "replace") {
      replaceMenuHistoryState({ ...snapshot, screen: nextScreen, detailId: null });
    }

    currentOrderScreen = nextScreen;
    setOrderFlowOpen(nextScreen !== "menu");
    toggleHidden(DOM.orderCheckoutScreen, nextScreen !== "checkout");
    toggleHidden(DOM.orderSummaryScreen, nextScreen !== "summary");

    if (nextScreen === "checkout") {
      DOM.orderCheckoutBody?.scrollTo({ top: 0, behavior: "auto" });
    }
    if (nextScreen === "summary") {
      DOM.orderSummaryScreen?.querySelector(".order-screen__body")?.scrollTo({
        top: 0,
        behavior: "auto",
      });
    }
    if (nextScreen === "menu" && options.restore !== false) {
      restoreMenuSnapshot(snapshot);
    }

    renderOrderViews();
  }

  function closeOrderScreen(targetScreen) {
    const state = window.history.state;
    if (
      isMenuHistoryState(state) &&
      state.screen === (currentOrderScreen || "menu") &&
      currentOrderScreen !== "menu"
    ) {
      window.history.back();
      return;
    }
    setOrderScreen(targetScreen || "menu", { history: "replace" });
  }

  function handleOrderSend() {
    if (!validateOrderBeforeSummary()) return;

    Store.saveAsLastOrder();

    const phone = getOrderWhatsAppPhone();
    if (!phone) {
      alert("No hay un numero de WhatsApp configurado para enviar este pedido.");
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      buildOrderMessage()
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      Store.clear();
      initLastOrderFeature();
      setOrderScreen('menu', { history: 'replace' });
    }, 100);
  }

  function updateCartByAction(action, id) {
    const source = Store.getItemById(id);
    if (action === "inc") {
      Store.incById(id, source);
      return;
    }
    if (action === "dec") {
      Store.decById(id, source);
      return;
    }
    if (action === "remove") {
      Store.removeById(id);
    }
  }

  let lastDetail = { id: null, scrollY: 0 };
  let menuHistoryWired = false;

  function normalizeSearchState(search) {
    return {
      isOpen: Boolean(search && search.isOpen),
      query: typeof search?.query === "string" ? search.query : "",
    };
  }

  function buildMenuSnapshot(overrides = {}) {
    return {
      search: normalizeSearchState(
        overrides.search !== undefined ? overrides.search : getSearchState()
      ),
      scrollY:
        typeof overrides.scrollY === "number"
          ? overrides.scrollY
          : getScrollY(),
    };
  }

  function isMenuHistoryState(state) {
    return Boolean(state && state[MENU_HISTORY_KEY]);
  }

  function buildMenuHistoryState(overrides = {}) {
    const snapshot = buildMenuSnapshot(overrides);
    return {
      [MENU_HISTORY_KEY]: true,
      screen:
        overrides.screen === "summary"
          ? "summary"
          : overrides.screen === "checkout"
            ? "checkout"
            : currentOrderScreen || "menu",
      detailId:
        overrides.detailId === null || overrides.detailId === undefined
          ? null
          : String(overrides.detailId),
      search: snapshot.search,
      scrollY: snapshot.scrollY,
    };
  }

  function replaceMenuHistoryState(overrides = {}) {
    window.history.replaceState(
      buildMenuHistoryState(overrides),
      "",
      window.location.href
    );
  }

  function pushMenuHistoryState(overrides = {}) {
    window.history.pushState(
      buildMenuHistoryState(overrides),
      "",
      window.location.href
    );
  }

  function restoreMenuSnapshot(snapshot) {
    const normalized = buildMenuSnapshot(snapshot);
    syncSearchInputs(normalized.search.query || "");
    setSearchUI(normalized.search.isOpen);
    applySearch();
    window.scrollTo({ top: normalized.scrollY, behavior: "auto" });
  }

  function closeDetail(options = {}) {
    const historyMode = options.history || "back";
    const snapshot = buildMenuSnapshot(options.snapshot);

    if (
      historyMode === "back" &&
      isMenuHistoryState(window.history.state) &&
      window.history.state.detailId
    ) {
      window.history.back();
      return;
    }

    if (historyMode === "replace") {
      replaceMenuHistoryState({ ...snapshot, detailId: null });
    }

    toggleDetail(false, snapshot);
  }

  function applyMenuHistoryState(state) {
    if (!isMenuHistoryState(state)) return false;

    const snapshot = buildMenuSnapshot({
      search: state.search,
      scrollY: Number(state.scrollY) || 0,
    });
    const screen = isOrderMode()
      ? state.screen === "summary"
        ? "summary"
        : state.screen === "checkout"
          ? "checkout"
          : "menu"
      : "menu";

    if (screen !== "menu") {
      if (DOM.detailModal && !DOM.detailModal.classList.contains("hidden")) {
        closeDetail({ history: "pop", snapshot });
      }
      setOrderScreen(screen, { history: "pop", snapshot, restore: false });
      return true;
    }

    setOrderScreen("menu", { history: "pop", snapshot });

    if (state.detailId) {
      openDetail(state.detailId, { history: "pop", snapshot });
    } else {
      closeDetail({ history: "pop", snapshot });
    }

    return true;
  }

  function handleMenuPopState(event) {
    if (!isMenuHistoryState(event.state)) return;
    applyMenuHistoryState(event.state);
  }

  function initMenuHistory() {
    if (!menuHistoryWired) {
      window.addEventListener("popstate", handleMenuPopState);
      menuHistoryWired = true;
    }

    const state = window.history.state;
    if (!isMenuHistoryState(state)) {
      replaceMenuHistoryState({ detailId: null });
      return;
    }

    applyMenuHistoryState(state);
  }

  function openDetail(id, options = {}) {
    if (DOM.detailModal && !DOM.detailModal.classList.contains("hidden")) {
      if (lastDetail.id === id) return;
    }
    const it = Store.state.items.find((x) => String(x.id) === String(id));
    if (!it) return;
    const snapshot = buildMenuSnapshot(options.snapshot);
    lastDetail = {
      id,
      search: snapshot.search,
      scrollY: snapshot.scrollY,
    };

    if (options.history === "push") {
      replaceMenuHistoryState({ ...snapshot, detailId: null });
      pushMenuHistoryState({ ...snapshot, detailId: id });
    } else if (options.history === "replace") {
      replaceMenuHistoryState({ ...snapshot, detailId: id });
    }

    if (DOM.detailSkeleton) DOM.detailSkeleton.classList.remove("hidden");

    if (DOM.detailImg) {
      const full = cloudi(it.foto, 960);
      const full2x = cloudi(it.foto, 1400);
      const imgEl = DOM.detailImg;

      const handleImageLoad = () => {
        if (DOM.detailSkeleton) DOM.detailSkeleton.classList.add("hidden");
        imgEl.removeEventListener("load", handleImageLoad);
        imgEl.removeEventListener("error", handleImageError);
      };

      const handleImageError = () => {
        if (DOM.detailSkeleton) DOM.detailSkeleton.classList.add("hidden");
        imgEl.removeEventListener("load", handleImageLoad);
        imgEl.removeEventListener("error", handleImageError);
      };

      imgEl.addEventListener("load", handleImageLoad);
      imgEl.addEventListener("error", handleImageError);
      imgEl.src = full || it.foto || "";
      imgEl.srcset = `${full || it.foto || ""} 1x, ${full2x || full || it.foto || ""} 2x`;
      imgEl.decoding = "async";
      imgEl.loading = "lazy";

      const mediaEl = imgEl.parentElement;
      if (mediaEl) {
        mediaEl.style.backgroundImage = `url(${full || it.foto || ""})`;
      }
    }

    if (DOM.detailName) DOM.detailName.textContent = it.nombre || "";
    if (DOM.detailDesc) DOM.detailDesc.textContent = it.descripcion || "";
    if (DOM.detailPrice) DOM.detailPrice.textContent = Store.fmt(it.precio || 0);

    if (DOM.detailCartControls) {
      if (isOrderMode()) {
        DOM.detailCartControls.innerHTML = cartControlsMarkup(it.id, Store.getCartQty(it.id));
        show(DOM.detailCartControls);
      } else {
        hide(DOM.detailCartControls);
      }
    }

    toggleDetail(true);
  }

  function toggleDetail(open, snapshot) {
    if (open) {
      document.body.style.top = `-${lastDetail.scrollY || 0}px`;
    }
    if (DOM.detailModal) DOM.detailModal.classList.toggle("hidden", !open);
    document.body.classList.toggle("detail-open", open);
    if (!open) {
      document.body.style.top = "";
      restoreMenuSnapshot(snapshot || lastDetail);
      lastDetail = { id: null, search: null, scrollY: 0 };
    }
  }

  function openOverlay(id) {
    const el = document.getElementById(id.replace("#", ""));
    if (el) show(el);
  }

  function closeOverlay(id) {
    const el = document.getElementById(id.replace("#", ""));
    if (el) hide(el);
  }

  function initLastOrderFeature() {
    const lastOrder = Store.getLastOrder();
    if (!lastOrder || lastOrder.length === 0) {
      hide(DOM.lastOrderBtn);
      return;
    }

    show(DOM.lastOrderBtn);

    const total = lastOrder.reduce((t, item) => t + (item.precio * item.qty), 0);
    if (DOM.lastOrderTotal) {
      DOM.lastOrderTotal.textContent = formatMoney(total);
    }

    if (DOM.lastOrderItems) {
      DOM.lastOrderItems.innerHTML = lastOrder.map(item => {
        const resolved = resolveCartItem(item);
        const img = cloudi(resolved.foto, 100) || resolved.foto || "";
        return `
          <div class="last-order-item">
            <div class="last-order-item__thumb">
              ${img ? `<img src="${img}" alt="${resolved.nombre}">` : ''}
            </div>
            <div class="last-order-item__name">${resolved.qty}x ${resolved.nombre}</div>
            <div class="last-order-item__price">${formatMoney(resolved.precio * resolved.qty)}</div>
          </div>
        `;
      }).join('');
    }
  }

  let scrollSpyFrame = 0;
  let scrollSpyToken = 0;
  let syncActiveSection = () => {};

  function getMostProminentSection(sections) {
    if (!sections.length) return null;
    const scrollY = getScrollY();
    const maxScrollY = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    if (scrollY <= 8) return sections[0];
    if (maxScrollY - scrollY <= 8) return sections[sections.length - 1];

    const off = calcOffset();
    const viewportTop = off + 8;
    const viewportBottom = window.innerHeight;
    const focusBandHeight = Math.max(
      180,
      Math.min(viewportBottom - viewportTop, (viewportBottom - viewportTop) * 0.45)
    );
    const focusTop = viewportTop;
    const focusBottom = Math.min(viewportBottom, focusTop + focusBandHeight);
    const focusCenter = (focusTop + focusBottom) / 2;
    let current = sections[0];
    let bestScore = Number.NEGATIVE_INFINITY;
    let fallback = sections[0];
    let fallbackDistance = Number.POSITIVE_INFINITY;

    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      const titleRect =
        sec.querySelector(".menu__section-title")?.getBoundingClientRect() || rect;
      const visibleTop = Math.max(rect.top, focusTop);
      const visibleBottom = Math.min(rect.bottom, focusBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const distanceToCenter = Math.abs(titleRect.top - focusCenter);

      if (distanceToCenter < fallbackDistance) {
        fallbackDistance = distanceToCenter;
        fallback = sec;
      }

      if (visibleHeight <= 0) return;

      const score = visibleHeight * 1000 - distanceToCenter * 8;
      if (score > bestScore) {
        bestScore = score;
        current = sec;
      }
    });

    return bestScore === Number.NEGATIVE_INFINITY ? fallback : current;
  }

  function mountScrollSpy(cats) {
    const sections = cats.map((c) => document.querySelector(`#sec-${slug(c)}`)).filter(Boolean);
    if (!sections.length) return;

    syncActiveSection = () => {
      const current = getMostProminentSection(sections);
      if (current) setActiveBySectionId(current.id, "auto");
    };

    const updateActiveFromScroll = () => {
      if (programmaticNav) return;
      if (scrollSpyFrame) return;
      const token = scrollSpyToken;
      scrollSpyFrame = requestAnimationFrame(() => {
        scrollSpyFrame = 0;
        if (programmaticNav || token !== scrollSpyToken) return;
        syncActiveSection();
      });
    };

    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", () => {
      calcOffset();
      updateActiveFromScroll();
      const active = DOM.catTabs?.querySelector(".is-active");
      if (active) ensureTabVisible(active, "auto");
    }, { passive: true });

    syncActiveSection();
  }

  const slug = (s) =>
    String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  function ensureTabVisible(btn, behavior = "smooth") {
    const wrap = DOM.catTabs;
    if (!wrap || !btn) return;
    const targetLeft = btn.offsetLeft - (wrap.clientWidth - btn.clientWidth) / 2;
    const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    const left = Math.max(0, Math.min(targetLeft, max));
    wrap.scrollTo({ left, behavior });
  }

  let programmaticNav = false;
  let programmaticNavFrame = 0;
  let programmaticNavTargetY = 0;
  let programmaticNavLastY = 0;
  let programmaticNavStableFrames = 0;
  let programmaticNavStartedAt = 0;
  let categoryScrollFrame = 0;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function stopCategoryScrollAnimation() {
    if (!categoryScrollFrame) return;
    cancelAnimationFrame(categoryScrollFrame);
    categoryScrollFrame = 0;
  }

  function animateWindowScrollTo(targetY, duration = 220) {
    stopCategoryScrollAnimation();

    const startY = getScrollY();
    const distance = targetY - startY;
    if (Math.abs(distance) <= 2) {
      window.scrollTo({ top: targetY, behavior: "auto" });
      return;
    }

    const startAt = performance.now();
    const step = (now) => {
      const elapsed = now - startAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      window.scrollTo({
        top: Math.round(startY + distance * eased),
        behavior: "auto",
      });

      if (progress >= 1) {
        categoryScrollFrame = 0;
        window.scrollTo({ top: targetY, behavior: "auto" });
        return;
      }

      categoryScrollFrame = requestAnimationFrame(step);
    };

    categoryScrollFrame = requestAnimationFrame(step);
  }

  function unlockProgrammaticNav() {
    if (programmaticNavFrame) cancelAnimationFrame(programmaticNavFrame);
    programmaticNav = false;
    programmaticNavFrame = 0;
    programmaticNavTargetY = 0;
    programmaticNavLastY = 0;
    programmaticNavStableFrames = 0;
    programmaticNavStartedAt = 0;
    DOM.actionBar?.classList.remove("is-scrolling");
    syncActiveSection();
  }

  function watchProgrammaticNav() {
    if (!programmaticNav) return;

    const currentY = getScrollY();
    const deltaToTarget = Math.abs(currentY - programmaticNavTargetY);
    const deltaToLast = Math.abs(currentY - programmaticNavLastY);
    const elapsed = performance.now() - programmaticNavStartedAt;

    if (deltaToTarget <= 2) {
      unlockProgrammaticNav();
      return;
    }

    if (deltaToLast <= 1) {
      programmaticNavStableFrames += 1;
    } else {
      programmaticNavStableFrames = 0;
    }

    if (programmaticNavStableFrames >= 6 || elapsed >= 1800) {
      unlockProgrammaticNav();
      return;
    }

    programmaticNavLastY = currentY;
    programmaticNavFrame = requestAnimationFrame(watchProgrammaticNav);
  }

  function lockProgrammaticNav(targetY, behavior) {
    if (scrollSpyFrame) {
      cancelAnimationFrame(scrollSpyFrame);
      scrollSpyFrame = 0;
    }
    scrollSpyToken += 1;

    programmaticNav = true;
    programmaticNavTargetY = targetY;
    programmaticNavLastY = getScrollY();
    programmaticNavStableFrames = 0;
    programmaticNavStartedAt = performance.now();

    if (programmaticNavFrame) cancelAnimationFrame(programmaticNavFrame);

    if (behavior !== "smooth") {
      setTimeout(unlockProgrammaticNav, 50);
      return;
    }

    programmaticNavFrame = requestAnimationFrame(watchProgrammaticNav);
  }

  function setActiveBySectionId(id, behavior = "smooth") {
    const btn = DOM.catTabs?.querySelector(`button[data-target="#${id}"]`);
    if (!btn) return;
    const active = DOM.catTabs?.querySelector(".is-active");
    if (active === btn) {
      const label = id.replace("sec-", "");
      const pretty = label.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      if (DOM.currentCat) DOM.currentCat.textContent = pretty;
      return;
    }
    DOM.catTabs?.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    ensureTabVisible(btn, behavior);
    const label = id.replace("sec-", "");
    const pretty = label.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    if (DOM.currentCat) DOM.currentCat.textContent = pretty;
  }

  function goToCategory(selector, behavior = "smooth") {
    const el = document.querySelector(selector);
    if (!el) return;
    const off = calcOffset();
    const y = el.getBoundingClientRect().top + window.pageYOffset - off - 8;

    DOM.actionBar?.classList.add("is-scrolling");
    lockProgrammaticNav(y, behavior);
    if (behavior === "smooth") {
      animateWindowScrollTo(y);
    } else {
      stopCategoryScrollAnimation();
      window.scrollTo({ top: y, behavior: "auto" });
    }
    setActiveBySectionId(el.id, "auto");
  }

  function wireEvents() {
    DOM.openCatMenu?.addEventListener("click", () => openOverlay("#catMenuOverlay"));

    document.querySelectorAll('[data-close-overlay]').forEach((e) => {
      const targetId = e.getAttribute('data-close-overlay');
      const container = e.closest('.overlay__container');

      if (container) {
        const closeIfSelf = (ev) => { if (ev.target === e) closeOverlay(`#${targetId}`); };
        e.addEventListener("click", closeIfSelf);
        e.addEventListener("touchend", (ev) => {
          if (ev.target === e) { ev.preventDefault(); closeOverlay(`#${targetId}`); }
        }, { passive: false });
      } else {
        addPress(e, () => closeOverlay(`#${targetId}`));
      }
    });

    addPress(DOM.lastOrderBtn, () => {
      initLastOrderFeature();
      openOverlay("#lastOrderModal");
    });

    addPress(DOM.repeatOrderBtn, () => {
      Store.addLastOrderToCart();
      closeOverlay("#lastOrderModal");
      setOrderScreen('checkout', { history: 'push' });
    });

    addPress(DOM.openSearch, openSearchPanel);
    const debouncedSearch = debounce(applySearch, 400);
    withCompositionGuard(DOM.searchUnified, debouncedSearch);
    addPress(DOM.clearSearch, () => closeSearchPanel(true));

    if (isOrderMode()) {
      addPress(DOM.viewOrderCta, () => {
        if (DOM.detailModal && !DOM.detailModal.classList.contains("hidden")) {
          closeDetail({ history: "replace" });
        }
        setOrderScreen("checkout", { history: "push" });
      });
      addPress(DOM.orderBackBtn, () => closeOrderScreen("menu"));
      addPress(DOM.summaryBackBtn, () => closeOrderScreen("checkout"));
      addPress(DOM.orderReviewBtn, () => {
        if (!validateOrderBeforeSummary()) return;
        setOrderScreen("summary", { history: "push" });
        addPress(DOM.sendOrderBtn, handleOrderSend);
      });
      addPress(DOM.customTipBtn, () => {
        customTipOpen = true;
        if (ORDER_PRESET_TIPS.includes(Number(Store.state.order.tip || 0))) {
          Store.setTip(0);
        } else {
          renderOrderViews();
        }
        DOM.customTipInput?.focus();
      });

      DOM.orderNotes?.addEventListener("input", () => {
        Store.setNotes(DOM.orderNotes.value);
      });
      DOM.orderName?.addEventListener("input", () => {
        Store.setCustomerField("name", DOM.orderName.value);
        if (DOM.orderName.value.trim()) {
          setFieldError(DOM.orderName.closest(".order-field"), false);
        }
      });
      DOM.orderPhone?.addEventListener("input", () => {
        Store.setCustomerField("phone", DOM.orderPhone.value);
        if (DOM.orderPhone.value.trim()) {
          setFieldError(DOM.orderPhone.closest(".order-field"), false);
        }
      });
      DOM.orderAddress?.addEventListener("input", () => {
        Store.setCustomerField("address", DOM.orderAddress.value);
        if (DOM.orderAddress.value.trim()) {
          setFieldError(DOM.orderAddress.closest(".order-field"), false);
        }
      });
      DOM.orderReference?.addEventListener("input", () => {
        Store.setCustomerField("reference", DOM.orderReference.value);
      });
      DOM.customTipInput?.addEventListener("input", () => {
        customTipOpen = true;
        Store.setTip(Math.max(0, Number(DOM.customTipInput.value) || 0));
      });

      Store.Events.on("cart:updated", () => {
        if (!Store.state.cart.length) {
          setOrderScreen("menu", { history: "replace" });
          return;
        }
        renderOrderViews();
      });
      Store.Events.on("order:updated", renderOrderViews);
    }

    document.addEventListener("click", (ev) => {
      const cartAction = ev.target.closest("[data-cart-action], [data-order-action]");
      if (cartAction) {
        updateCartByAction(
          cartAction.getAttribute("data-cart-action") ||
            cartAction.getAttribute("data-order-action"),
          cartAction.getAttribute("data-item-id")
        );
        return;
      }

      const deliveryBtn = ev.target.closest("[data-delivery]");
      if (deliveryBtn) {
        Store.setDeliveryType(deliveryBtn.getAttribute("data-delivery"));
        return;
      }

      if (isOrderMode()) {
        const paymentBtn = ev.target.closest("[data-payment]");
        if (paymentBtn) {
          Store.setPayment(paymentBtn.getAttribute("data-payment"));
          return;
        }

        const tipBtn = ev.target.closest("[data-tip]");
        if (tipBtn) {
          customTipOpen = false;
          Store.setTip(Number(tipBtn.getAttribute("data-tip")) || 0);
          return;
        }
      }

      if (document.body.classList.contains("detail-open")) return;
      if (ev.target.closest("#detailModal")) return;
      const panelOpen = DOM.searchPanel && !DOM.searchPanel.classList.contains("hidden");
      if (!panelOpen) return;
      const inPanel = ev.target.closest("#searchPanel");
      const isTrigger = ev.target.closest("#openSearch");
      const isResult = ev.target.closest("[data-detail]") || ev.target.closest(".menu-item");
      if (!inPanel && !isTrigger && !isResult) closeSearchPanel(true);
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (!DOM.lastOrderModal.classList.contains("hidden")) {
          closeOverlay("#lastOrderModal");
        } else {
          closeSearchPanel(true);
        }
      }
    });

    addPress(DOM.closeDetail, (ev) => {
      ev.stopPropagation();
      closeDetail();
    });
    addPress(document.querySelector('#detailModal [data-close="modal"]'), (ev) => {
      ev.stopPropagation();
      closeDetail();
    });

    document.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-cart-action]")) return;
      if (ev.target.closest("[data-order-action]")) return;
      const b = ev.target.closest("[data-detail]");
      if (!b) return;
      openDetail(b.getAttribute("data-detail"), { history: "push" });
    }, { passive: true });

    initMenuHistory();
    renderOrderViews();
  }

  return {
    initDOM,
    groupByCategory,
    buildTabs,
    buildCatMenus,
    buildSections,
    mountScrollSpy,
    wireEvents,
    applySearch,
    calcOffset,
    initLastOrderFeature,
  };
})();
