/**
 * HeartsAnimation — Día de la Madre 💗
 *
 * Performance contract:
 *  - Only `transform: translate3d()` + `opacity` animated (compositor-only)
 *  - `will-change: transform, opacity` scoped to each heart element
 *  - `pointer-events: none` container → zero UI interference
 *  - Single DOM insertion via DocumentFragment → one reflow
 *  - No requestAnimationFrame needed; pure CSS drives the loop
 *  - Respects prefers-reduced-motion as first guard
 */
const HeartsAnimation = (() => {
  // ── Active date window ───────────────────────────────────────────────────
  // Mother's Day in Colombia = second Sunday of May.
  // Window: May 8–12 to cover the full celebration period.
  const ACTIVE = { month: 4, dayStart: 8, dayEnd: 12 }; // month is 0-indexed

  // ── Heart shape (inline SVG — no external request) ──────────────────────
  const HEART_SVG =
    '<svg viewBox="0 0 20 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<path d="M10 17S1 11 1 5a4 4 0 0 1 9-1h0a4 4 0 0 1 9 1c0 6-9 12-9 12Z"/>' +
    '</svg>';

  // ── Guards ───────────────────────────────────────────────────────────────

  /**
   * Returns true only within the Mother's Day window.
   * All other dates: animation is completely absent from the page.
   */
  const isWithinDateWindow = () => {
    const now = new Date();
    return (
      now.getMonth() === ACTIVE.month &&
      now.getDate() >= ACTIVE.dayStart &&
      now.getDate() <= ACTIVE.dayEnd
    );
  };

  /** Returns true if the user prefers reduced motion. */
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Device performance tier ──────────────────────────────────────────────
  /**
   * Heuristic-based heart count.
   * Checks hardware concurrency, device memory and network quality
   * to avoid overloading low-end devices.
   */
  const resolveHeartCount = () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Low-end signals: ≤2 cores or ≤1 GB RAM or slow network
    const cores = navigator.hardwareConcurrency || 4;
    const mem   = navigator.deviceMemory || 4; // GB (not available in all browsers, defaults to 4)
    const conn  = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const slowNet = conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g');

    const isLowEnd = cores <= 2 || mem <= 1 || slowNet;

    if (isLowEnd) return 4;
    if (isMobile)  return randInt(5, 8);   // 5–8 on mobile
    return randInt(12, 15);                // 12–15 on desktop
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const rand    = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));

  // ── Element factories ────────────────────────────────────────────────────
  /**
   * Creates a steady rain heart (infinite loop, falls from top).
   */
  const createHeart = () => {
    const el = document.createElement('div');
    el.className = 'lnr-heart';
    el.innerHTML = HEART_SVG;
    el.setAttribute('aria-hidden', 'true');

    const size        = rand(14, 26);         // px — slightly larger for visibility
    const left        = rand(2, 97);          // % horizontal start
    const duration    = rand(10, 18);         // s — slow, dreamy fall
    const delay       = rand(0, 14);          // s — staggered start (negative → mid-flight on load)
    const baseOpacity = rand(0.48, 0.72);     // more visible, still elegant
    const swayX       = rand(-20, 20);        // px — gentle horizontal drift at end

    el.style.cssText =
      'left:' + left + '%;' +
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'animation-duration:' + duration + 's;' +
      'animation-delay:-' + delay + 's;' +
      '--base-opacity:' + baseOpacity + ';' +
      '--sway:' + swayX + 'px;';

    return el;
  };

  /**
   * Creates a burst heart: appears somewhere on screen, floats upward
   * and fades out once. Removed from DOM on animationend → no memory leak.
   */
  const createBurstHeart = () => {
    const el = document.createElement('div');
    el.className = 'lnr-heart lnr-heart--burst';
    el.innerHTML = HEART_SVG;
    el.setAttribute('aria-hidden', 'true');

    const size        = rand(16, 34);         // burst hearts a bit bigger
    const left        = rand(4, 95);          // spread across full width
    const top         = rand(25, 82);         // start in mid-screen area
    const duration    = rand(1.6, 3.0);       // fast: explode and vanish
    const delay       = rand(0, 0.7);         // slight stagger so they don't all pop at once
    const baseOpacity = rand(0.65, 0.90);     // vivid for the burst moment
    const swayX       = rand(-50, 50);        // wider spread on burst

    el.style.cssText =
      'left:' + left + '%;' +
      'top:' + top + 'vh;' +
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'animation-duration:' + duration + 's;' +
      'animation-delay:' + delay + 's;' +
      '--base-opacity:' + baseOpacity + ';' +
      '--sway:' + swayX + 'px;';

    // Self-clean: remove from DOM once animation ends → no orphan elements
    el.addEventListener('animationend', () => el.remove(), { once: true });

    return el;
  };

  // ── Device tier (shared between phases) ─────────────────────────────────
  const deviceTier = () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const cores    = navigator.hardwareConcurrency || 4;
    const mem      = navigator.deviceMemory || 4;
    const conn     = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const slowNet  = conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g');
    return { isMobile, isLowEnd: cores <= 2 || mem <= 1 || slowNet };
  };

  // ── Burst trigger (called once when preloader hides) ─────────────────────
  const triggerBurst = (container) => {
    const { isMobile, isLowEnd } = deviceTier();
    const burstCount = isLowEnd ? 6 : isMobile ? randInt(10, 14) : randInt(22, 28);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < burstCount; i++) {
      frag.appendChild(createBurstHeart());
    }
    container.appendChild(frag);
  };

  // ── Init ─────────────────────────────────────────────────────────────────
  const init = () => {
    // Guard 1: only active during Mother's Day window
    if (!isWithinDateWindow()) return;

    // Guard 2: respect user's accessibility preference
    if (prefersReducedMotion()) return;

    const container = document.getElementById('hearts-container');
    if (!container) return;

    // ── Phase 1: Rain hearts only ─────────────────────────────────────────
    // Raise z-index above the preloader (z-index: 50) so hearts are
    // visible while the menu is loading. JS resets this to 1 on burst.
    container.style.zIndex = '55';

    const count    = resolveHeartCount();
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      fragment.appendChild(createHeart());
    }
    // Single DOM write → single reflow
    container.appendChild(fragment);
    container.removeAttribute('hidden');

    // ── Phase 2: Burst when preloader disappears ──────────────────────────
    // MutationObserver watches for the 'hidden' class being added to
    // #preloader. Self-disconnects after firing once → zero ongoing cost.
    const preloader = document.getElementById('preloader');
    if (!preloader) {
      // No preloader in DOM — fire burst immediately
      triggerBurst(container);
      return;
    }

    // If preloader is already hidden (e.g. service worker cache hit), burst now
    if (preloader.classList.contains('hidden')) {
      triggerBurst(container);
      return;
    }

    const observer = new MutationObserver(() => {
      if (preloader.classList.contains('hidden')) {
        observer.disconnect();
        triggerBurst(container);
      }
    });
    observer.observe(preloader, { attributes: true, attributeFilter: ['class'] });
  };

  return { init };
})();

// Auto-init: works whether script is loaded sync or deferred
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', HeartsAnimation.init);
} else {
  HeartsAnimation.init();
}
