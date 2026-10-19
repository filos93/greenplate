import axios from 'axios';
import { mockAutocompleteSuggestionsData, mockSearchVegRecipesData } from '../__mocks__/mockData';
import { canMakeApiCall } from '../utils/quota';

const isProd = import.meta.env.PROD;

// In production (Vercel), point to /api/spoonacular serverless route.
// In local development, call Spoonacular directly using VITE_SPOONACULAR_API_KEY.
const api = axios.create({
  baseURL: isProd ? '/api/spoonacular' : 'https://api.spoonacular.com/recipes',
  params: isProd ? {} : { apiKey: import.meta.env.VITE_SPOONACULAR_API_KEY }
});

/**
 * Unified request helper.
 * Converts action-based params into query parameters for production serverless route,
 * or direct endpoint paths during local Vite development.
 */
const makeRequest = async (action, endpointPath, params = {}) => {
  if (isProd) {
    // Production: sends action-based queries to Vercel's /api/spoonacular
    return api.get('', { params: { action, ...params } });
  }
  // Local Dev: calls Spoonacular API directly using VITE_SPOONACULAR_API_KEY
  return api.get(endpointPath, { params });
};

// 1. Live Autocomplete Suggestions
export async function getRecipeAutocomplete(query) {
  if (!canMakeApiCall('search')) {
    return [];
  }

  try {
    const { data } = await makeRequest('autocomplete', '/autocomplete', {
      query,
      number: 5
    });

    const results = data.results || data || [];

    return results.map((recipe) => ({
      id: recipe.id,
      title: recipe.title
    }));
  } catch (error) {
    console.error('Failed to fetch autocomplete:', error);
    throw error;
  }
}

// 2. Live Vegetarian Search
export const searchVegRecipes = async (query) => {
  if (!query?.trim()) return [];
  try {
    const { data } = await makeRequest('complexSearch', '/complexSearch', {
      query, 
      diet: 'vegetarian', 
      addRecipeInformation: true, 
      addRecipeInstructions: true,
      fillIngredients: true,
      number: 10
    });
    return data.results || [];
  } catch (error) {
    console.error('Failed to search recipes:', error);
    throw error;
  }
};

// 3. Live Fridge Matcher Search
export const searchByFridge = async (ingredients) => {
  if (!ingredients) return [];
  try {
    const { data } = await makeRequest('complexSearch', '/complexSearch', {
      includeIngredients: ingredients, 
      diet: 'vegetarian', 
      addRecipeInformation: true, 
      addRecipeInstructions: true,
      fillIngredients: true,
      sort: 'max-used-ingredients',
      number: 10
    });
    return data.results || [];
  } catch (error) {
    console.error('Failed to search by fridge ingredients:', error);
    throw error;
  }
};

// 4. Live Detailed Recipe Information
export const getRecipeInformation = async (id) => {
  if (!id) return null;
  try {
    const { data } = await makeRequest('information', `/${id}/information`, { id });
    return data;
  } catch (error) {
    console.error(`Failed to fetch recipe info for ID ${id}:`, error);
    throw error;
  }
};

// 5. MOCK: Autocomplete Suggestions (For Testing)
export const mockGetRecipeAutocomplete = async (query) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  if (!query) return [];
  return mockAutocompleteSuggestionsData.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase())
  );
};

// 6. MOCK: Full Recipe Search (For Testing)
export const mockSearchVegRecipes = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockSearchVegRecipesData;
};