(async function init() {
  const hidePreloader = () => document.getElementById('preloader')?.classList.add('hidden');
  try {
    UI.calcOffset();
    const data = await fetchMenu();
    Store.state.items = (data.items || []).filter(i => i && i.nombre);
    Store.state.cfg = data.config || {};

    // UI.renderHeaderBrand(Store.state.cfg);

    const grouped = UI.groupByCategory(Store.state.items);
    UI.buildTabs(grouped.cats);
    UI.buildCatMenus(grouped.cats);
    UI.buildSections(grouped);
    UI.mountScrollSpy(grouped.cats);
    UI.wireEvents();
    UI.applySearch();

  } catch (e) {
    console.error(e);
    alert('No se pudo cargar el menú. Reintenta en unos segundos.');
  } finally {
    hidePreloader();
  }
})();
