/**
 * BreathingCards — Micro-pulso para cards promocionales.
 *
 * Optimizaciones de performance:
 *  - Anima SOLO `transform` + `box-shadow` (sin layout recalculation).
 *  - Keyframes CSS nativos: cero JS timers durante la animación.
 *  - La pausa entre pulsos está integrada en el ciclo CSS (87% espera / 13% pulso).
 *  - Un único IntersectionObserver compartido → la animación solo corre
 *    mientras la card es visible en pantalla.
 *  - Stagger via `animation-delay` negativo → las cards pulsan en fases distintas
 *    sin setInterval ni timers adicionales.
 *  - `will-change: transform` aplicado solo en el estado activo (clase `.lnr-breathing`),
 *    nunca de forma permanente, para no desperdiciar memoria de compositor.
 *  - Respeta `prefers-reduced-motion` como primera guarda.
 */
const BreathingCards = (() => {
  'use strict';

  // ID de la lista donde viven los platos promocionales.
  // Derivado de slug("Promo del Día") → "list-promo-del-dia"
  var PROMO_LIST_ID = 'list-promo-del-dia';

  // Duración total del ciclo CSS en ms.
  // Coincidir con la animation-duration declarada en styles.css.
  var CYCLE_MS = 2000;

  function init() {
    // Guarda 1: respetar preferencia de accesibilidad del usuario.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var list = document.getElementById(PROMO_LIST_ID);
    if (!list) return;

    var cards = Array.from(list.querySelectorAll('.menu-item'));
    if (!cards.length) return;

    // Repartir las cards uniformemente a lo largo del ciclo con delay negativo.
    // Delay negativo = la animación "ya lleva" N ms corriendo al montarse,
    // poniendo cada card en una fase distinta del ciclo sin ningún timer extra.
    var phaseStep = CYCLE_MS / cards.length;

    cards.forEach(function (card, i) {
      card.classList.add('menu-item--promo');
      card.style.animationDelay = '-' + ((phaseStep * i) / 1000).toFixed(2) + 's';
    });

    // Un único IntersectionObserver para todas las cards.
    // threshold 0.15 = al menos el 15 % de la card debe ser visible
    // antes de activar la animación.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Card visible → reanudar / iniciar animación en GPU.
          entry.target.classList.add('lnr-breathing');
        } else {
          // Card fuera del viewport → congelar, liberar compositor.
          entry.target.classList.remove('lnr-breathing');
        }
      });
    }, { threshold: 0.15 });

    cards.forEach(function (card) { io.observe(card); });
  }

  return { init: init };
})();
