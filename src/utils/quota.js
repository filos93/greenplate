// src/utils/quota.js

const QUOTA_KEY = 'greenplate_daily_quota';

const DEFAULT_QUOTA = {
  date: new Date().toDateString(),
  search: 0,   // Max 6 calls/day
  myfridge: 0, // Max 4 calls/day
};

const LIMITS = {
  search: 6,
  myfridge: 4,
};

/**
 * Retrieves current daily usage, automatically resetting counts if the calendar day changed.
 */
export const getQuotaUsage = () => {
  const saved = localStorage.getItem(QUOTA_KEY);
  if (!saved) return DEFAULT_QUOTA;

  try {
    const parsed = JSON.parse(saved);
    const today = new Date().toDateString();

    // Reset counts if a new day has started
    if (parsed.date !== today) {
      const resetData = { ...DEFAULT_QUOTA, date: today };
      localStorage.setItem(QUOTA_KEY, JSON.stringify(resetData));
      return resetData;
    }

    return parsed;
  } catch {
    return DEFAULT_QUOTA;
  }
};

/**
 * Checks if a specific feature ('search' | 'myfridge') still has remaining calls for today.
 */
export const canMakeApiCall = (feature) => {
  const usage = getQuotaUsage();
  return usage[feature] < LIMITS[feature];
};

/**
 * Increments and saves usage count for a feature if remaining.
 */
export const incrementQuota = (feature) => {
  const usage = getQuotaUsage();
  if (usage[feature] < LIMITS[feature]) {
    usage[feature] += 1;
    localStorage.setItem(QUOTA_KEY, JSON.stringify(usage));
  }
  return usage;
};

/**
 * Returns quota statistics for rendering status indicators or badges in the UI.
 */
export const getQuotaStatus = (feature) => {
  const usage = getQuotaUsage();
  const used = usage[feature] || 0;
  const max = LIMITS[feature] || 0;
  return {
    used,
    max,
    remaining: Math.max(0, max - used),
    isExceeded: used >= max,
  };
};

/**
 * Forces local quota to maxed out when Spoonacular API responds with HTTP 402
 */
export const setQuotaExceeded = (feature) => {
  const usage = getQuotaUsage();
  usage[feature] = LIMITS[feature];
  localStorage.setItem(QUOTA_KEY, JSON.stringify(usage));
  return usage;
};