async function fetchMenu() {
  try {
    const response = await fetch(ENDPOINT, { cache: "no-store" });
    if (!response.ok) throw new Error("API error");
    return response.json();
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    throw error;
  }
}
