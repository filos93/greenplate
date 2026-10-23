import { useState, useEffect, useRef, useCallback } from 'react';
import { canMakeApiCall, incrementQuota, getQuotaStatus, setQuotaExceeded } from '../utils/quota';
import { getCachedRecipes, cacheRecipes } from '../utils/cache';

export function useRecipeSearch(featureKey, fetchApiFn, filterCacheFn) {
  // Compute initial offline and quota status lazily on the first render
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(() => !canMakeApiCall(featureKey));
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  // Dedicated state trigger to force UI badges/banners to re-render on quota state change
  const [, setQuotaVersion] = useState(0);

  // Initialize recipe results lazily with fallback cached items if offline or quota is exhausted
  const [recipes, setRecipes] = useState(() => {
    const hasQuota = canMakeApiCall(featureKey);
    const offlineState = typeof navigator !== 'undefined' && !navigator.onLine;
    if (!hasQuota || offlineState) {
      return getCachedRecipes().slice(0, 20);
    }
    return [];
  });

  const [searched, setSearched] = useState(() => {
    const hasQuota = canMakeApiCall(featureKey);
    const offlineState = typeof navigator !== 'undefined' && !navigator.onLine;
    return !hasQuota || offlineState;
  });

  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  // Synchronize dynamic connection changes while app is mounted
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      const allCached = getCachedRecipes();
      setRecipes(allCached.slice(0, 20));
      setSearched(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup abort controllers and timers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const executeSearch = useCallback((searchPayload, onSuccess) => {
    // Cancel any previous pending search timer or ongoing HTTP request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);

    setLoading(true);
    setSearched(true);

    const hasQuota = canMakeApiCall(featureKey);
    const offlineState = typeof navigator !== 'undefined' && !navigator.onLine;

    setIsQuotaExceeded(!hasQuota);
    setIsOffline(offlineState);

    abortControllerRef.current = new AbortController();

    timerRef.current = setTimeout(async () => {
      if (abortControllerRef.current?.signal.aborted) return;

      try {
        let results = [];

        if (hasQuota && !offlineState) {
          const queryParam = Array.isArray(searchPayload) 
            ? searchPayload.join(',') 
            : searchPayload;

          const rawResults = await fetchApiFn(queryParam);

          if (rawResults && rawResults.length > 0) {
            results = rawResults.slice(0, 10);
            cacheRecipes(results);
            incrementQuota(featureKey);
            setQuotaVersion((v) => v + 1);
          } else {
            const allCached = getCachedRecipes();
            const fallback = filterCacheFn ? filterCacheFn(allCached, searchPayload) : allCached;
            results = Array.isArray(fallback) ? fallback : [];
          }

          if (onSuccess) {
            onSuccess(results);
          }

          setIsQuotaExceeded(!canMakeApiCall(featureKey));
        } else {
          const allCached = getCachedRecipes();
          const fallback = filterCacheFn ? filterCacheFn(allCached, searchPayload) : allCached;
          results = Array.isArray(fallback) ? fallback : [];
        }

        if (!abortControllerRef.current?.signal.aborted) {
          setRecipes(results);
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('API Error / Offline Network Failure:', error);

          // Handle both 402 and 429 quota exhaustion errors from the server
          if (error.response?.status === 402 || error.response?.status === 429) {
            setQuotaExceeded(featureKey);
            setIsQuotaExceeded(true);
            setQuotaVersion((v) => v + 1);
          } else if (!navigator.onLine || error.message === 'Network Error' || !error.response) {
            setIsOffline(true);
          }

          const allCached = getCachedRecipes();
          const matches = filterCacheFn ? filterCacheFn(allCached, searchPayload) : [];
          const safeMatches = Array.isArray(matches) ? matches : [];
          setRecipes(safeMatches.length > 0 ? safeMatches : allCached.slice(0, 20));
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }, 1200);
  }, [featureKey, fetchApiFn, filterCacheFn]); // Removed `loading` dependency

  const resetToDefaultCache = useCallback(() => {
    const allCached = getCachedRecipes();
    setRecipes(allCached.slice(0, 20));
    setSearched(true);
  }, []);

  return {
    recipes,
    setRecipes,
    loading,
    searched,
    setSearched,
    isQuotaExceeded,
    setIsQuotaExceeded,
    isOffline,
    setIsOffline,
    executeSearch,
    resetToDefaultCache,
    quotaStats: getQuotaStatus(featureKey)
  };
}