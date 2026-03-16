/* ui.js */
const UI = (() => {
  // ---------- Helpers ----------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const hide = (el) => el?.classList.add("hidden");
  const show = (el) => el?.classList.remove("hidden");
  const toggleHidden = (el, force) => el?.classList.toggle("hidden", force);
  const getContent = () => document.getElementById("content");
  const getSections = () =>
    Array.from(document.querySelectorAll("#content .menu__section"));
  const getSearchState = () => {
    const query = ($("#searchUnified")?.value || $("#search")?.value || "").trim();
    const panel = $("#searchPanel");
    return {
      isOpen: panel ? !panel.classList.contains("hidden") : false,
      query,
    };
  };
  const setSearchUI = (open) => {
    if (open) {
      show($("#searchPanel"));
      hide(document.getElementById("catTabs"));
      hide(document.getElementById("optionsBar"));
      $("#searchUnified")?.focus();
    } else {
      hide($("#searchPanel"));
      show(document.getElementById("catTabs"));
      show(document.getElementById("optionsBar"));
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
    const transform = `c_fill,f_auto,q_auto,w_${w}`;
    return `${parts[0]}/upload/${transform}/${parts[1]}`;
  };
  const debounce = (fn, wait = 100) => {
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
      if (composing) return;
      handler();
    });
  };
  const addPress = (el, handler) => {
    if (!el) return;
    el.addEventListener("click", handler);
    el.addEventListener(
      "touchend",
      (ev) => {
        ev.preventDefault();
        handler(ev);
      },
      { passive: false },
    );
  };

  // ---------- Agrupar por categoría respetando el orden del sheet ----------
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
      b.className = "category-tabs__item";
      b.dataset.target = `#sec-${slug(c)}`;
      b.textContent = c;
      if (idx === 0) b.classList.add("is-active");
      b.onclick = () => goToCategory(b.dataset.target, "auto");
      wrap.appendChild(b);
    });
  }

  function buildCatMenus(cats) {
    const menu = $("#catMenu");
    if (menu) menu.innerHTML = "";
    const menuDesk = $("#catMenuDesk");
    if (menuDesk) menuDesk.innerHTML = "";

    cats.forEach((c) => {
      const makeBtn = () => {
        const btn = document.createElement("button");
        btn.className = "overlay__item";
        btn.textContent = c;
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
    const cont = getContent();
    if (!cont) return;
    cont.innerHTML = "";

    cats.forEach((c) => {
      const sec = document.createElement("section");
      sec.id = `sec-${slug(c)}`;
      sec.className = "menu__section";
      sec.innerHTML = `
        <h2 class="menu__section-title">${c}</h2>
        <div class="menu__list" id="list-${slug(c)}"></div>
      `;
      cont.appendChild(sec);

      const list = sec.querySelector(`#list-${slug(c)}`);
      (map[c] || []).forEach((it) => list.appendChild(rowItem(it)));
    });
  }

  // ---------- Fila compacta ----------
  function rowItem(it) {
    const hasDesc = Boolean(
      it.descripcion && String(it.descripcion).trim().length,
    );
    const div = document.createElement("div");
    div.className = "menu-item";
    div.setAttribute("data-detail", it.id);
    const titleNorm = norm(it.nombre || "");
    const textNorm = norm(`${it.nombre || ""} ${it.descripcion || ""}`);
    div.dataset.searchTitle = titleNorm;
    div.dataset.searchText = textNorm;
    const thumb = cloudi(it.foto, 240);
    const thumb2x = cloudi(it.foto, 480);
    div.innerHTML = `
      <div class="menu-item__thumb" data-detail="${it.id}">
        <img loading="lazy" decoding="async" fetchpriority="low" width="160" height="160"
          src="${thumb || ""}"
          srcset="${thumb || ""} 1x, ${thumb2x || thumb || ""} 2x"
          sizes="(max-width: 640px) 160px, 180px"
          alt="${it.nombre || ""}">
      </div>
      <div class="menu-item__body">
        <div class="menu-item__title">${it.nombre || ""}</div>
        ${
          hasDesc
            ? `<p class="menu-item__desc">${it.descripcion || ""}</p>`
            : ``
        }
        <div class="menu-item__price">$${Store.fmt(it.precio || 0)}</div>
      </div>
    `;
    return div;
  }

  // ---------- Buscador unificado ----------
  function ensureSearchOverlay() {
    const panel = $("#searchPanel");
    if (!panel) return;
    panel.dataset.simple = "true"; // ya está maquetado en HTML
  }

  const syncSearchInputs = (
    value = "",
    { skipUnified = false, skipDesktop = false } = {},
  ) => {
    if (!skipDesktop && $("#search")) $("#search").value = value;
    if (!skipUnified && $("#searchUnified")) $("#searchUnified").value = value;
  };

  function openSearchPanel() {
    ensureSearchOverlay();
    syncSearchInputs($("#search")?.value || "");
    setSearchUI(true);
  }

  function closeSearchPanel(clear = true) {
    const hadQuery = Boolean(
      ($("#searchUnified")?.value || $("#search")?.value || "").trim()
    );
    setSearchUI(false);
    if (clear) syncSearchInputs("");
    // Solo recalcular si había texto o si no estaba oculto
    if (hadQuery || !$("#searchPanel")?.classList.contains("hidden")) {
      applySearch();
    }
  }

  const ensureEmptyBanner = () => {
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
      const rows = Array.from(sec.querySelectorAll(".menu-item"));
      rows.forEach((row, idx) => {
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
        rows
          .slice()
          .sort(
            (a, b) =>
              Number(a.dataset.orderIndex || 0) -
              Number(b.dataset.orderIndex || 0),
          )
          .forEach((row) => parent.appendChild(row));
      }
    });

    if (container) {
      sections
        .slice()
        .sort(
          (a, b) =>
            Number(a.dataset.sectionIndex || 0) -
            Number(b.dataset.sectionIndex || 0),
        )
        .forEach((sec) => container.appendChild(sec));
    }
  };

  // Buscador con prioridad por nombre del plato
  function applySearch() {
    ensureSearchOverlay();
    const raw = (
      $("#searchUnified")?.value ||
      $("#search")?.value ||
      ""
    ).trim();
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
      const heading =
        sec.querySelector(".menu__section-title")?.textContent || "";
      const headingMatch = norm(heading).includes(q);
      const rows = Array.from(sec.querySelectorAll(".menu-item"));

      let sectionMatch = false;
      let sectionScore = 0;

      rows.forEach((row) => {
        const titleText = row.dataset.searchTitle || "";
        const fullText = row.dataset.searchText || "";

        let score = 0;
        if (titleText.includes(q))
          score = 3; // nombre del plato
        else if (fullText.includes(q))
          score = 2; // descripción / ingredientes
        else if (headingMatch) score = 1; // solo por categoría

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
          rows
            .filter((row) => row.style.display !== "none")
            .sort((a, b) => {
              const sa = Number(a.dataset.searchScore || 0);
              const sb = Number(b.dataset.searchScore || 0);
              if (sa !== sb) return sb - sa; // primero mayor score (nombre)
              return (
                Number(a.dataset.orderIndex || 0) -
                Number(b.dataset.orderIndex || 0)
              );
            })
            .forEach((row) => parent.appendChild(row));
        }
        matches++;
      }
    });

    // Reordenar secciones según mejor coincidencia
    const visibleSections = sections.filter(
      (sec) => sec.style.display !== "none",
    );
    visibleSections
      .sort((a, b) => {
        const sa = Number(a.dataset.searchScore || 0);
        const sb = Number(b.dataset.searchScore || 0);
        if (sa !== sb) return sb - sa;
        return (
          Number(a.dataset.sectionIndex || 0) -
          Number(b.dataset.sectionIndex || 0)
        );
      })
      .forEach((sec, idx) => {
        container.appendChild(sec);
        sec.style.marginTop = idx === 0 ? "0px" : "";
      });

    if (!matches) {
      emptyBanner.textContent = `No encontramos coincidencias con "${raw}". Prueba con otro término o revisa las categorías.`;
      show(emptyBanner);
    } else {
      hide(emptyBanner);
    }
  }

  // ---------- Modal ----------
  let lastDetail = { id: null, scrollY: 0 };

  const scrollToItem = (id) => {
    if (!id) return false;
    const target = document.querySelector(`[data-detail="${id}"]`);
    if (!target) return false;
    const sec = target.closest(".menu__section");
    const off = calcOffset();
    const y = target.getBoundingClientRect().top + window.pageYOffset - off - 8;
    programmaticNav = true;
    window.scrollTo({ top: y, behavior: "auto" });
    if (sec) setActiveBySectionId(sec.id, "auto");
    setTimeout(() => {
      programmaticNav = false;
    }, 160);
    return true;
  };

  function openDetail(id) {
    if ($("#detailModal") && !$("#detailModal")?.classList.contains("hidden")) {
      // ya hay un detalle abierto; evitar reprocesar
      if (lastDetail.id === id) return;
    }
    const it = Store.state.items.find((x) => String(x.id) === String(id));
    if (!it) return;
    lastDetail = {
      id,
      search: getSearchState(),
      scrollY:
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0,
    };
    if ($("#detailImg")) $("#detailImg").src = it.foto || "";
    if ($("#detailImg")) {
      const full = cloudi(it.foto, 960);
      const full2x = cloudi(it.foto, 1400);
      $("#detailImg").src = full || it.foto || "";
      $("#detailImg").srcset = `${full || it.foto || ""} 1x, ${full2x || full || it.foto || ""} 2x`;
      $("#detailImg").decoding = "async";
      $("#detailImg").loading = "lazy";
    }
    if ($("#detailName")) $("#detailName").textContent = it.nombre || "";
    if ($("#detailDesc")) $("#detailDesc").textContent = it.descripcion || "";
    if ($("#detailPrice"))
      $("#detailPrice").textContent = Store.fmt(it.precio || 0);
    toggleDetail(true);
  }
  function toggleDetail(open) {
    $("#detailModal")?.classList.toggle("hidden", !open);
    document.body.classList.toggle("detail-open", open);
    if (!open && typeof window !== "undefined") {
      if (lastDetail.search) {
        const { isOpen, query } = lastDetail.search;
        syncSearchInputs(query || "");
        setSearchUI(isOpen);
        if (query) applySearch();
      }
      window.scrollTo({ top: lastDetail.scrollY, behavior: "auto" });
    }
  }

  // ---------- Overlays ----------
  function openOverlay(id) {
    $(id)?.classList.remove("hidden");
  }
  function closeOverlay() {
    $("#catMenuOverlay")?.classList.add("hidden");
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
    if (!sections.length) return;

    const updateActiveFromScroll = () => {
      if (programmaticNav) return;
      if (updateActiveFromScroll.ticking) return;
      updateActiveFromScroll.ticking = true;
      requestAnimationFrame(() => {
        updateActiveFromScroll.ticking = false;
      const off = calcOffset();
      const viewportTop = off + 8; // mismo offset que goToCategory/smoothScrollTo

      let current = sections[0];
      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top - viewportTop <= 0) {
          current = sec;
        } else {
          break;
        }
      }

      if (current) setActiveBySectionId(current.id, "smooth");
      });
    };

    window.addEventListener("scroll", updateActiveFromScroll, {
      passive: true,
    });

    window.addEventListener(
      "resize",
      () => {
        calcOffset();
        updateActiveFromScroll();
        const active = $("#catTabs .is-active");
        if (active) ensureTabVisible(active, "auto");
      },
      { passive: true },
    );

    // estado inicial
    updateActiveFromScroll();
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
    $$("#catTabs button").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
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
      const activeText = $("#catTabs .is-active")?.textContent?.trim();
      const list = $("#catMenu");
      if (list && activeText) {
        const btn = Array.from(list.querySelectorAll("button")).find(
          (b) => b.textContent.trim() === activeText,
        );
        btn?.scrollIntoView({ block: "center", behavior: "auto" });
      }
    });

    $("#openCatMenuDesk")?.addEventListener("click", openCatDesk);
    $$('#catMenuOverlay [data-close="overlay"]').forEach((e) =>
      addPress(e, closeOverlay),
    );

    // search mejorado
    addPress($("#openSearch"), openSearchPanel);
    const debouncedSearch = debounce(applySearch, 280);
    withCompositionGuard($("#search"), () => {
      ensureSearchOverlay();
      syncSearchInputs($("#search")?.value || "", { skipDesktop: true });
      debouncedSearch();
    });
    withCompositionGuard($("#searchUnified"), () => {
      syncSearchInputs($("#searchUnified")?.value || "", { skipUnified: true });
      debouncedSearch();
    });
    addPress($("#clearSearch"), () => closeSearchPanel(true));
    document.addEventListener("click", (ev) => {
      // no tocar el buscador mientras el modal de detalle está abierto
      if (document.body.classList.contains("detail-open")) return;
      // si el click fue dentro del modal (ya cerrado por backdrop/botón) no cerrar el search
      if (ev.target.closest("#detailModal")) return;
      const panelOpen = !$("#searchPanel")?.classList.contains("hidden");
      if (!panelOpen) return;
      const inPanel = ev.target.closest("#searchPanel");
      const isTrigger =
        ev.target.closest("#openSearch") || ev.target.closest("#search");
      const isResult = ev.target.closest("[data-detail]") || ev.target.closest(".menu-item");
      if (!inPanel && !isTrigger && !isResult) closeSearchPanel(true);
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeSearchPanel(true);
    });

    // modal
    addPress($("#closeDetail"), (ev) => {
      ev.stopPropagation();
      toggleDetail(false);
    });
    addPress($('#detailModal [data-close="modal"]'), (ev) => {
      ev.stopPropagation();
      toggleDetail(false);
    });

    document.addEventListener(
      "click",
      (ev) => {
        const b = ev.target.closest("[data-detail]");
        if (!b) return;
        openDetail(b.getAttribute("data-detail"));
      },
      { passive: true },
    );
  }

  // ---------- API pública ----------
  return {
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
