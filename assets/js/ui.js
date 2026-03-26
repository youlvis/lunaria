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
  const getScrollY = () =>
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;
  const MENU_HISTORY_KEY = "__menuView";

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
        closeOverlay();
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
    $(id)?.classList.remove("hidden");
  }

  function closeOverlay() {
    if (DOM.catMenuOverlay) DOM.catMenuOverlay.classList.add("hidden");
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
      closeDetail();
    });
    addPress(document.querySelector('#detailModal [data-close="modal"]'), (ev) => {
      ev.stopPropagation();
      closeDetail();
    });

    document.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-detail]");
      if (!b) return;
      openDetail(b.getAttribute("data-detail"), { history: "push" });
    }, { passive: true });

    initMenuHistory();
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
