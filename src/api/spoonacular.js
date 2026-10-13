// src/api/spoonacular.js
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

// Helper for routing request params correctly between Vercel and local dev
const makeRequest = async (endpoint, params = {}) => {
  if (isProd) {
    return api.get('', { params: { endpoint, ...params } });
  }
  return api.get(endpoint, { params });
};

// 1. Live Autocomplete Suggestions (Native Vegetarian Autocomplete)
export async function getRecipeAutocomplete(query) {
  // Prevent outgoing request if quota is local-exceeded
  if (!canMakeApiCall('search')) {
    return [];
  }

  try {
    const { data } = await makeRequest('/complexSearch', {
      query,
      diet: 'vegetarian',
      number: 8
    });

    const results = data.results || data || [];

    // Standardize mapping to ensure items always return predictable { id, title } shapes
    return results.map((recipe) => ({
      id: recipe.id,
      title: recipe.title
    }));
  } catch (error) {
    console.error('Failed to fetch autocomplete:', error);
    throw error; // Pass error up so component can setQuotaExceeded on 402
  }
}

// 2. Live Vegetarian Search
export const searchVegRecipes = async (query) => {
  if (!query?.trim()) return [];
  try {
    const { data } = await makeRequest('/complexSearch', {
      query, 
      diet: 'vegetarian', 
      addRecipeInformation: true, 
      addRecipeInstructions: true,
      fillIngredients: true,
      number: 8
    });
    return data.results || [];
  } catch (error) {
    console.error('Failed to search recipes:', error);
    throw error; // Rethrow so component catch block handles HTTP 402 quota lock
  }
};

// 3. Live Fridge Matcher Search
export const searchByFridge = async (ingredients) => {
  if (!ingredients) return [];
  try {
    const { data } = await makeRequest('/complexSearch', {
      includeIngredients: ingredients, 
      diet: 'vegetarian', 
      addRecipeInformation: true, 
      addRecipeInstructions: true,
      fillIngredients: true,
      sort: 'max-used-ingredients',
      number: 8
    });
    return data.results || [];
  } catch (error) {
    console.error('Failed to search by fridge ingredients:', error);
    throw error; // for display show when offline
  }
};

// 4. Live Detailed Recipe Information (Guarantees analyzedInstructions payload)
export const getRecipeInformation = async (id) => {
  if (!id) return null;
  try {
    const { data } = await makeRequest(`/${id}/information`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch recipe info for ID ${id}:`, error);
    throw error; // for display show when offline
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