/* global process */
//Serverless Function for Vercel
import axios from 'axios';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client with fallback for Vercel KV and direct Upstash env vars
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

const GLOBAL_DAILY_LIMIT = 50; // Max 50 requests per day similarly to Spoonacular free tier (points) limit
const IP_SEARCH_LIMIT = 6;    // Max 6 primary queries on VegSearch per IP
const IP_FRIDGE_LIMIT = 4;    // Max 4 ingredient searches on MyFridge per IP

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

  // Extract client IP address from Vercel headers
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.socket?.remoteAddress || '127.0.0.1');

  const today = new Date().toISOString().split('T')[0];
  const globalQuotaKey = `quota:global:${today}`;
  
  // Differentiate feature key based on whether request targets MyFridge (includeIngredients) or VegSearch
  const isFridgeSearch = action === 'complexSearch' && Boolean(includeIngredients);
  const ipFeatureKey = isFridgeSearch 
    ? `quota:ip:${clientIp}:fridge:${today}`
    : `quota:ip:${clientIp}:search:${today}`;

  // 2. Server-side Quota Check via Redis (Global check enforced on ALL actions)
  if (redis) {
    try {
      const [globalUsage, ipUsage] = await Promise.all([
        redis.get(globalQuotaKey),
        action === 'complexSearch' ? redis.get(ipFeatureKey) : Promise.resolve(null)
      ]);

      if (parseInt(globalUsage || 0, 10) >= GLOBAL_DAILY_LIMIT) {
        return res.status(429).json({ error: 'Global daily API quota exceeded.' });
      }

      if (action === 'complexSearch') {
        const featureLimit = isFridgeSearch ? IP_FRIDGE_LIMIT : IP_SEARCH_LIMIT;
        if (parseInt(ipUsage || 0, 10) >= featureLimit) {
          return res.status(429).json({ error: `Daily request limit reached for this feature (${featureLimit}/day).` });
        }
      }
    } catch (redisError) {
      console.error('Redis Quota Check Error:', redisError.message);
      // Fall through to proceed if Redis experiences a temporary connection issue
    }
  }

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
        params.query = query.trim().slice(0, 100);
      }

      if (includeIngredients && typeof includeIngredients === 'string') {
        params.includeIngredients = includeIngredients.trim().slice(0, 200);
      }

      if (sort && typeof sort === 'string') {
        params.sort = sort.trim().slice(0, 30);
      }
    } 
    // Action 2: Autocomplete suggestions
    else if (action === 'autocomplete') {
      targetUrl = `${BASE_URL}/autocomplete`;
      params.number = 5;

      if (query && typeof query === 'string') {
        params.query = query.trim().slice(0, 100);
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

    // 3. Increment Redis usage counters (Global increment on ALL actions)
    if (redis) {
      try {
        const pipeline = redis.pipeline();
        
        pipeline.incr(globalQuotaKey);
        pipeline.expire(globalQuotaKey, 172800); // 48-hour expiration auto-cleanup
        
        if (action === 'complexSearch') {
          pipeline.incr(ipFeatureKey);
          pipeline.expire(ipFeatureKey, 172800); // 48-hour expiration auto-cleanup
        }
        
        await pipeline.exec();
      } catch (incrError) {
        console.error('Redis Increment Error:', incrError.message);
      }
    }

    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Spoonacular Proxy Error:', error.message);
    const status = error.response?.status || 500;

    if (status === 402 || status === 429) {
      return res.status(429).json({ error: 'Daily API quota exceeded.' });
    }

    // Return generic error message without exposing raw internal error stacks
    return res.status(status).json({ error: 'Failed to fetch data from provider.' });
  }
}