export async function searchFood(query: string): Promise<any[]> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=true&page_size=10`);
    if (response.ok) {
      const data = await response.json();
      return data.products || [];
    }
    return [];
  } catch {
    return [];
  }
}
