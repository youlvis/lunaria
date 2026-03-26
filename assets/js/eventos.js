;(() => {
  "use strict";

  /* ═══════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════ */

  const API_URL =
    typeof EVENTOS_ENDPOINT !== "undefined"
      ? EVENTOS_ENDPOINT
      : "https://script.google.com/macros/s/AKfycby-xUvAYVhUP3ny5nFFSRGHAZDmQy3OBa3fSizcncM4XwPe6qDbQJ2Omvu6gjSrgGsW/exec";

  const MIN_PERSONAS = 10;
  const STEP = Object.freeze({
    WELCOME: 1,
    PERSONAS: 2,
    CATEGORIAS: 3,
    CONFIG: 4,
    RESUMEN: 5,
    ENVIO: 6,
  });
  const STEP_LABELS = [
    "",
    "",
    "Paso 1 de 5",
    "Paso 2 de 5",
    "Paso 3 de 5",
    "Paso 4 de 5",
    "Paso 5 de 5",
  ];

  /* ═══════════════════════════════════════
     UTILS
     ═══════════════════════════════════════ */

  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const cloudi = (url, w = 400) => {
    if (!url || typeof url !== "string") return url;
    if (!url.includes("res.cloudinary.com")) return url;
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;
    return `${parts[0]}/upload/c_fill,f_auto,q_auto,w_${w}/${parts[1]}`;
  };

  const hasImg = (item) =>
    Boolean(item && item.imagen && String(item.imagen).trim());

  const fmtCurrency = (v) =>
    new Intl.NumberFormat("es-CO").format(Number(v) || 0);

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.textContent = html;
    return e;
  };

  /* ═══════════════════════════════════════
     STORE
     ═══════════════════════════════════════ */

  const store = {
    data: null,
    step: STEP.WELCOME,
    personas: MIN_PERSONAS,
    fechaEvento: "",
    categoriaId: null,
    selecciones: {},
    opciones: {},
    loading: true,
    error: null,
  };

  function getCategoria() {
    if (!store.data || !store.categoriaId) return null;
    const cats = store.data.categorias || [];
    return cats.find((c) => String(c.id) === String(store.categoriaId)) || null;
  }

  function isPersonalizado(cat) {
    if (!cat) return false;
    if (cat.tipo_flujo === "whatsapp") return true;
    if (cat.tipo === "personalizado") return true;
    if (!cat.secciones || cat.secciones.length === 0) return true;
    return false;
  }

  function resetSelecciones() {
    store.selecciones = {};
    store.opciones = {};
  }

  function getCounterTotal(secId) {
    const sel = store.selecciones[secId];
    if (!sel || typeof sel !== "object") return 0;
    return Object.values(sel).reduce((s, v) => s + (Number(v) || 0), 0);
  }

  function getCounterQty(secId, itemId) {
    const sel = store.selecciones[secId];
    if (!sel || typeof sel !== "object") return 0;
    return Number(sel[itemId]) || 0;
  }

  function setCounterQty(secId, itemId, qty) {
    if (!store.selecciones[secId] || typeof store.selecciones[secId] !== "object") {
      store.selecciones[secId] = {};
    }
    const val = Math.max(0, Number(qty) || 0);
    if (val === 0) {
      delete store.selecciones[secId][itemId];
      delete store.opciones[itemId];
    } else {
      store.selecciones[secId][itemId] = val;
    }
  }

  function getRadioSelection(secId) {
    return store.selecciones[secId] || null;
  }

  function setRadioSelection(secId, itemId) {
    store.selecciones[secId] = itemId;
  }

  function getOpcion(itemId, opKey) {
    return store.opciones[itemId] && store.opciones[itemId][opKey];
  }

  function setOpcion(itemId, opKey, value) {
    if (!store.opciones[itemId]) store.opciones[itemId] = {};
    store.opciones[itemId][opKey] = value;
  }

  function getWAPhone() {
    if (typeof EVENTOS_WA_PHONE !== "undefined" && EVENTOS_WA_PHONE)
      return EVENTOS_WA_PHONE;
    if (store.data && store.data.config && store.data.config.whatsapp)
      return store.data.config.whatsapp;
    return "";
  }

  /* ═══════════════════════════════════════
     API
     ═══════════════════════════════════════ */

  let dataPromise = null;

  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = fetch(API_URL)
      .then((r) => {
        if (!r.ok) throw new Error("Error de red");
        return r.json();
      })
      .then((raw) => {
        store.data = normalizeData(raw);
        store.loading = false;
        return store.data;
      })
      .catch((err) => {
        store.error = err;
        store.loading = false;
        throw err;
      });
    return dataPromise;
  }

  function normalizeData(raw) {
    if (!raw) return { categorias: [] };

    let cats = [];
    if (raw.categorias && Array.isArray(raw.categorias)) {
      cats = raw.categorias;
    } else if (Array.isArray(raw)) {
      cats = raw;
    } else {
      return { categorias: [], config: raw.config || {} };
    }

    // Transform each category: platos + extras → secciones
    cats = cats.map((cat) => {
      // If already has secciones, pass through
      if (cat.secciones && Array.isArray(cat.secciones) && cat.secciones.length)
        return cat;

      const secciones = [];
      const platos = cat.platos || [];

      // Group platos by "tipo" field (e.g. "principal", "especial")
      if (platos.length) {
        const groups = new Map();
        platos.forEach((p) => {
          const tipo = p.tipo || "principal";
          if (!groups.has(tipo)) groups.set(tipo, []);
          groups.get(tipo).push(p);
        });

        groups.forEach((items, tipo) => {
          const minVal = items.reduce((m, i) => Math.max(m, Number(i.min) || 0), 0);
          secciones.push({
            id: `${cat.id}_${tipo}`,
            nombre: `Platos ${tipo}`,
            tipo: "contador",
            minimo: minVal,
            items: items.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              descripcion: p.descripcion || "",
              imagen: p.imagen || null,
              precio: p.precio || 0,
              opciones: normalizeOpciones(p),
              componentes: normalizeComponentes(p),
            })),
          });
        });
      }

      // extras → additional sections (bebida, barra, etc.)
      const extras = cat.extras || {};
      Object.entries(extras).forEach(([key, group]) => {
        if (!group || !group.items || !group.items.length) return;
        const maxSel = Number(group.seleccion_max) || 1;
        const allHaveImg = group.items.filter(hasImg).length > group.items.length / 2;

        secciones.push({
          id: `${cat.id}_${key}`,
          nombre: key.charAt(0).toUpperCase() + key.slice(1),
          tipo: allHaveImg ? "radio-card" : "radio",
          minimo: 1,
          items: group.items.map((it) => ({
            id: it.id,
            nombre: it.nombre,
            descripcion: it.descripcion || "",
            imagen: it.imagen || null,
            precio: it.precio || 0,
          })),
        });
      });

      return { ...cat, secciones };
    });

    return { categorias: cats, config: raw.config || {} };
  }

  /** Transform API opciones {salsa: [...], proteina: [...]} → [{id, nombre, items}] */
  function normalizeOpciones(plato) {
    if (!plato.requiere_opciones) return null;
    const raw = plato.opciones;
    if (!raw || typeof raw !== "object") return null;

    // Already normalized array format
    if (Array.isArray(raw)) return raw.length ? raw : null;

    // Object format: {salsa: [...], proteina: [...]}
    const groups = [];
    Object.entries(raw).forEach(([key, items]) => {
      if (!Array.isArray(items) || !items.length) return;
      groups.push({
        id: key,
        nombre: key.charAt(0).toUpperCase() + key.slice(1),
        items: items.map((op) => ({
          id: op.id,
          nombre: op.nombre,
        })),
      });
    });

    return groups.length ? groups : null;
  }

  /** Normalize componentes array (each component has its own opciones) */
  function normalizeComponentes(plato) {
    const raw = plato.componentes;
    if (!Array.isArray(raw) || !raw.length) return null;
    return raw.map((comp) => {
      const opciones = [];
      const rawOp = comp.opciones;
      if (rawOp && typeof rawOp === "object" && !Array.isArray(rawOp)) {
        Object.entries(rawOp).forEach(([key, items]) => {
          if (!Array.isArray(items) || !items.length) return;
          opciones.push({
            id: key,
            nombre: key.charAt(0).toUpperCase() + key.slice(1),
            items: items.map((op) => ({ id: op.id, nombre: op.nombre })),
          });
        });
      } else if (Array.isArray(rawOp)) {
        opciones.push(...rawOp);
      }
      return {
        id: comp.id,
        nombre: comp.nombre,
        opciones: opciones.length ? opciones : null,
      };
    });
  }

  /* ═══════════════════════════════════════
     DOM REFS
     ═══════════════════════════════════════ */

  const refs = {
    content: () => $("#evContent"),
    progress: () => $("#evProgress"),
    fill: () => $("#evProgressFill"),
    back: () => $("#evBack"),
    label: () => $("#evStepLabel"),
    preloader: () => $("#evPreloader"),
  };

  /* ═══════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════ */

  function goTo(step) {
    store.step = step;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (store.step <= STEP.WELCOME) return;
    const cat = getCategoria();
    // Personalizado: from envio go back to categorias (skip config+resumen)
    if (store.step === STEP.ENVIO && cat && isPersonalizado(cat)) {
      goTo(STEP.CATEGORIAS);
      return;
    }
    goTo(store.step - 1);
  }

  function updateProgress() {
    const progress = refs.progress();
    const fill = refs.fill();
    const back = refs.back();
    const label = refs.label();

    if (store.step === STEP.WELCOME) {
      if (progress) progress.classList.add("ev-hidden");
    } else {
      if (progress) progress.classList.remove("ev-hidden");
      if (fill) {
        const pct = Math.round(((store.step - 1) / 5) * 100);
        fill.style.width = pct + "%";
      }
    }

    if (back)
      back.classList.toggle("ev-hidden", store.step <= STEP.WELCOME);
    if (label) label.textContent = STEP_LABELS[store.step] || "";
  }

  /* ═══════════════════════════════════════
     RENDER ENGINE
     ═══════════════════════════════════════ */

  function render() {
    const container = refs.content();
    if (!container) return;
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "ev-step ev-fade-in";

    switch (store.step) {
      case STEP.WELCOME:
        renderWelcome(wrapper);
        break;
      case STEP.PERSONAS:
        renderPersonas(wrapper);
        break;
      case STEP.CATEGORIAS:
        renderCategorias(wrapper);
        break;
      case STEP.CONFIG:
        renderConfigurador(wrapper);
        break;
      case STEP.RESUMEN:
        renderResumen(wrapper);
        break;
      case STEP.ENVIO:
        renderEnvio(wrapper);
        break;
    }

    container.appendChild(wrapper);
    updateProgress();
  }

  /* ═══════════════════════════════════════
     STEP 1: WELCOME
     ═══════════════════════════════════════ */

  function renderWelcome(container) {
    const heroUrl =
      (store.data &&
        store.data.config &&
        store.data.config.heroImage) ||
      "https://res.cloudinary.com/dh2byewas/image/upload/c_fill,f_auto,q_auto,w_800/IMG_6007_otxh3l.jpg";

    const div = el("div", "ev-welcome");
    div.innerHTML = `
      <div class="ev-welcome__hero">
        <img src="${esc(cloudi(heroUrl, 800))}" alt="Eventos Lunaria"
             class="ev-welcome__img" loading="eager" />
        <div class="ev-welcome__gradient"></div>
        <span class="ev-welcome__badge">Eventos</span>
      </div>
      <div class="ev-welcome__content">
        <h1 class="ev-welcome__title">Organiza tu evento con nosotros</h1>
        <p class="ev-welcome__desc">Diseña tu menú y recibe una cotización personalizada.</p>
        <button class="ev-btn ev-btn--primary ev-btn--lg" id="evStartBtn">
          Empezar cotización
        </button>
      </div>
    `;
    container.appendChild(div);

    // Wait for paint then bind
    requestAnimationFrame(() => {
      const btn = $("#evStartBtn");
      if (!btn) return;
      btn.addEventListener("click", async () => {
        if (store.data) {
          goTo(STEP.PERSONAS);
          return;
        }
        // Still loading — show inline loader
        btn.textContent = "Cargando…";
        btn.disabled = true;
        try {
          await loadData();
          if (
            !store.data ||
            !store.data.categorias ||
            !store.data.categorias.length
          ) {
            showError(
              container,
              "No hay datos disponibles. Intenta nuevamente."
            );
            return;
          }
          goTo(STEP.PERSONAS);
        } catch {
          btn.textContent = "Reintentar";
          btn.disabled = false;
        }
      });
    });
  }

  /* ═══════════════════════════════════════
     STEP 2: PERSONAS
     ═══════════════════════════════════════ */

  function renderPersonas(container) {
    const header = el("div", "ev-step__header");
    header.innerHTML = `
      <h2 class="ev-step__title">Detalles de tu evento</h2>
      <p class="ev-step__subtitle">El mínimo para eventos es ${MIN_PERSONAS} personas</p>
    `;
    container.appendChild(header);

    // Date picker
    const dateSection = el("div", "ev-date-section");
    const dateLabel = el("label", "ev-date-section__label", "Fecha del evento");
    dateLabel.setAttribute("for", "evFechaEvento");
    const dateInput = document.createElement("input");
    dateInput.type = "text"; // para mostrar placeholder en iOS; se cambia a date al enfocar
    dateInput.id = "evFechaEvento";
    dateInput.className = "ev-date-section__input";
    dateInput.setAttribute("aria-label", "Fecha del evento");
    dateInput.placeholder = "dd/mm/aaaa";
    dateInput.inputMode = "numeric";
    // Min date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split("T")[0];
    if (store.fechaEvento) dateInput.value = store.fechaEvento;
    // Cambiar a date al enfocar para usar el picker nativo
    dateInput.addEventListener("focus", () => {
      dateInput.type = "date";
      if (dateInput.showPicker) dateInput.showPicker();
    });
    dateInput.addEventListener("blur", () => {
      if (!dateInput.value) dateInput.type = "text";
    });
    const dateHint = el("p", "ev-date-section__hint", "Sujeta a disponibilidad");
    dateSection.append(dateLabel, dateInput, dateHint);
    container.appendChild(dateSection);

    dateInput.addEventListener("change", () => {
      store.fechaEvento = dateInput.value;
    });

    // Personas label
    const personasLabel = el("div", "ev-step__header");
    personasLabel.innerHTML = `<h3 class="ev-step__title" style="font-size:1.125rem">¿Cuántas personas?</h3>`;
    container.appendChild(personasLabel);

    // Stepper
    const stepper = el("div", "ev-stepper");
    const btnDec = el("button", "ev-stepper__btn", "−");
    btnDec.setAttribute("aria-label", "Disminuir");
    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.className = "ev-stepper__input";
    valueInput.inputMode = "numeric";
    valueInput.min = "1";
    valueInput.value = String(store.personas);
    valueInput.setAttribute("aria-label", "Número de personas");
    const btnInc = el("button", "ev-stepper__btn", "+");
    btnInc.setAttribute("aria-label", "Aumentar");
    stepper.append(btnDec, valueInput, btnInc);
    container.appendChild(stepper);

    // Error message
    const errorMsg = el("p", "ev-step__error ev-hidden");
    errorMsg.textContent = `El mínimo es ${MIN_PERSONAS} personas`;
    container.appendChild(errorMsg);

    // Continue button
    const actions = el("div", "ev-actions");
    const btnNext = el("button", "ev-btn ev-btn--primary ev-btn--block");
    btnNext.textContent = "Continuar";
    actions.appendChild(btnNext);
    container.appendChild(actions);

    const updateDisplay = () => {
      valueInput.value = String(store.personas);
      const isValid = store.personas >= MIN_PERSONAS;
      valueInput.classList.toggle("ev-stepper__input--invalid", !isValid);
      errorMsg.classList.toggle("ev-hidden", isValid);
    };

    const decOne = () => {
      store.personas = Math.max(1, store.personas - 1);
      updateDisplay();
    };
    const incOne = () => {
      store.personas += 1;
      updateDisplay();
    };

    btnDec.addEventListener("click", decOne);
    btnInc.addEventListener("click", incOne);

    valueInput.addEventListener("input", () => {
      const raw = valueInput.value.replace(/\D/g, "");
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) {
        store.personas = num;
      } else if (raw === "") {
        store.personas = 0;
      }
      const isValid = store.personas >= MIN_PERSONAS;
      valueInput.classList.toggle("ev-stepper__input--invalid", !isValid);
      errorMsg.classList.toggle("ev-hidden", isValid);
    });

    valueInput.addEventListener("blur", () => {
      if (store.personas < 1) store.personas = 1;
      updateDisplay();
    });

    valueInput.addEventListener("focus", () => valueInput.select());
    valueInput.addEventListener("click", () => valueInput.select());

    btnNext.addEventListener("click", () => {
      if (store.personas >= MIN_PERSONAS) {
        goTo(STEP.CATEGORIAS);
      } else {
        errorMsg.classList.remove("ev-hidden");
      }
    });
  }

  /* ═══════════════════════════════════════
     STEP 3: CATEGORIAS
     ═══════════════════════════════════════ */

  function renderCategorias(container) {
    const cats = (store.data && store.data.categorias) || [];

    const header = el("div", "ev-step__header");
    header.innerHTML = `
      <h2 class="ev-step__title">Elige tu tipo de menú</h2>
      <p class="ev-step__subtitle">Selecciona una categoría para tu evento</p>
    `;
    container.appendChild(header);

    const grid = el("div", "ev-cards");

    cats.forEach((cat) => {
      const card = el("div", "ev-card");
      if (store.categoriaId === String(cat.id))
        card.classList.add("ev-card--active");

      let imgHTML = "";
      if (hasImg(cat)) {
        imgHTML = `
          <div class="ev-card__img-wrap">
            <img src="${esc(cloudi(cat.imagen, 480))}" alt="${esc(cat.nombre)}"
                 class="ev-card__img" loading="lazy" />
          </div>`;
      }

      card.innerHTML = `
        ${imgHTML}
        <div class="ev-card__body">
          <h3 class="ev-card__name">${esc(cat.nombre)}</h3>
          ${cat.descripcion ? `<p class="ev-card__desc">${esc(cat.descripcion)}</p>` : ""}
        </div>
        <div class="ev-card__check">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      `;

      card.addEventListener("click", () => {
        const newId = String(cat.id);
        if (store.categoriaId !== newId) {
          store.categoriaId = newId;
          resetSelecciones();
        }
        // Update UI
        grid.querySelectorAll(".ev-card").forEach((c) =>
          c.classList.remove("ev-card--active")
        );
        card.classList.add("ev-card--active");
        btnNext.disabled = false;
      });

      grid.appendChild(card);
    });

    container.appendChild(grid);

    // Continue
    const actions = el("div", "ev-actions ev-actions--sticky");
    const btnNext = el("button", "ev-btn ev-btn--primary ev-btn--block");
    btnNext.textContent = "Continuar";
    btnNext.disabled = !store.categoriaId;
    btnNext.addEventListener("click", () => {
      if (!store.categoriaId) return;
      goTo(STEP.CONFIG);
    });
    actions.appendChild(btnNext);
    container.appendChild(actions);
  }

  /* ═══════════════════════════════════════
     STEP 4: CONFIGURADOR
     ═══════════════════════════════════════ */

  function renderConfigurador(container) {
    const cat = getCategoria();
    if (!cat) {
      goTo(STEP.CATEGORIAS);
      return;
    }

    // Personalizado → special screen
    if (isPersonalizado(cat)) {
      renderPersonalizado(container, cat);
      return;
    }

    const header = el("div", "ev-step__header");
    header.innerHTML = `
      <h2 class="ev-step__title">${esc(cat.nombre)}</h2>
      <p class="ev-step__subtitle">Configura tu menú para ${store.personas} personas</p>
    `;
    container.appendChild(header);

    const sections = el("div", "ev-sections");
    const secciones = cat.secciones || [];

    secciones.forEach((sec) => {
      renderSeccion(sec, sections);
    });

    container.appendChild(sections);

    // Validation errors
    const errorContainer = el("div", "ev-step__error ev-hidden");
    errorContainer.id = "evConfigErrors";
    container.appendChild(errorContainer);

    // Continue
    const actions = el("div", "ev-actions ev-actions--sticky");
    const btnNext = el("button", "ev-btn ev-btn--primary ev-btn--block");
    btnNext.textContent = "Ver resumen";
    btnNext.addEventListener("click", () => {
      const result = validateConfigurador(cat);
      clearSectionErrors(container);
      if (result.valid) {
        goTo(STEP.RESUMEN);
      } else {
        // Inline per-section errors (à la Rappi)
        showSectionErrors(container, result.sectionErrors);
        // Force coverage/status bars to show warning state after intentar avanzar
        secciones.forEach((sec) => {
          const bar = container.querySelector(`[data-sec-total-id="${sec.id}"]`);
          if (bar) updateTotalBar(bar, sec, true);
        });
        // Optional legacy container as fallback (kept hidden unless needed)
        errorContainer.textContent = "";
        errorContainer.classList.add("ev-hidden");
        // Scroll to first error badge/message
        const firstErr =
          container.querySelector(".ev-inline-error") ||
          container.querySelector(".ev-section__min--error") ||
          container.querySelector(".ev-counter-total--warn");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    actions.appendChild(btnNext);
    container.appendChild(actions);
  }

  function renderPersonalizado(container, cat) {
    const div = el("div", "ev-custom");

    const imgUrl = hasImg(cat)
      ? cat.imagen
      : "https://res.cloudinary.com/dh2byewas/image/upload/c_fill,f_auto,q_auto,w_800/IMG_6007_otxh3l.jpg";

    div.innerHTML = `
      <div class="ev-custom__img-wrap">
        <img src="${esc(cloudi(imgUrl, 800))}" alt="Evento personalizado"
             class="ev-custom__img" loading="lazy" />
      </div>
      <h2 class="ev-step__title">${esc(cat.nombre)}</h2>
      <p class="ev-custom__text">
        Cuéntanos cómo quieres tu evento y diseñamos el menú contigo.
      </p>
    `;

    const btnWA = el("button", "ev-btn ev-btn--wa ev-btn--lg");
    btnWA.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.609l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.585l-.386-.236-2.642.886.886-2.642-.236-.386A9.94 9.94 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
      Cotizar por WhatsApp
    `;
    btnWA.addEventListener("click", () => {
      const msg = `Hola, quiero cotizar un evento personalizado para ${store.personas} personas.\n\nMe gustaría diseñar un menú a medida.`;
      openWhatsApp(msg);
    });

    div.appendChild(btnWA);
    container.appendChild(div);
  }

  /* ── Section renderer (dispatch by tipo) ── */

  function renderSeccion(sec, parent) {
    const section = el("div", "ev-section");
    section.dataset.secId = sec.id;
    section.dataset.touched = "false";
    section.dataset.hasErrors = "false";

    const items = sec.items || [];
    if (!items.length) return;

    // Header
    const hdr = el("div", "ev-section__header");
    const title = el("h3", "ev-section__title", sec.nombre || "");
    hdr.appendChild(title);

    const min = Number(sec.minimo) || 0;
    if (min > 0) {
      const minBadge = el("span", "ev-section__min");
      minBadge.dataset.secMinId = sec.id;
      updateMinBadge(minBadge, sec);
      hdr.appendChild(minBadge);
    }
    section.appendChild(hdr);

    // Detect type
    const tipo = detectTipo(sec, items);

    switch (tipo) {
      case "contador":
        renderContadorList(sec, items, section);
        break;
      case "radio-card":
        renderRadioCardList(sec, items, section);
        break;
      case "radio":
      default:
        renderRadioList(sec, items, section);
        break;
    }

    parent.appendChild(section);
  }

  function detectTipo(sec, items) {
    if (sec.tipo) return sec.tipo.toLowerCase().replace(/\s/g, "");
    // Heuristic: if most items have images and section seems like "barras" → radio-card
    const withImg = items.filter(hasImg).length;
    if (withImg > items.length / 2 && items.length <= 6) return "radio-card";
    return "radio";
  }

  function isPrincipalSection(sec) {
    const id = String(sec.id || "").toLowerCase();
    const nombre = String(sec.nombre || "").toLowerCase();
    return id.includes("principal") || nombre.includes("principal");
  }

  function requiredTotalForSection(sec) {
    const min = Number(sec.minimo) || 0;
    return isPrincipalSection(sec) ? Math.max(store.personas, min) : min;
  }

  function updateMinBadge(badge, sec) {
    const min = Number(sec.minimo) || 0;
    if (!min) return;
    const tipo = detectTipo(sec, sec.items || []);
    let met = false;
    if (tipo === "contador") {
      const total = getCounterTotal(sec.id);
      const allItemsMeetMin = (sec.items || []).every((item) => {
        const qty = getCounterQty(sec.id, item.id);
        return qty === 0 || qty >= min;
      });
      met = total >= min && allItemsMeetMin;
    } else {
      met = Boolean(getRadioSelection(sec.id));
    }
    badge.textContent = met
      ? `✓ Mín. ${min} por plato`
      : `Mín. ${min} por plato`;
    badge.className = met
      ? "ev-section__min"
      : "ev-section__min ev-section__min--error";
  }

  function updateTotalBar(bar, sec, force = false) {
    const total = getCounterTotal(sec.id);
    const max = store.personas;
    const min = Number(sec.minimo) || 0;
    const requiredTotal = requiredTotalForSection(sec);
    const section = bar.closest(".ev-section");
    const isTouched = section && section.dataset.touched === "true";
    const pct = Math.min(100, Math.round((total / max) * 100));
    const full = total >= max;

    const allowAlerts = force || isTouched;

    // Check if any selected item violates the per-item min (still useful hint)
    const hasItemIssue = allowAlerts && min > 0 && (sec.items || []).some((item) => {
      const qty = getCounterQty(sec.id, item.id);
      return qty > 0 && qty < min;
    });

    const statusHTML = full ? '<span class="ev-counter-total__full">Completo</span>' : '';

    let fillCls = 'ev-counter-total__fill';
    if (full) {
      fillCls += ' ev-counter-total__fill--full';
    }

    bar.innerHTML =
      `<div class="ev-counter-total__header">` +
      `<span class="ev-counter-total__text">${total} de ${max} personas</span>` +
      statusHTML +
      `</div>` +
      `<div class="ev-counter-total__bar"><div class="${fillCls}" style="width:${pct}%"></div></div>`;

  }

  function clearInlineError(section) {
    const err = section.querySelector(".ev-inline-error");
    if (err) err.remove();
    section.classList.remove("ev-section--error");
  }

  function openLightbox(item) {
    const existing = document.querySelector(".ev-lightbox");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "ev-lightbox";
    overlay.innerHTML =
      `<div class="ev-lightbox__backdrop"></div>` +
      `<div class="ev-lightbox__content">` +
      `<button class="ev-lightbox__close" aria-label="Cerrar">&times;</button>` +
      `<img src="${esc(cloudi(item.imagen, 800))}" alt="${esc(item.nombre)}" class="ev-lightbox__img" />` +
      `<div class="ev-lightbox__info">` +
      `<h3 class="ev-lightbox__name">${esc(item.nombre)}</h3>` +
      `${item.descripcion ? '<p class="ev-lightbox__desc">' + esc(item.descripcion) + '</p>' : ''}` +
      `</div></div>`;

    const close = () => {
      overlay.classList.add("ev-lightbox--closing");
      overlay.addEventListener("animationend", () => overlay.remove(), { once: true });
    };
    overlay.querySelector(".ev-lightbox__backdrop").addEventListener("click", close);
    overlay.querySelector(".ev-lightbox__close").addEventListener("click", close);
    overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    document.body.appendChild(overlay);
    overlay.querySelector(".ev-lightbox__close").focus();
  }

  /* ── Counter list ── */

  function renderContadorList(sec, items, section) {
    const list = el("div", "ev-section__list");

    items.forEach((item) => {
      const row = el("div", "ev-counter-item");
      row.dataset.itemId = item.id;
      row.dataset.itemId = item.id;
      const qty = getCounterQty(sec.id, item.id);
      if (qty > 0) row.classList.add("ev-counter-item--has-qty");

      let thumbHTML = "";
      if (hasImg(item)) {
        thumbHTML = `
          <div class="ev-counter-item__thumb">
            <img src="${esc(cloudi(item.imagen, 240))}" alt="${esc(item.nombre)}" loading="lazy" />
          </div>`;
      }

      row.innerHTML = `
        ${thumbHTML}
        <div class="ev-counter-item__info">
          <div class="ev-counter-item__name">${esc(item.nombre)}</div>
          ${item.descripcion ? `<div class="ev-counter-item__desc">${esc(item.descripcion)}</div>` : ""}
          ${item.precio ? `<div class="ev-counter-item__price">$${fmtCurrency(item.precio)}</div>` : ""}
        </div>
        <div class="ev-counter-item__controls">
          <button class="ev-counter-item__btn ev-dec" aria-label="Reducir ${esc(item.nombre)}">−</button>
          <input type="number" class="ev-counter-item__qty-input" inputmode="numeric" min="0" value="${qty}" aria-label="Cantidad de ${esc(item.nombre)}" />
          <button class="ev-counter-item__btn ev-inc" aria-label="Agregar ${esc(item.nombre)}">+</button>
        </div>
      `;

      // Inline per-item warning
      const itemWarn = el("div", "ev-counter-item__warn ev-hidden");
      row.appendChild(itemWarn);

      const qtyInput = row.querySelector(".ev-counter-item__qty-input");

      const refreshItemWarn = (qty) => {
        const itemMinVal = Number(sec.minimo) || 0;
        const show = qty > 0 && qty < itemMinVal;
        itemWarn.classList.toggle("ev-hidden", !show);
        row.classList.toggle("ev-counter-item--invalid", show);
        if (show) {
          const faltan = itemMinVal - qty;
          itemWarn.textContent = `Necesitas ${faltan} más (mín. ${itemMinVal} por plato)`;
        }
      };

      const refresh = () => {
        const newQty = getCounterQty(sec.id, item.id);
        qtyInput.value = String(newQty);
        row.classList.toggle("ev-counter-item--has-qty", newQty > 0);
        refreshItemWarn(newQty);
        // Update min badge
        const badge = section.querySelector(`[data-sec-min-id="${sec.id}"]`);
        if (badge) updateMinBadge(badge, sec);
        // Update total bar
        const totalBar = section.querySelector(`[data-sec-total-id="${sec.id}"]`);
        if (totalBar) updateTotalBar(totalBar, sec);
        // Update sub-options visibility
        const subWrap = row.nextElementSibling;
        if (subWrap && subWrap.classList.contains("ev-suboptions")) {
          subWrap.classList.toggle("ev-hidden", newQty === 0);
        }
      };

      // Initialize warning state
      refreshItemWarn(qty);

      const itemMin = Number(sec.minimo) || 0;

      // Press-and-hold acceleration for + / -
      const addHoldBehavior = (btn, onStep) => {
        let holdTimer = null;
        let repeatTimer = null;
        const clearTimers = () => {
          if (holdTimer) clearTimeout(holdTimer);
          if (repeatTimer) clearInterval(repeatTimer);
          holdTimer = repeatTimer = null;
        };
        btn.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          holdTimer = setTimeout(() => {
            onStep();
            repeatTimer = setInterval(onStep, 170);
          }, 300);
        });
        ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
          btn.addEventListener(ev, clearTimers)
        );
      };

      row.querySelector(".ev-dec").addEventListener("click", () => {
        const cur = getCounterQty(sec.id, item.id);
        // If at or below minimum, jump to 0 (deselect)
        const next = cur <= itemMin ? 0 : cur - 1;
        setCounterQty(sec.id, item.id, next);
        section.dataset.hasErrors = "false";
        section.dataset.touched = "true";
        clearInlineError(section);
        refresh();
      });
      addHoldBehavior(row.querySelector(".ev-dec"), () => {
        row.querySelector(".ev-dec").click();
      });

      row.querySelector(".ev-inc").addEventListener("click", () => {
        const currentTotal = getCounterTotal(sec.id);
        if (currentTotal >= store.personas) return;
        const cur = getCounterQty(sec.id, item.id);
        // If at 0, jump to minimum (or max available)
        let next;
        if (cur === 0 && itemMin > 0) {
          const available = store.personas - currentTotal;
          next = Math.min(itemMin, available);
        } else {
          next = cur + 1;
        }
        setCounterQty(sec.id, item.id, next);
        section.dataset.hasErrors = "false";
        section.dataset.touched = "true";
        clearInlineError(section);
        refresh();
      });
      addHoldBehavior(row.querySelector(".ev-inc"), () => {
        row.querySelector(".ev-inc").click();
      });

      // Facilitar tap en el área central (no solo botones)
      const controls = row.querySelector(".ev-counter-item__controls");
      controls.addEventListener("click", (e) => {
        if (e.target.classList.contains("ev-counter-item__btn")) return;
        qtyInput.focus();
      });

      qtyInput.addEventListener("input", () => {
        const raw = qtyInput.value.replace(/[^0-9]/g, "");
        let num = parseInt(raw, 10);
        if (isNaN(num) || num < 0) num = 0;
        const otherTotal = getCounterTotal(sec.id) - getCounterQty(sec.id, item.id);
        const maxAllowed = Math.max(0, store.personas - otherTotal);
        if (num > maxAllowed) num = maxAllowed;
        setCounterQty(sec.id, item.id, num);
        section.dataset.hasErrors = "false";
        section.dataset.touched = "true";
        clearInlineError(section);
        refresh();
      });

      qtyInput.addEventListener("focus", () => {
        qtyInput.select();
      });
      qtyInput.addEventListener("click", () => qtyInput.select());

      qtyInput.addEventListener("blur", () => {
        const raw = qtyInput.value.trim();
        let num = parseInt(raw, 10);
        if (isNaN(num) || num < 0) num = 0;
        // Snap: if > 0 but below minimum, round up to minimum
        if (num > 0 && num < itemMin) {
          const otherTotal = getCounterTotal(sec.id) - getCounterQty(sec.id, item.id);
          const maxAllowed = Math.max(0, store.personas - otherTotal);
          num = Math.min(itemMin, maxAllowed);
          if (num < itemMin) num = 0; // not enough room, deselect
        }
        setCounterQty(sec.id, item.id, num);
        section.dataset.hasErrors = "false";
        section.dataset.touched = "true";
        clearInlineError(section);
        refresh();
      });

      list.appendChild(row);

      // Sub-options: componentes (multi-component dish) or flat opciones
      if (item.componentes && Array.isArray(item.componentes) && item.componentes.length) {
        const subWrap = el("div", `ev-suboptions${qty === 0 ? " ev-hidden" : ""}`);
        item.componentes.forEach((comp) => {
          const compBlock = el("div", "ev-suboptions__comp");
          const compLabel = el("div", "ev-suboptions__comp-name", comp.nombre);
          compBlock.appendChild(compLabel);

          if (comp.opciones && Array.isArray(comp.opciones)) {
            comp.opciones.forEach((opGroup) => {
              const label = el("div", "ev-suboptions__label", opGroup.nombre || "Elige una opción");
              compBlock.appendChild(label);

              const opItems = opGroup.items || [];
              const radioList = el("div", "ev-radio-list");
              const opKey = `${comp.id}__${opGroup.id || opGroup.nombre}`;

              opItems.forEach((opItem) => {
                const radio = el("button", "ev-radio-item");
                const currentVal = getOpcion(item.id, opKey);
                if (currentVal === String(opItem.id)) radio.classList.add("ev-radio-item--active");

                radio.innerHTML = `
                  <span class="ev-radio-item__dot"></span>
                  <span class="ev-radio-item__label">${esc(opItem.nombre)}</span>
                `;

                radio.addEventListener("click", () => {
                  setOpcion(item.id, opKey, String(opItem.id));
                  radioList.querySelectorAll(".ev-radio-item").forEach((r) =>
                    r.classList.remove("ev-radio-item--active")
                  );
                  radio.classList.add("ev-radio-item--active");
                  section.dataset.hasErrors = "false";
                  section.dataset.touched = "true";
                  clearInlineError(section);
                });

                radioList.appendChild(radio);
              });

              compBlock.appendChild(radioList);
            });
          }
          subWrap.appendChild(compBlock);
        });
        list.appendChild(subWrap);
      } else if (item.opciones && Array.isArray(item.opciones) && item.opciones.length) {
        const subWrap = el("div", `ev-suboptions${qty === 0 ? " ev-hidden" : ""}`);
        item.opciones.forEach((opGroup) => {
          const label = el("div", "ev-suboptions__label", opGroup.nombre || "Elige una opción");
          subWrap.appendChild(label);

          const opItems = opGroup.items || [];
          const radioList = el("div", "ev-radio-list");

          opItems.forEach((opItem) => {
            const radio = el("button", "ev-radio-item");
            const currentVal = getOpcion(item.id, opGroup.id || opGroup.nombre);
            if (currentVal === String(opItem.id)) radio.classList.add("ev-radio-item--active");

            radio.innerHTML = `
              <span class="ev-radio-item__dot"></span>
              <span class="ev-radio-item__label">${esc(opItem.nombre)}</span>
            `;

            radio.addEventListener("click", () => {
              setOpcion(item.id, opGroup.id || opGroup.nombre, String(opItem.id));
              radioList.querySelectorAll(".ev-radio-item").forEach((r) =>
                r.classList.remove("ev-radio-item--active")
              );
              radio.classList.add("ev-radio-item--active");
              section.dataset.hasErrors = "false";
              section.dataset.touched = "true";
              clearInlineError(section);
            });

            radioList.appendChild(radio);
          });

          subWrap.appendChild(radioList);
        });
        list.appendChild(subWrap);
      }
    });

    const totalBar = el("div", "ev-counter-total");
    totalBar.dataset.secTotalId = sec.id;
    updateTotalBar(totalBar, sec);
    section.appendChild(totalBar);

    section.appendChild(list);
  }

  /* ── Radio list ── */

  function renderRadioList(sec, items, section) {
    const list = el("div", "ev-radio-list");

    items.forEach((item) => {
      const radio = el("button", "ev-radio-item");
      if (getRadioSelection(sec.id) === String(item.id))
        radio.classList.add("ev-radio-item--active");

      radio.innerHTML = `
        <span class="ev-radio-item__dot"></span>
        <div>
          <span class="ev-radio-item__label">${esc(item.nombre)}</span>
          ${item.descripcion ? `<span class="ev-radio-item__sublabel">${esc(item.descripcion)}</span>` : ""}
        </div>
      `;

      radio.addEventListener("click", () => {
        setRadioSelection(sec.id, String(item.id));
        list.querySelectorAll(".ev-radio-item").forEach((r) =>
          r.classList.remove("ev-radio-item--active")
        );
        radio.classList.add("ev-radio-item--active");
        section.dataset.hasErrors = "false";
        section.dataset.touched = "true";
        clearInlineError(section);
        // Update badge
        const badge = section.querySelector(`[data-sec-min-id="${sec.id}"]`);
        if (badge) updateMinBadge(badge, sec);
      });

      list.appendChild(radio);
    });

    section.appendChild(list);
  }

  /* ── Radio cards ── */

  function renderRadioCardList(sec, items, section) {
    const grid = el("div", "ev-radio-cards");

    items.forEach((item) => {
      const card = el("div", "ev-radio-card");
      if (getRadioSelection(sec.id) === String(item.id))
        card.classList.add("ev-radio-card--active");

      let imgHTML = "";
      if (hasImg(item)) {
        imgHTML = `
          <div class="ev-radio-card__img-wrap">
            <img src="${esc(cloudi(item.imagen, 360))}" alt="${esc(item.nombre)}"
                 class="ev-radio-card__img" loading="lazy" />
            <button class="ev-radio-card__zoom" aria-label="Ver imagen de ${esc(item.nombre)}" data-zoom>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>`;
      }

      card.innerHTML = `
        ${imgHTML}
        <div class="ev-radio-card__body">
          <div class="ev-radio-card__name">${esc(item.nombre)}</div>
          ${item.descripcion ? `<div class="ev-radio-card__desc">${esc(item.descripcion)}</div>` : ""}
        </div>
        <div class="ev-radio-card__check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-zoom]")) {
          openLightbox(item);
          return;
        }
        setRadioSelection(sec.id, String(item.id));
        grid.querySelectorAll(".ev-radio-card").forEach((c) =>
          c.classList.remove("ev-radio-card--active")
        );
        card.classList.add("ev-radio-card--active");
        section.dataset.hasErrors = "false";
        section.dataset.touched = "true";
        clearInlineError(section);
        // Update badge
        const badge = section.querySelector(`[data-sec-min-id="${sec.id}"]`);
        if (badge) updateMinBadge(badge, sec);
      });

      grid.appendChild(card);
    });

    section.appendChild(grid);
  }

  /* ═══════════════════════════════════════
     VALIDATION
     ═══════════════════════════════════════ */

  function ensureSectionError(map, secId) {
    if (!map[secId]) map[secId] = { msgs: [], focusId: null };
    return map[secId];
  }

  function pushSectionError(map, secId, message, focusId) {
    if (!secId) return;
    const bucket = ensureSectionError(map, secId);
    if (message && !bucket.msgs.includes(message)) bucket.msgs.push(message);
    if (focusId && !bucket.focusId) bucket.focusId = focusId;
  }

  function clearSectionErrors(container) {
    container
      .querySelectorAll(".ev-inline-error")
      .forEach((el) => el.remove());
    container
      .querySelectorAll(".ev-section.ev-section--error")
      .forEach((sec) => sec.classList.remove("ev-section--error"));
  }

  function showSectionErrors(container, sectionErrors) {
    if (!sectionErrors) return;
    Object.entries(sectionErrors).forEach(([secId, bucket]) => {
      const msgs = bucket.msgs || [];
      const section = container.querySelector(`.ev-section[data-sec-id="${secId}"]`);
      if (!section || !msgs || !msgs.length) return;
      const alert = el("div", "ev-inline-error");
      alert.innerHTML = msgs
        .slice(0, 3)
        .map((m) => `<div class="ev-inline-error__line"><span class="ev-inline-error__dot">•</span><span>${esc(m)}</span></div>`)
        .join("");
      const header = section.querySelector(".ev-section__header");
      if (header && header.nextSibling) {
        header.insertAdjacentElement("afterend", alert);
      } else {
        section.prepend(alert);
      }
      section.classList.add("ev-section--error");

      if (bucket.focusId) {
        const target = section.querySelector(`[data-item-id="${bucket.focusId}"]`);
        if (target) {
          target.classList.add("ev-pulse");
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => target.classList.remove("ev-pulse"), 900);
        }
      }
    });
  }

  function validateConfigurador(cat) {
    const secciones = cat.secciones || [];
    const errors = [];
    const sectionErrors = {};

    secciones.forEach((sec) => {
      const items = sec.items || [];
      if (!items.length) return;

      const tipo = detectTipo(sec, items);
      const min = Number(sec.minimo) || 0;
      const requiredTotal = requiredTotalForSection(sec);

      if (tipo === "contador") {
        const total = getCounterTotal(sec.id);
        if (requiredTotal > 0 && total < requiredTotal) {
          const faltan = requiredTotal - total;
          const reason =
            isPrincipalSection(sec) && requiredTotal >= store.personas
              ? `${store.personas} personas`
              : `el mínimo de ${requiredTotal}`;
          errors.push(
            `${sec.nombre}: agrega ${faltan} más para cubrir ${reason} (tienes ${total})`
          );
          pushSectionError(sectionErrors, sec.id, `Agrega ${faltan} platos para cubrir ${reason}.`);
        }
        // Check per-item minimum and sub-options for selected items
        items.forEach((item) => {
          const qty = getCounterQty(sec.id, item.id);
          if (qty > 0 && min > 0 && qty < min) {
            const faltan = min - qty;
            errors.push(
              `${item.nombre}: agrega ${faltan} más para llegar al mínimo de ${min}`
            );
            pushSectionError(sectionErrors, sec.id, `${item.nombre}: agrega ${faltan} (mín. ${min}).`, item.id);
          }
          // Validate componentes or flat opciones
          if (qty > 0 && item.componentes && Array.isArray(item.componentes)) {
            item.componentes.forEach((comp) => {
              if (comp.opciones && Array.isArray(comp.opciones)) {
                comp.opciones.forEach((opGroup) => {
                  const opKey = `${comp.id}__${opGroup.id || opGroup.nombre}`;
                  const val = getOpcion(item.id, opKey);
                  if (!val) {
                    errors.push(
                      `${item.nombre} → ${comp.nombre}: selecciona ${opGroup.nombre || "una opción"}`
                    );
                    pushSectionError(sectionErrors, sec.id, `${item.nombre} · ${comp.nombre}: elige ${opGroup.nombre || "una opción"}.`, item.id);
                  }
                });
              }
            });
          } else if (qty > 0 && item.opciones && Array.isArray(item.opciones)) {
            item.opciones.forEach((opGroup) => {
              const val = getOpcion(item.id, opGroup.id || opGroup.nombre);
              if (!val) {
                errors.push(
                  `${item.nombre}: selecciona ${opGroup.nombre || "una opción"}`
                );
                pushSectionError(sectionErrors, sec.id, `${item.nombre}: elige ${opGroup.nombre || "una opción"}.`, item.id);
              }
            });
          }
        });
      } else {
        // radio or radio-card
        const sel = getRadioSelection(sec.id);
        if (!sel) {
          errors.push(`${sec.nombre}: selecciona una opción`);
          pushSectionError(sectionErrors, sec.id, "Selecciona una opción para continuar.");
        }
      }
    });

    return {
      valid: errors.length === 0,
      message: errors.join("\n"),
      errors,
      sectionErrors,
    };
  }

  /* ═══════════════════════════════════════
     STEP 5: RESUMEN
     ═══════════════════════════════════════ */

  function renderResumen(container) {
    const cat = getCategoria();
    if (!cat) {
      goTo(STEP.CATEGORIAS);
      return;
    }

    const header = el("div", "ev-step__header");
    header.innerHTML = `
      <h2 class="ev-step__title">Resumen de tu cotización</h2>
      <p class="ev-step__subtitle">Revisa las selecciones antes de enviar</p>
    `;
    container.appendChild(header);

    const summary = el("div", "ev-summary");

    // General info
    const infoBlock = el("div", "ev-summary__block");
    let infoHTML = `
      <div class="ev-summary__block-title">Evento</div>
      <div class="ev-summary__row">
        <span class="ev-summary__label">Personas</span>
        <span class="ev-summary__value">${store.personas}</span>
      </div>
      <div class="ev-summary__row">
        <span class="ev-summary__label">Categoría</span>
        <span class="ev-summary__value">${esc(cat.nombre)}</span>
      </div>
    `;
    if (store.fechaEvento) {
      const fechaObj = new Date(store.fechaEvento + "T12:00:00");
      const fechaStr = fechaObj.toLocaleDateString("es-CO", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
      infoHTML += `
      <div class="ev-summary__row">
        <span class="ev-summary__label">Fecha deseada</span>
        <span class="ev-summary__value">${esc(fechaStr)}</span>
      </div>
      `;
    }
    infoBlock.innerHTML = infoHTML;
    summary.appendChild(infoBlock);

    // Sections details (invoice style)
    const secciones = cat.secciones || [];
    secciones.forEach((sec) => {
      const items = sec.items || [];
      if (!items.length) return;

      const tipo = detectTipo(sec, items);
      const block = el("div", "ev-summary__block");
      const titleHTML = `<div class="ev-summary__block-title">${esc(sec.nombre)}</div>`;
      block.innerHTML = titleHTML;

      if (tipo === "contador") {
        const sel = store.selecciones[sec.id] || {};
        let hasItems = false;
        Object.entries(sel).forEach(([itemId, qty]) => {
          const q = Number(qty);
          if (q <= 0) return;
          hasItems = true;
          const item = items.find((i) => String(i.id) === String(itemId));
          if (!item) return;

          let label = item.nombre;
          let compHTML = "";
          // Add sub-options (componentes or flat opciones)
          if (item.componentes && store.opciones[itemId]) {
            const compLines = [];
            item.componentes.forEach((comp) => {
              if (!comp.opciones) return;
              const parts = [];
              comp.opciones.forEach((opGroup) => {
                const opKey = `${comp.id}__${opGroup.id || opGroup.nombre}`;
                const val = getOpcion(itemId, opKey);
                if (val) {
                  const opItem = (opGroup.items || []).find(
                    (o) => String(o.id) === String(val)
                  );
                  if (opItem) parts.push(`${opGroup.nombre}: ${opItem.nombre}`);
                }
              });
              if (parts.length) compLines.push(`${esc(comp.nombre)} \u2192 ${esc(parts.join(", "))}`);
            });
            if (compLines.length)
              compHTML = `<div class="ev-summary__invoice-comps">${compLines.map(l => `<div class="ev-summary__invoice-comp">${l}</div>`).join("")}</div>`;
          } else if (item.opciones && store.opciones[itemId]) {
            const optDescs = [];
            item.opciones.forEach((opGroup) => {
              const val = getOpcion(itemId, opGroup.id || opGroup.nombre);
              if (val) {
                const opItem = (opGroup.items || []).find(
                  (o) => String(o.id) === String(val)
                );
                if (opItem)
                  optDescs.push(`${opGroup.nombre}: ${opItem.nombre}`);
              }
            });
            if (optDescs.length)
              label += ` (${optDescs.join(", ")})`;
          }

          const precio = Number(item.precio) || 0;
          const subtotal = precio * q;
          const row = el("div", "ev-summary__invoice-row");
          row.innerHTML = `
            <div class="ev-summary__invoice-main">
              <span class="ev-summary__item-name">${esc(label)}</span>
              <span class="ev-summary__item-qty">&times;${q}</span>
            </div>
            ${compHTML}
            ${precio > 0 ? `<div class="ev-summary__invoice-price">
              <span class="ev-summary__invoice-unit">$${fmtCurrency(precio)} c/u</span>
              <span class="ev-summary__invoice-subtotal">$${fmtCurrency(subtotal)}</span>
            </div>` : ""}
          `;
          block.appendChild(row);
        });
        if (!hasItems) return;
      } else {
        const selId = getRadioSelection(sec.id);
        if (!selId) return;
        const item = items.find((i) => String(i.id) === String(selId));
        if (!item) return;

        const precio = Number(item.precio) || 0;
        const subtotal = precio * store.personas;
        const row = el("div", "ev-summary__invoice-row");
        row.innerHTML = `
          <div class="ev-summary__invoice-main">
            <span class="ev-summary__item-name">${esc(item.nombre)}</span>
            <span class="ev-summary__item-qty">&times;${store.personas}</span>
          </div>
          ${precio > 0 ? `<div class="ev-summary__invoice-price">
            <span class="ev-summary__invoice-unit">$${fmtCurrency(precio)} c/u</span>
            <span class="ev-summary__invoice-subtotal">$${fmtCurrency(subtotal)}</span>
          </div>` : `<div class="ev-summary__invoice-price">
            <span class="ev-summary__invoice-unit"></span>
            <span class="ev-summary__invoice-subtotal">Incluido</span>
          </div>`}
        `;
        block.appendChild(row);
      }

      summary.appendChild(block);
    });

    // Estimated total
    const totalEstimado = calcularTotal(cat);
    if (totalEstimado > 0) {
      const totalBlock = el("div", "ev-summary__total");
      totalBlock.innerHTML = `
        <div class="ev-summary__total-row">
          <span class="ev-summary__total-label">Total estimado</span>
          <span class="ev-summary__total-value">$${fmtCurrency(totalEstimado)}</span>
        </div>
        <p class="ev-summary__total-hint">*Precio sujeto a confirmación por el restaurante</p>
      `;
      summary.appendChild(totalBlock);
    }

    container.appendChild(summary);

    // Actions
    const actions = el("div", "ev-actions");
    const btnEdit = el("button", "ev-btn ev-btn--secondary ev-btn--block");
    btnEdit.textContent = "Editar selección";
    btnEdit.addEventListener("click", () => goTo(STEP.CONFIG));

    const btnNext = el("button", "ev-btn ev-btn--primary ev-btn--block");
    btnNext.textContent = "Continuar al envío";
    btnNext.addEventListener("click", () => goTo(STEP.ENVIO));

    actions.append(btnEdit, btnNext);
    container.appendChild(actions);
  }

  /* ═══════════════════════════════════════
     STEP 6: ENVÍO (WhatsApp)
     ═══════════════════════════════════════ */

  function renderEnvio(container) {
    const msg = buildWAMessage();

    const header = el("div", "ev-step__header");
    header.innerHTML = `
      <h2 class="ev-step__title">Enviar cotización</h2>
      <p class="ev-step__subtitle">Este mensaje se enviará por WhatsApp</p>
    `;
    container.appendChild(header);

    // Message preview
    const preview = el("div", "ev-wa__preview");
    preview.textContent = msg;
    container.appendChild(preview);

    // Actions
    const actions = el("div", "ev-actions");

    const btnWA = el("button", "ev-btn ev-btn--wa ev-btn--block ev-btn--lg");
    btnWA.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.609l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.585l-.386-.236-2.642.886.886-2.642-.236-.386A9.94 9.94 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
      Enviar por WhatsApp
    `;
    btnWA.addEventListener("click", () => openWhatsApp(msg));

    const btnBack = el("button", "ev-btn ev-btn--secondary ev-btn--block");
    btnBack.textContent = "Editar cotización";
    btnBack.addEventListener("click", () => goTo(STEP.RESUMEN));

    actions.append(btnWA, btnBack);
    container.appendChild(actions);
  }

  /* ═══════════════════════════════════════
     PRICE CALCULATION
     ═══════════════════════════════════════ */

  function calcularTotal(cat) {
    if (!cat) return 0;
    let total = 0;
    const secciones = cat.secciones || [];

    secciones.forEach((sec) => {
      const items = sec.items || [];
      if (!items.length) return;
      const tipo = detectTipo(sec, items);

      if (tipo === "contador") {
        const sel = store.selecciones[sec.id] || {};
        Object.entries(sel).forEach(([itemId, qty]) => {
          const q = Number(qty);
          if (q <= 0) return;
          const item = items.find((i) => String(i.id) === String(itemId));
          if (item && item.precio) {
            total += q * Number(item.precio);
          }
        });
      } else {
        const selId = getRadioSelection(sec.id);
        if (!selId) return;
        const item = items.find((i) => String(i.id) === String(selId));
        if (item && item.precio) {
          total += store.personas * Number(item.precio);
        }
      }
    });

    return total;
  }

  /* ═══════════════════════════════════════
     WHATSAPP MESSAGE BUILDER
     ═══════════════════════════════════════ */

  function buildWAMessage() {
    const cat = getCategoria();
    if (!cat) return "";

    const lines = [];
    lines.push(`Hola, quiero cotizar un evento para ${store.personas} personas.`);

    if (store.fechaEvento) {
      const fechaObj = new Date(store.fechaEvento + "T12:00:00");
      const fechaStr = fechaObj.toLocaleDateString("es-CO", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
      lines.push(`Fecha deseada: ${fechaStr}`);
    }

    lines.push("");
    lines.push(`Categoría: ${cat.nombre}`);

    const secciones = cat.secciones || [];
    secciones.forEach((sec) => {
      const items = sec.items || [];
      if (!items.length) return;
      const tipo = detectTipo(sec, items);

      if (tipo === "contador") {
        const sel = store.selecciones[sec.id] || {};
        const selected = Object.entries(sel).filter(([, q]) => Number(q) > 0);
        if (!selected.length) return;

        lines.push("");
        lines.push(`${sec.nombre}:`);
        selected.forEach(([itemId, qty]) => {
          const item = items.find((i) => String(i.id) === String(itemId));
          if (!item) return;
          let line = `- ${item.nombre} ×${qty}`;
          // Sub-options: componentes or flat opciones
          if (item.componentes && store.opciones[itemId]) {
            lines.push(line);
            item.componentes.forEach((comp) => {
              if (!comp.opciones) return;
              const parts = [];
              comp.opciones.forEach((opGroup) => {
                const opKey = `${comp.id}__${opGroup.id || opGroup.nombre}`;
                const val = getOpcion(itemId, opKey);
                if (val) {
                  const opItem = (opGroup.items || []).find(
                    (o) => String(o.id) === String(val)
                  );
                  if (opItem) parts.push(`${opGroup.nombre}: ${opItem.nombre}`);
                }
              });
              if (parts.length) lines.push(`  ${comp.nombre} → ${parts.join(", ")}`);
            });
          } else if (item.opciones && store.opciones[itemId]) {
            const opts = [];
            item.opciones.forEach((opGroup) => {
              const val = getOpcion(itemId, opGroup.id || opGroup.nombre);
              if (val) {
                const opItem = (opGroup.items || []).find(
                  (o) => String(o.id) === String(val)
                );
                if (opItem) opts.push(`${opGroup.nombre}: ${opItem.nombre}`);
              }
            });
            if (opts.length) line += ` (${opts.join(", ")})`;
            lines.push(line);
          } else {
            lines.push(line);
          }
        });
      } else {
        const selId = getRadioSelection(sec.id);
        if (!selId) return;
        const item = items.find((i) => String(i.id) === String(selId));
        if (!item) return;
        lines.push("");
        lines.push(`${sec.nombre}: ${item.nombre}`);
      }
    });

    const totalEstimado = calcularTotal(cat);
    if (totalEstimado > 0) {
      lines.push("");
      lines.push(`Total estimado: $${fmtCurrency(totalEstimado)} (sujeto a confirmación)`);
    }

    lines.push("");
    lines.push("¡Gracias!");
    return lines.join("\n");
  }

  function openWhatsApp(message) {
    const phone = getWAPhone().replace(/\D/g, "");
    const encoded = encodeURIComponent(message);
    const url = phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener");
  }

  /* ═══════════════════════════════════════
     ERROR HELPER
     ═══════════════════════════════════════ */

  function showError(container, message) {
    container.innerHTML = "";
    const div = el("div", "ev-error");
    const text = el("p", "ev-error__text", message);
    const btn = el("button", "ev-btn ev-btn--primary");
    btn.textContent = "Reintentar";
    btn.addEventListener("click", () => location.reload());
    div.append(text, btn);
    container.appendChild(div);
  }

  /* ═══════════════════════════════════════
     INIT
     ═══════════════════════════════════════ */

  function init() {
    // Start fetching API data in background
    loadData().catch(() => {});

    // Wire back button
    const back = refs.back();
    if (back) back.addEventListener("click", goBack);

    // Initial render → welcome screen
    render();
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
