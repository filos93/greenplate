// src/api/spoonacular.js
import axios from 'axios';
import { mockAutocompleteSuggestionsData, mockSearchVegRecipesData } from '../__mocks__/mockData';

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
export const getRecipeAutocomplete = async (query) => {
  if (!query?.trim()) return [];
  try {
    const { data } = await makeRequest('/complexSearch', { 
      query, 
      diet: 'vegetarian',
      autocomplete: true,
      number: 5
    });

    if (!data?.results) return [];

    // Map to match the { id, title } structure expected by dropdown
    return data.results.map((recipe) => ({
      id: recipe.id,
      title: recipe.title
    }));
  } catch (error) {
    console.error('Failed to fetch autocomplete:', error);
    return [];
  }
};

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
    return [];
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
    return [];
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
    return null;
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