function getQueryParam(name) {
  try {
    return new URL(window.location.href).searchParams.get(name);
  } catch {
    return null;
  }
}

const VALID_MODES = new Set(["order", "menu"]);
const FALLBACK_MODE =
  typeof DEFAULT_MODE !== "undefined" && DEFAULT_MODE ? DEFAULT_MODE : "menu";

const AppMode = (() => {
  const q = (getQueryParam("mode") || "").toLowerCase();
  const mode = VALID_MODES.has(q) ? q : FALLBACK_MODE;
  return { mode, isOrder: mode === "order" };
})();
