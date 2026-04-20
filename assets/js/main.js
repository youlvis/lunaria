// Banner de eventos
const EventoBanner = (() => {
  const BANNER_ACTIVE = false; // Cambiar a true para activar el banner
  const BANNER_DELAY = 2000; // Mostrar después de 2 segundos

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
  const hidePreloader = () => document.getElementById('preloader')?.classList.add('hidden');
  try {
    UI.initDOM();
    UI.calcOffset();
    const data = await fetchMenu();
    Store.state.items = (data.items || []).filter(i => i && i.nombre);
    Store.state.cfg = data.config || {};

    const grouped = UI.groupByCategory(Store.state.items);
    UI.buildTabs(grouped.cats);
    UI.buildCatMenus(grouped.cats);
    UI.buildSections(grouped);
    UI.mountScrollSpy(grouped.cats);
    UI.wireEvents();
    UI.applySearch();
    UI.initLastOrderFeature();
    
    // Inicializar banner de eventos
    EventoBanner.init();
  } catch (e) {
    console.error(e);
    alert('No se pudo cargar el menú. Reintenta en unos segundos.');
  } finally {
    hidePreloader();
  }
})();
