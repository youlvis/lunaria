async function fetchMenu() {
  const response = await fetch(ENDPOINT, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar el menú");
  return response.json(); // { config, items }
}
