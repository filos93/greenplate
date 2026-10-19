/* eslint-env node */
// api/spoonacular.js (Serverless Function for Vercel)
import axios from 'axios';

export default async function handler(req, res) {
  // 1. Enforce GET requests only
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const { action, id, query, includeIngredients, sort } = req.query;
  const BASE_URL = 'https://api.spoonacular.com/recipes';

  try {
    let targetUrl = '';
    const params = { apiKey };

    // Action 1: Search recipes (used by VegSearch & MyFridge)
    if (action === 'complexSearch') {
      targetUrl = `${BASE_URL}/complexSearch`;
      params.diet = 'vegetarian';
      params.number = 10;
      params.addRecipeInformation = true;
      params.fillIngredients = true;

      if (query && typeof query === 'string') {
        params.query = query.trim();
      }

      if (includeIngredients && typeof includeIngredients === 'string') {
        params.includeIngredients = includeIngredients.trim();
      }

      if (sort && typeof sort === 'string') {
        params.sort = sort.trim();
      }
    } 
    // Action 2: Autocomplete suggestions
    else if (action === 'autocomplete') {
      targetUrl = `${BASE_URL}/autocomplete`;
      params.number = 5;

      if (query && typeof query === 'string') {
        params.query = query.trim();
      }
    }
    // Action 3: Detailed recipe information
    else if (action === 'information') {
      const parsedId = parseInt(id, 10);
      if (!id || Number.isNaN(parsedId) || parsedId <= 0) {
        return res.status(400).json({ error: 'Invalid recipe ID provided.' });
      }
      targetUrl = `${BASE_URL}/${parsedId}/information`;
    } 
    // Reject any unauthorized endpoints or missing actions
    else {
      return res.status(400).json({ error: 'Invalid or missing action parameter.' });
    }

    // Forward sanitized request to Spoonacular
    const response = await axios.get(targetUrl, { params });
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Spoonacular Proxy Error:', error.message);
    const status = error.response?.status || 500;

    if (status === 402) {
      return res.status(402).json({ error: 'Daily API quota exceeded.' });
    }

    // Return generic error message without exposing raw internal error stacks
    return res.status(status).json({ error: 'Failed to fetch data from provider.' });
  }
}