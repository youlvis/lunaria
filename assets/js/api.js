const MENU_CACHE_KEY = "lunaria_menu";
const MENU_CACHE_TTL = 14 * 24 * 60 * 60 * 1000; // 2 semanas

function getCachedMenu() {
  try {
    const raw = localStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > MENU_CACHE_TTL) return null;
    // No devolver caché vacía — puede ser resultado de un fallo anterior
    if (!data || !data.items || data.items.length === 0) {
      localStorage.removeItem(MENU_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedMenu(data) {
  // Solo guardar si hay datos reales; nunca cachear una respuesta vacía
  if (!data || !data.items || data.items.length === 0) return;
  try {
    localStorage.setItem(MENU_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded */ }
}

async function fetchMenu() {
  const cached = getCachedMenu();
  if (cached) return cached;

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [0, 2000, 4000]; // ms antes de cada intento

  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (RETRY_DELAYS[attempt] > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 s por intento
      let response;
      try {
        response = await fetch(ENDPOINT, { cache: "no-store", signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) throw new Error("API " + response.status);
      const data = await response.json();
      setCachedMenu(data);
      return data;
    } catch (error) {
      lastError = error;
      console.warn("fetchMenu intento " + (attempt + 1) + " fallido:", error.message);
    }
  }

  console.error("fetchMenu: todos los intentos fallaron", lastError);
  throw lastError;
}
