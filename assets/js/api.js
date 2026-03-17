const MENU_CACHE_KEY = `lunaria_menu_v${MENU_VERSION}`;
const MENU_CACHE_TTL = 14 * 24 * 60 * 60 * 1000;

function getCachedMenu() {
  try {
    const raw = localStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > MENU_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedMenu(data) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("lunaria_menu_v") && key !== MENU_CACHE_KEY) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(
      MENU_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    /* quota exceeded – ignore */
  }
}

async function fetchMenu() {
  const cached = getCachedMenu();
  if (cached) return cached;

  try {
    const response = await fetch(ENDPOINT, { cache: "no-store" });
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    setCachedMenu(data);
    return data;
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    throw error;
  }
}
