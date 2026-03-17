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
    closeDetail: null,
    currentCat: null,
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
    DOM.closeDetail = document.getElementById("closeDetail");
    DOM.currentCat = document.getElementById("currentCat");
  };

  const $ = (s) => document.querySelector(s);
  const hide = (el) => el?.classList.add("hidden");
  const show = (el) => el?.classList.remove("hidden");
  const toggleHidden = (el, force) => el?.classList.toggle("hidden", force);
  const getContent = () => DOM.content;
  const getSections = () => DOM.content ? Array.from(DOM.content.querySelectorAll(".menu__section")) : [];

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
      b.onclick = () => goToCategory(b.dataset.target, "auto");
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
        closeOverlay();
        goToCategory(`#sec-${slug(c)}`, "auto");
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

  function rowItem(it) {
    const hasDesc = Boolean(it.descripcion && String(it.descripcion).trim().length);
    const div = document.createElement("div");
    div.className = "menu-item";
    div.setAttribute("data-detail", it.id);
    const titleNorm = norm(it.nombre || "");
    const textNorm = norm(`${it.nombre || ""} ${it.descripcion || ""}`);
    div.dataset.searchTitle = titleNorm;
    div.dataset.searchText = textNorm;
    const thumb = cloudi(it.foto, 240);
    const thumb2x = cloudi(it.foto, 480);
    div.innerHTML = `<div class="menu-item__thumb" data-detail="${it.id}"><img loading="lazy" decoding="async" fetchpriority="low" width="160" height="160" src="${thumb || ""}" srcset="${thumb || ""} 1x, ${thumb2x || thumb || ""} 2x" sizes="(max-width: 640px) 160px, 180px" alt="${it.nombre || ""}"></div><div class="menu-item__body"><div class="menu-item__title">${it.nombre || ""}</div>${hasDesc ? `<p class="menu-item__desc">${it.descripcion || ""}</p>` : ""}<div class="menu-item__price">$${Store.fmt(it.precio || 0)}</div></div>`;
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

  let lastDetail = { id: null, scrollY: 0 };

  function openDetail(id) {
    if (DOM.detailModal && !DOM.detailModal.classList.contains("hidden")) {
      if (lastDetail.id === id) return;
    }
    const it = Store.state.items.find((x) => String(x.id) === String(id));
    if (!it) return;
    lastDetail = {
      id,
      search: getSearchState(),
      scrollY: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
    };

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
    toggleDetail(true);
  }

  function toggleDetail(open) {
    if (DOM.detailModal) DOM.detailModal.classList.toggle("hidden", !open);
    document.body.classList.toggle("detail-open", open);
    if (!open) {
      if (lastDetail.search) {
        const { isOpen, query } = lastDetail.search;
        syncSearchInputs(query || "");
        setSearchUI(isOpen);
        if (query) applySearch();
      }
      window.scrollTo({ top: lastDetail.scrollY, behavior: "auto" });
    }
  }

  function openOverlay(id) {
    $(id)?.classList.remove("hidden");
  }

  function closeOverlay() {
    if (DOM.catMenuOverlay) DOM.catMenuOverlay.classList.add("hidden");
  }

  function mountScrollSpy(cats) {
    const sections = cats.map((c) => document.querySelector(`#sec-${slug(c)}`)).filter(Boolean);
    if (!sections.length) return;

    const updateActiveFromScroll = () => {
      if (programmaticNav) return;
      if (updateActiveFromScroll.ticking) return;
      updateActiveFromScroll.ticking = true;
      requestAnimationFrame(() => {
        updateActiveFromScroll.ticking = false;
        const off = calcOffset();
        const viewportTop = off + 8;
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

    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", () => {
      calcOffset();
      updateActiveFromScroll();
      const active = DOM.catTabs?.querySelector(".is-active");
      if (active) ensureTabVisible(active, "auto");
    }, { passive: true });

    updateActiveFromScroll();
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

  function setActiveBySectionId(id, behavior = "smooth") {
    const btn = DOM.catTabs?.querySelector(`button[data-target="#${id}"]`);
    if (!btn) return;
    DOM.catTabs?.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    ensureTabVisible(btn, behavior);
    const label = id.replace("sec-", "");
    const pretty = label.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    if (DOM.currentCat) DOM.currentCat.textContent = pretty;
  }

  function goToCategory(selector, behavior = "auto") {
    const el = document.querySelector(selector);
    if (!el) return;
    programmaticNav = true;
    const off = calcOffset();
    const y = el.getBoundingClientRect().top + window.pageYOffset - off - 8;
    window.scrollTo({ top: y, behavior });
    setActiveBySectionId(el.id, "auto");
    setTimeout(() => { programmaticNav = false; }, 120);
  }

  function wireEvents() {
    DOM.openCatMenu?.addEventListener("click", () => {
      openOverlay("#catMenuOverlay");
      const activeText = DOM.catTabs?.querySelector(".is-active")?.textContent?.trim();
      const list = DOM.catMenu;
      if (list && activeText) {
        const btn = Array.from(list.querySelectorAll("button")).find((b) => b.textContent.trim() === activeText);
        btn?.scrollIntoView({ block: "center", behavior: "auto" });
      }
    });

    document.querySelectorAll('#catMenuOverlay [data-close="overlay"]').forEach((e) => {
      if (e.classList.contains("overlay__container")) {
        const closeIfSelf = (ev) => { if (ev.target === e) closeOverlay(); };
        e.addEventListener("click", closeIfSelf);
        e.addEventListener("touchend", (ev) => {
          if (ev.target === e) { ev.preventDefault(); closeOverlay(); }
        }, { passive: false });
      } else {
        addPress(e, closeOverlay);
      }
    });

    addPress(DOM.openSearch, openSearchPanel);
    const debouncedSearch = debounce(applySearch, 400);
    withCompositionGuard(DOM.searchUnified, debouncedSearch);
    addPress(DOM.clearSearch, () => closeSearchPanel(true));

    document.addEventListener("click", (ev) => {
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
      if (ev.key === "Escape") closeSearchPanel(true);
    });

    addPress(DOM.closeDetail, (ev) => {
      ev.stopPropagation();
      toggleDetail(false);
    });
    addPress(document.querySelector('#detailModal [data-close="modal"]'), (ev) => {
      ev.stopPropagation();
      toggleDetail(false);
    });

    document.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-detail]");
      if (!b) return;
      openDetail(b.getAttribute("data-detail"));
    }, { passive: true });
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
  };
})();
