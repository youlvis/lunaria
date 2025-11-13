/* ui.js */
const UI = (() => {
  // ---------- Helpers ----------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ---------- Marca / imágenes ----------
  function renderHeaderBrand(cfg) {
    $("#brand") &&
      ($("#brand").textContent = cfg?.nombre_restaurante || "Menú");
    if (cfg?.logo_url && $("#logo")) $("#logo").src = cfg.logo_url;
    if (cfg?.hero_url && $("#heroImg")) $("#heroImg").src = cfg.hero_url;
  }

  // ---------- Agrupar por categoría respetando el ORDEN DEL SHEET ----------
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

  // ---------- Cálculo de offset sticky ----------
  function calcOffset() {
    const off = $("#actionBar")?.offsetHeight || 0;
    document.documentElement.style.setProperty("--sticky-offset", `${off}px`);
    return off;
  }

  function smoothScrollTo(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const off = calcOffset();
    const y = el.getBoundingClientRect().top + window.pageYOffset - off - 8;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  // ---------- Tabs y menú de categorías ----------
  function buildTabs(cats) {
    const wrap = $("#catTabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    cats.forEach((c, idx) => {
      const b = document.createElement("button");
      b.className =
        "tab-underline pb-2 font-semibold text-sm text-neutral-300 whitespace-nowrap";
      b.dataset.target = `#sec-${slug(c)}`;
      b.textContent = c;
      if (idx === 0) b.classList.add("active");
      b.onclick = () => goToCategory(b.dataset.target, "auto");
      wrap.appendChild(b);
    });
  }

  function buildCatMenus(cats) {
    const menu = $("#catMenu");
    if (menu) menu.innerHTML = "";
    const menuDesk = $("#catMenuDesk");
    if (menuDesk) menuDesk.innerHTML = "";
    const activeLabel = $("#catTabs button.active")?.textContent?.trim();

    cats.forEach((c) => {
      const makeBtn = () => {
        const btn = document.createElement("button");
        btn.className = "w-full text-left px-4 py-3 hover:bg-white/5";
        btn.textContent = c;
        if (activeLabel && activeLabel === c) btn.classList.add("bg-white/5");
        return btn;
      };

      if (menu) {
        const btn = makeBtn();
        btn.onclick = () => {
          closeOverlay();
          closeCatDesk();
          goToCategory(`#sec-${slug(c)}`, "auto");
        };
        menu.appendChild(btn);
      }
      if (menuDesk) {
        const btn2 = makeBtn();
        btn2.onclick = () => {
          closeCatDesk();
          goToCategory(`#sec-${slug(c)}`, "auto");
        };
        menuDesk.appendChild(btn2);
      }
    });
  }

  // ---------- Secciones ----------
  function buildSections({ cats, map }) {
    const cont = $("#content");
    if (!cont) return;
    cont.innerHTML = "";

    cats.forEach((c) => {
      const sec = document.createElement("section");
      sec.id = `sec-${slug(c)}`;
      sec.className = "cat-section space-y-3";
      sec.innerHTML = `
        <h2 class="h-cat">${c}</h2>
        <div class="space-y-3" id="list-${slug(c)}"></div>
      `;
      cont.appendChild(sec);

      const list = sec.querySelector(`#list-${slug(c)}`);
      (map[c] || []).forEach((it) => list.appendChild(rowItem(it)));
    });
  }

  // ---------- Fila compacta ----------
  function rowItem(it) {
    const hasDesc = Boolean(
      it.descripcion && String(it.descripcion).trim().length
    );
    const div = document.createElement("div");
    div.className = "item-row";
    div.setAttribute("data-detail", it.id);
    div.innerHTML = `
      <div class="min-w-0">
        <div class="row-title line-clamp-1">${it.nombre || ""}</div>
        ${
          hasDesc
            ? `<div class="row-desc line-clamp-2">${it.descripcion || ""}</div>`
            : ``
        }
        <div class="row-price">$${Store.fmt(it.precio || 0)}</div>
      </div>
      <button class="thumb" data-detail="${it.id}" aria-label="Ver detalle de ${
      it.nombre || ""
    }">
        <img loading="lazy" src="${it.foto || ""}" alt="${it.nombre || ""}">
      </button>
    `;
    return div;
  }

  // ---------- Buscador unificado ----------
  const Search = { cats: [], index: [] };
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  function setCats(cats) {
    Search.cats = cats || [];
    buildSearchIndex();
  }

  function buildSearchIndex() {
    const items = Store?.state?.items || [];
    Search.index = items.map((it) => ({
      id: it.id,
      name: String(it.nombre || ""),
      cat: String(it.categoria || "Otros"),
      desc: String(it.descripcion || ""),
      foto: it.foto || "",
      price: Number(it.precio) || 0,
      text: norm(
        [it.nombre, it.descripcion, it.ingredientes, it.categoria].join(" ")
      ),
    }));
  }

  function openSearchPanel() {
    $("#searchPanel")?.classList.remove("hidden");
    $("#searchUnified")?.focus();
  }

  function closeSearchPanel(clear = true) {
    $("#searchPanel")?.classList.add("hidden");
    if (clear) {
      if ($("#searchUnified")) $("#searchUnified").value = "";
      const list = $("#searchList");
      const chips = $("#searchCatChips");
      if (list) list.innerHTML = "";
      if (chips) chips.innerHTML = "";
    }
  }

  function renderSearchResults(qRaw) {
    const q = norm(qRaw.trim());
    const list = $("#searchList");
    const chips = $("#searchCatChips");
    if (!list || !chips) return;

    list.innerHTML = "";
    chips.innerHTML = "";
    if (!q) return;

    // Categorías sugeridas
    const catMatches = Search.cats
      .filter((c) => norm(c).includes(q))
      .slice(0, 6);
    catMatches.forEach((c) => {
      const b = document.createElement("button");
      b.className =
        "w-full text-left px-4 py-3 rounded-2xl bg-neutral-900 border border-white/15 text-base font-bold tracking-wide uppercase";
      b.textContent = c;
      b.onclick = () => {
        closeSearchPanel();
        goToCategory(`#sec-${slug(c)}`, "auto");
      };
      chips.appendChild(b);
    });

    // Items sugeridos
    const itemMatches = Search.index
      .filter((it) => it.text.includes(q))
      .slice(0, 12);
    if (!itemMatches.length && !catMatches.length) {
      list.innerHTML =
        '<p class="text-sm text-neutral-500">No encontramos resultados.</p>';
      return;
    }

    itemMatches.forEach((it) => {
      const row = document.createElement("button");
      row.className =
        "w-full text-left border border-white/5 rounded-2xl px-3 py-3 bg-neutral-900/60 hover:border-white/20 transition";
      const price = Store?.fmt ? Store.fmt(it.price) : it.price;
      const desc = it.desc
        ? `<div class="text-xs text-neutral-500 line-clamp-2 mt-1">${it.desc}</div>`
        : "";
      const thumb = it.foto
        ? `<div class="w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0"><img src="${it.foto}" alt="${it.name}" class="w-full h-full object-cover"></div>`
        : "";
      row.innerHTML = `
        <div class="flex gap-3 items-center">
          <div class="flex-1 min-w-0 text-left">
            <div class="text-sm font-semibold">${it.name}</div>
            <div class="text-xs text-neutral-400">${it.cat}</div>
            ${desc}
            <div class="text-sm font-semibold text-green-400 mt-1">$${price}</div>
          </div>
          ${thumb}
        </div>`;
      row.onclick = () => {
        closeSearchPanel();
        scrollToItem(it.id);
      };
      list.appendChild(row);
    });
  }

  function applySearch() {
    const q = ($("#searchUnified")?.value || "").trim();
    renderSearchResults(q);
  }

  function scrollToItem(id) {
    const row =
      document.querySelector(`.item-row[data-detail="${id}"]`) ||
      document.querySelector(`[data-detail="${id}"]`);
    if (!row) return;
    const off = calcOffset();
    const y = row.getBoundingClientRect().top + window.pageYOffset - off - 12;
    window.scrollTo({ top: y, behavior: "smooth" });
    row.classList.add("flash");
    setTimeout(() => row.classList.remove("flash"), 1300);
  }

  // ---------- Modal ----------
  function openDetail(id) {
    const it = Store.state.items.find((x) => String(x.id) === String(id));
    if (!it) return;
    if ($("#detailImg")) $("#detailImg").src = it.foto || "";
    if ($("#detailName")) $("#detailName").textContent = it.nombre || "";
    if ($("#detailDesc")) $("#detailDesc").textContent = it.descripcion || "";
    if ($("#detailIngr"))
      $("#detailIngr").textContent = it.ingredientes
        ? `Ingredientes: ${it.ingredientes}`
        : "";
    if ($("#detailPrice"))
      $("#detailPrice").textContent = Store.fmt(it.precio || 0);
    toggleDetail(true);
  }
  function toggleDetail(open) {
    $("#detailModal")?.classList.toggle("hidden", !open);
  }

  // ---------- Overlays ----------
  function openOverlay(id) {
    $(id)?.classList.remove("hidden");
  }
  function closeOverlay() {
    $("#catMenuOverlay")?.classList.add("hidden");
    $("#searchOverlay")?.classList.add("hidden");
  }
  function openCatDesk() {
    $("#catMenuDesk")?.classList.toggle("hidden");
  }
  function closeCatDesk() {
    $("#catMenuDesk")?.classList.add("hidden");
  }

  // ---------- Scroll spy ----------
  function mountScrollSpy(cats) {
    const sections = cats
      .map((c) => document.querySelector(`#sec-${slug(c)}`))
      .filter(Boolean);
    const off = calcOffset();

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        if (programmaticNav) return;
        setActiveBySectionId(visible.target.id, "smooth");
      },
      {
        root: null,
        rootMargin: `-${off + 10}px 0px -60% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((s) => obs.observe(s));
    window.addEventListener(
      "resize",
      () => {
        calcOffset();
        const active = $("#catTabs button.active");
        if (active) ensureTabVisible(active, "auto");
      },
      { passive: true }
    );
  }

  // ---------- Utils ----------
  const slug = (s) =>
    String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  function ensureTabVisible(btn, behavior = "smooth") {
    const wrap = $("#catTabs");
    if (!wrap || !btn) return;
    const targetLeft =
      btn.offsetLeft - (wrap.clientWidth - btn.clientWidth) / 2;
    const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    const left = Math.max(0, Math.min(targetLeft, max));
    wrap.scrollTo({ left, behavior });
  }

  let programmaticNav = false;

  function setActiveBySectionId(id, behavior = "smooth") {
    const btn = $(`#catTabs button[data-target="#${id}"]`);
    if (!btn) return;
    $$("#catTabs button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    ensureTabVisible(btn, behavior);
    const label = id.replace("sec-", "");
    const pretty = label
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    if ($("#currentCat")) $("#currentCat").textContent = pretty;
  }

  function goToCategory(selector, behavior = "auto") {
    const el = document.querySelector(selector);
    if (!el) return;
    programmaticNav = true;
    const off = calcOffset();
    const y = el.getBoundingClientRect().top + window.pageYOffset - off - 8;
    window.scrollTo({ top: y, behavior });
    setActiveBySectionId(el.id, "auto");
    setTimeout(() => {
      programmaticNav = false;
    }, 120);
  }

  // ---------- Eventos ----------
  function wireEvents() {
    $("#openCatMenu")?.addEventListener("click", () => {
      openOverlay("#catMenuOverlay");
      const activeText = $("#catTabs button.active")?.textContent?.trim();
      const list = $("#catMenu");
      if (list && activeText) {
        const btn = Array.from(list.querySelectorAll("button")).find(
          (b) => b.textContent.trim() === activeText
        );
        btn?.scrollIntoView({ block: "center", behavior: "auto" });
      }
    });
    $("#openCatMenuDesk")?.addEventListener("click", openCatDesk);
    $$('#catMenuOverlay [data-close="overlay"]').forEach(
      (e) => (e.onclick = closeOverlay)
    );
    $$('#searchOverlay [data-close="overlay"]').forEach(
      (e) => (e.onclick = closeOverlay)
    );

    // search mejorado
    $("#openSearch")?.addEventListener("click", openSearchPanel);
    $("#searchUnified")?.addEventListener("input", applySearch);
    $("#clearSearch")?.addEventListener("click", () => closeSearchPanel(true));
    document.addEventListener("click", (ev) => {
      const p = ev.target.closest("#searchPanel");
      const trigger =
        ev.target.closest("#openSearch") || ev.target.closest("#search");
      if (!p && !trigger) closeSearchPanel(false);
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeSearchPanel(true);
    });

    // modal
    $("#closeDetail")?.addEventListener("click", () => toggleDetail(false));
    $('#detailModal [data-close="modal"]')?.addEventListener("click", () =>
      toggleDetail(false)
    );

    document.addEventListener(
      "click",
      (ev) => {
        const b = ev.target.closest("[data-detail]");
        if (!b) return;
        openDetail(b.getAttribute("data-detail"));
      },
      { passive: true }
    );
  }

  // ---------- API pública ----------
  return {
    renderHeaderBrand,
    groupByCategory,
    buildTabs,
    buildCatMenus,
    buildSections,
    mountScrollSpy,
    wireEvents,
    applySearch,
    smoothScrollTo,
    calcOffset,
    setCats,
  };
})();
