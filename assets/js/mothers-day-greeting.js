/**
 * mothers-day-greeting.js
 * Shows a bievenida image animation when the preloader hides,
 * during the Mother's Day window (May 8–12).
 */
(function () {
  'use strict';

  var DATE_WINDOW = { month: 4, dayStart: 8, dayEnd: 12 };
  var ANIM_DURATION_MS = 5200;
  var REDUCED_DISPLAY_MS = 1000;

  function isWithinDateWindow() {
    var now = new Date();
    return (
      now.getMonth() === DATE_WINDOW.month &&
      now.getDate() >= DATE_WINDOW.dayStart &&
      now.getDate() <= DATE_WINDOW.dayEnd
    );
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function showGreeting() {
    var overlay = document.createElement('div');
    overlay.className = 'mdm-img-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    var img = document.createElement('img');
    img.src = 'assets/img/bievenida.svg';
    img.className = 'mdm-img-overlay__img';
    img.alt = '';
    img.setAttribute('draggable', 'false');

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    var dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (overlay.parentNode) overlay.remove();
    }

    overlay.addEventListener('click', dismiss, { once: true });
    overlay.addEventListener('touchend', dismiss, { once: true });

    if (prefersReducedMotion()) {
      overlay.classList.add('mdm-img-overlay--reduced');
      setTimeout(dismiss, REDUCED_DISPLAY_MS);
      return;
    }

    overlay.classList.add('mdm-img-overlay--animated');
    img.addEventListener('animationend', dismiss, { once: true });
    // Fallback in case animationend doesn't fire
    setTimeout(dismiss, ANIM_DURATION_MS + 500);
  }

  function init() {
    if (!isWithinDateWindow()) return;

    var preloader = document.getElementById('preloader');

    if (!preloader) {
      setTimeout(showGreeting, 300);
      return;
    }

    // If preloader is already hidden, show greeting immediately
    if (preloader.classList.contains('hidden')) {
      setTimeout(showGreeting, 300);
      return;
    }

    // Watch for the preloader being hidden
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (
          m.type === 'attributes' &&
          m.attributeName === 'class' &&
          preloader.classList.contains('hidden')
        ) {
          observer.disconnect();
          setTimeout(showGreeting, 300);
          return;
        }
      }
    });

    observer.observe(preloader, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
