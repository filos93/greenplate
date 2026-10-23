const QUOTA_KEY = 'greenplate_daily_quota';

/**
 * Returns today's date key in UTC format (YYYY-MM-DD) to align with Spoonacular's UTC midnight reset.
 */
const getUtcDateKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
};

const DEFAULT_QUOTA = {
  search: 0,   // Max 6 calls/day
  myfridge: 0, // Max 4 calls/day
};

const LIMITS = {
  search: 6,
  myfridge: 4,
};

/**
 * Helper to return a fresh default quota object with the current UTC date.
 */
const createDefaultQuota = () => ({
  date: getUtcDateKey(),
  ...DEFAULT_QUOTA,
});

/**
 * Retrieves current daily usage, automatically resetting counts if the UTC calendar day changed.
 * Always returns a new copy to avoid mutating default references.
 */
export const getQuotaUsage = () => {
  const saved = localStorage.getItem(QUOTA_KEY);
  if (!saved) return createDefaultQuota();

  try {
    const parsed = JSON.parse(saved);
    const today = getUtcDateKey();

    // Reset counts if a new UTC day has started
    if (parsed.date !== today) {
      const resetData = createDefaultQuota();
      localStorage.setItem(QUOTA_KEY, JSON.stringify(resetData));
      return resetData;
    }

    return { ...parsed };
  } catch {
    return createDefaultQuota();
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
 * Forces local quota to maxed out when Spoonacular API or Vercel Proxy responds with HTTP 402 or 429
 */
export const setQuotaExceeded = (feature) => {
  const usage = getQuotaUsage();
  usage[feature] = LIMITS[feature];
  localStorage.setItem(QUOTA_KEY, JSON.stringify(usage));
  return usage;
};