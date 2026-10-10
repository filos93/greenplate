// api/spoonacular.js (Serverless Function for Vercel)
import axios from 'axios';

export default async function handler(req, res) {
  // 1. Enforce GET requests only
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Extract target endpoint and remaining query parameters
  const { endpoint, ...queryParams } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint parameter is required' });
  }

  try {
    // 3. Forward request to Spoonacular with backend API key
    const response = await axios.get(`https://api.spoonacular.com/recipes${endpoint}`, {
      params: {
        ...queryParams,
        apiKey: process.env.SPOONACULAR_API_KEY // Securely read on Vercel's backend
      }
    });

    return res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    return res.status(status).json({ error: message });
  }
}