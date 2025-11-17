/* ui.js */
const UI = (() => {
  // ---------- Helpers ----------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ---------- Marca / imágenes ----------
  // function renderHeaderBrand(cfg) {
  //   $("#brand") &&
  //     ($("#brand").textContent = cfg?.nombre_restaurante || "Menú");
  //   if (cfg?.logo_url && $("#logo")) $("#logo").src = cfg.logo_url;
  //   if (cfg?.hero_url && $("#heroImg")) $("#heroImg").src = cfg.hero_url;
  // }

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
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  function ensureSearchOverlay() {
    const panel = $("#searchPanel");
    if (!panel || panel.dataset.simple === "true") return;
    panel.innerHTML = `
      <div class="mx-auto max-w-5xl">
        <div id="inputPanel" class="h-12 rounded-[14px] flex items-center pl-2 pr-2 shadow-lg">
          <span class="inline-block h-3 w-3 rounded-full bg-[var(--accent)] mr-2"></span>
          <input id="searchUnified" type="search" inputmode="search" placeholder="Buscar platos, ingredientes o categorias"
            class="flex-1 bg-transparent border-0 focus:outline-none text-[0.8rem] leading-[1.25rem] placeholder:text-neutral-400" />
          <button id="clearSearch" class="w-[32px] h-[32px] rounded-[10px] bg-[var(--bg)] flex items-center justify-center">
           <img src="assets/img/icon-close.svg" class="w-[15px]" alt="Cerrar" />
           </button>
        </div>
      </div>
    `;
    panel.dataset.simple = "true";
  }

  // chips removidos para diseño minimalistaf

  function openSearchPanel() {
    ensureSearchOverlay();
    if ($("#searchUnified") && $("#search"))
      $("#searchUnified").value = $("#search").value || "";
    const _tabs = document.getElementById("catTabs");
    if (_tabs) _tabs.classList.add("hidden");
    const _options = document.getElementById("optionsBar");
    if (_options) _options.classList.add("hidden");
    $("#searchPanel")?.classList.remove("hidden");
    $("#searchUnified")?.focus();
  }

  function closeSearchPanel(clear = true) {
    $("#searchPanel")?.classList.add("hidden");
    const _tabs = document.getElementById("catTabs");
    if (_tabs) _tabs.classList.remove("hidden");
    const _options = document.getElementById("optionsBar");
    if (_options) _options.classList.remove("hidden");
    if (clear) {
      if ($("#searchUnified")) $("#searchUnified").value = "";
      if ($("#search")) $("#search").value = "";
    }
    applySearch();
  }

  function applySearch() {
    ensureSearchOverlay();
    const raw = (
      $("#searchUnified")?.value ||
      $("#search")?.value ||
      ""
    ).trim();
    const q = norm(raw);
    const sections = $$("#content .cat-section");
    // const status = $("#searchStatus");
    let emptyBanner = document.getElementById("noResults");
    if (!emptyBanner) {
      emptyBanner = document.createElement("div");
      emptyBanner.id = "noResults";
      emptyBanner.className =
        "hidden mx-auto max-w-5xl px-3 sm:px-4 mt-4 text-sm text-neutral-400";
      const content = document.getElementById("content");
      content?.parentNode?.insertBefore(emptyBanner, content.nextSibling);
    }
    let matches = 0;

    sections.forEach((sec) => {
      const heading = sec.querySelector(".h-cat")?.textContent || "";
      const rows = Array.from(sec.querySelectorAll(".item-row"));
      if (!q) {
        sec.style.display = "";
        rows.forEach((row) => (row.style.display = ""));
        // restaurar márgenes por si fueron modificados
        sec.style.marginTop = "";
        return;
      }
      const headingMatch = norm(heading).includes(q);
      let sectionMatch = false;
      rows.forEach((row) => {
        const cache =
          row.dataset.searchText ||
          (row.dataset.searchText = norm(row.textContent));
        const match = headingMatch || cache.includes(q);
        row.style.display = match ? "" : "none";
        if (match) sectionMatch = true;
      });
      sec.style.display = sectionMatch ? "" : "none";
      if (sectionMatch) matches++;
    });

    // corregir salto visual: quitar margen superior al primer bloque visible
    if (q) {
      const visible = sections.filter((sec) => sec.style.display !== "none");
      visible.forEach((sec, idx) => {
        if (idx === 0) sec.style.marginTop = "0px";
        else sec.style.marginTop = "";
      });
    }

    if (emptyBanner) {
      if (!q) {
        // status.textContent = "";
        // status.classList.add("hidden");
        if (emptyBanner) emptyBanner.classList.add("hidden");
      } else if (!matches) {
        // status.textContent = `Sin resultados para “${raw}”.`;
        // status.classList.remove("hidden");
        if (emptyBanner) {
          emptyBanner.textContent = `No encontramos coincidencias con “${raw}”. Prueba con otro término o revisa las categorías.`;
          emptyBanner.classList.remove("hidden");
        }
      } else {
        // status.textContent = "";
        // status.classList.add("hidden");
        if (emptyBanner) emptyBanner.classList.add("hidden");
      }
    }
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
    ensureSearchOverlay();
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
    $("#search")?.addEventListener("input", () => {
      ensureSearchOverlay();
      if ($("#searchUnified"))
        $("#searchUnified").value = $("#search").value || "";
      applySearch();
    });
    $("#searchUnified")?.addEventListener("input", applySearch);
    $("#clearSearch")?.addEventListener("click", () => closeSearchPanel(true));
    document.addEventListener("click", (ev) => {
      const p = ev.target.closest("#searchPanel");
      const trigger =
        ev.target.closest("#openSearch") || ev.target.closest("#search");
      // cerrar y limpiar si se hace click fuera
      if (!p && !trigger) closeSearchPanel(true);
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
    // renderHeaderBrand,
    groupByCategory,
    buildTabs,
    buildCatMenus,
    buildSections,
    mountScrollSpy,
    wireEvents,
    applySearch,
    smoothScrollTo,
    calcOffset,
  };
})();
