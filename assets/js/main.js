// Banner de eventos
const EventoBanner = (() => {
  const BANNER_ACTIVE = false; // Cambiar a true para activar el banner
  const BANNER_DELAY = 3000; // Mostrar después de 3 segundos

  const close = (el) => {
    if (el) {
      el.classList.add('hidden');
      // Restaurar el display inline para que renderOrderCta pueda controlar la visibilidad
      const viewOrderBtn = document.getElementById('viewOrderCta');
      if (viewOrderBtn) {
        viewOrderBtn.style.display = '';
      }
    }
  };

  const init = () => {
    if (!BANNER_ACTIVE) return;
    const banner = document.getElementById('eventoBanner');
    if (!banner) return;

    const backdrop = banner.querySelector('[data-close="eventoBanner"]');
    const closeBtn = document.getElementById('closeEventoBanner');

    // Event listeners para cerrar
    if (backdrop) {
      backdrop.addEventListener('click', () => close(banner));
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => close(banner));
    }

    // Mostrar banner después del delay
    setTimeout(() => {
      banner.classList.remove('hidden');
      // Ocultar el botón de "ver pedido" mientras el banner está visible
      const viewOrderBtn = document.getElementById('viewOrderCta');
      if (viewOrderBtn) {
        viewOrderBtn.style.display = 'none';
      }
    }, BANNER_DELAY);
  };

  return { init };
})();

(async function init() {
  const preloader = document.getElementById('preloader');
  const hidePreloader = () => preloader?.classList.add('hidden');

  const showError = () => {
    if (!preloader) return;
    preloader.innerHTML = `
      <div class="preloader__box">
        <p class="preloader__text">No se pudo cargar el menú.</p>
        <button class="preloader__retry" onclick="location.reload()">Reintentar</button>
      </div>`;
  };

  try {
    UI.initDOM();
    UI.calcOffset();
    const data = await fetchMenu();
    Store.state.items = (data.items || []).filter(i => i && i.nombre);
    Store.state.cfg = data.config || {};

    // Si el resultado tiene 0 ítems, tratar como error para mostrar el botón de reintento
    if (!Store.state.items.length) throw new Error('empty_menu');

    const grouped = UI.groupByCategory(Store.state.items);
    UI.buildTabs(grouped.cats);
    UI.buildCatMenus(grouped.cats);
    UI.buildSections(grouped);
    BreathingCards.init();
    UI.mountScrollSpy(grouped.cats);
    UI.wireEvents();
    UI.applySearch();
    UI.initLastOrderFeature();
    
    // Inicializar banner de eventos
    EventoBanner.init();
    hidePreloader();
  } catch (e) {
    console.error(e);
    showError();
  }
})();
