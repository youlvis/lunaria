function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

const AppMode = (() => {
    const q = (getQueryParam('mode') || '').toLowerCase();
    const mode = (q === 'order' || q === 'menu') ? q : (typeof DEFAULT_MODE !== 'undefined' ? DEFAULT_MODE : 'menu');
    const isOrder = mode === 'order';
    return { mode, isOrder };
})();
