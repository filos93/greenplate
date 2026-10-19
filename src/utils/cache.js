import { sanitizeInput } from './validators';

const CACHE_KEY = 'greenplate_cached_recipes';

/**
 * Simple helper to stem basic English plurals (e.g. "potatoes" -> "potato")
 */
const stemWord = (word = '') => {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
};

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
 * Search cached recipes by query string or matching title/summary/ingredients
 */
export function searchCachedRecipes(query = '') {
  const cached = getCachedRecipes();
  if (!query || !query.trim()) return cached.slice(0, 20);

  const cleanQuery = query.toLowerCase().trim();

  return cached.filter((recipe) => {
    const titleMatch = recipe.title?.toLowerCase().includes(cleanQuery);
    const summaryMatch = recipe.summary?.toLowerCase().includes(cleanQuery);
    const ingredientMatch = recipe.extendedIngredients?.some((ing) =>
      (ing.original || ing.name || '').toLowerCase().includes(cleanQuery)
    );

    return titleMatch || summaryMatch || ingredientMatch;
  });
}

/**
 * Filter cached recipes by matching an array of selected fridge ingredients
 */
export function getMatchingCachedRecipes(selectedIngredients = []) {
  const cached = getCachedRecipes();

  // If no ingredients are selected, return all cached recipes (up to 20)
  if (!selectedIngredients || selectedIngredients.length === 0) {
    return cached.slice(0, 20);
  }

  // Tokenize and stem selected ingredient chips (e.g. "sweet potato" -> ["sweet", "potato"])
  const chipTokens = selectedIngredients.flatMap((chip) =>
    sanitizeInput(chip)
      .split(' ')
      .filter(Boolean)
      .map(stemWord)
  );

  if (chipTokens.length === 0) return cached.slice(0, 20);

  return cached
    .map((recipe) => {
      // Build a comprehensive, sanitized text string from recipe title and all ingredient arrays
      const titleText = sanitizeInput(recipe.title || '');
      const usedIng = (recipe.usedIngredients || []).map((i) => i.name || '').join(' ');
      const unusedIng = (recipe.unusedIngredients || []).map((i) => i.name || '').join(' ');
      const extIng = (recipe.extendedIngredients || []).map((i) => i.original || i.name || '').join(' ');

      const fullRecipeText = sanitizeInput(`${titleText} ${usedIng} ${unusedIng} ${extIng}`);

      // Count how many token keywords match this recipe
      const matchCount = chipTokens.reduce(
        (count, token) => (fullRecipeText.includes(token) ? count + 1 : count),
        0
      );

      return { recipe, matchCount };
    })
    .filter((item) => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((item) => item.recipe);
}