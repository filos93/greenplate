import axios from 'axios';
import { mockSearchVegRecipesData } from '../__mocks__/mockData';
import { canMakeApiCall } from '../utils/quota';

// Unified client instance pointing directly to the Vercel serverless proxy route
const api = axios.create({
  baseURL: '/api/spoonacular'
});

/**
 * Unified request helper.
 * Passes action-based query parameters to /api/spoonacular.
 */
const makeRequest = async (action, params = {}) => {
  return api.get('', { params: { action, ...params } });
};

// 1. Live Vegetarian Search
export const searchVegRecipes = async (query) => {
  if (!query?.trim()) return [];
  if (!canMakeApiCall('search')) return [];

  try {
    // Server enforces diet='vegetarian', number=10, addRecipeInformation, and fillIngredients
    const { data } = await makeRequest('complexSearch', { query });
    return data.results || [];
  } catch (error) {
    console.error('Failed to search recipes:', error);
    throw error;
  }
};

// 2. Live Fridge Matcher Search
export const searchByFridge = async (ingredients) => {
  if (!ingredients) return [];
  if (!canMakeApiCall('myfridge')) return [];

  try {
    // Server enforces diet='vegetarian' and number=10; client specifies ingredients and sort order
    const formattedIngredients = Array.isArray(ingredients) ? ingredients.join(',') : ingredients;
    const { data } = await makeRequest('complexSearch', {
      includeIngredients: formattedIngredients,
      sort: 'max-used-ingredients'
    });
    return data.results || [];
  } catch (error) {
    console.error('Failed to search by fridge ingredients:', error);
    throw error;
  }
};

// 3. Live Detailed Recipe Information
export const getRecipeInformation = async (id) => {
  if (!id) return null;

  try {
    const { data } = await makeRequest('information', { id });
    return data;
  } catch (error) {
    console.error(`Failed to fetch recipe info for ID ${id}:`, error);
    throw error;
  }
};

// 4. MOCK: Full Recipe Search (For Testing)
export const mockSearchVegRecipes = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockSearchVegRecipesData;
};
