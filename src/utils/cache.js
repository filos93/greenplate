// src/utils/cache.js

const CACHE_KEY = 'greenplate_cached_recipes';

/**
 * Save new recipes to local storage cache (deduplicating by recipe ID)
 */
export function cacheRecipes(newRecipes = []) {
  if (!Array.isArray(newRecipes) || newRecipes.length === 0) return;

  try {
    const existing = getCachedRecipes();
    const existingMap = new Map(existing.map((r) => [r.id, r]));

    // Add or update recipes in map
    newRecipes.forEach((recipe) => {
      if (recipe && recipe.id) {
        existingMap.set(recipe.id, recipe);
      }
    });

    const updatedList = Array.from(existingMap.values());
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Failed to update recipe cache in localStorage:', error);
  }
}

/**
 * Retrieve all cached recipes
 */
export function getCachedRecipes() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to read cached recipes from localStorage:', error);
    return [];
  }
}

/**
 * Search cached recipes by query string or matching ingredients
 */
export function searchCachedRecipes(query = '') {
  const cached = getCachedRecipes();
  if (!query || !query.trim()) return cached.slice(0, 10);

  const cleanQuery = query.toLowerCase().trim();

  return cached.filter((recipe) => {
    const titleMatch = recipe.title?.toLowerCase().includes(cleanQuery);
    const summaryMatch = recipe.summary?.toLowerCase().includes(cleanQuery);
    const ingredientMatch = recipe.extendedIngredients?.some((ing) =>
      ing.original?.toLowerCase().includes(cleanQuery)
    );

    return titleMatch || summaryMatch || ingredientMatch;
  });
}