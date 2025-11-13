async function fetchMenu() {
    const r = await fetch(ENDPOINT, { cache: 'no-store' });
    if (!r.ok) throw new Error('No se pudo cargar el menú');
    return r.json(); // { config, items }
}
