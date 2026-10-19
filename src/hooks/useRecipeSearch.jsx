// src/hooks/useRecipeSearch.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { canMakeApiCall, incrementQuota, getQuotaStatus, setQuotaExceeded } from '../utils/quota';
import { getCachedRecipes, cacheRecipes } from '../utils/cache';

export function useRecipeSearch(featureKey, fetchApiFn, filterCacheFn) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Lazy state initializers prevent mount re-renders
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(() => !canMakeApiCall(featureKey));
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  // Sync connection state and load default cache when offline/exceeded
  useEffect(() => {
    const hasQuota = canMakeApiCall(featureKey);
    const offlineState = !navigator.onLine;

    setIsOffline(offlineState);
    setIsQuotaExceeded(!hasQuota);

    if (!hasQuota || offlineState) {
      const allCached = getCachedRecipes();
      setRecipes(allCached.slice(0, 20));
      setSearched(true);
    }

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
  }, [featureKey]);

  // Clean up timer and abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const executeSearch = useCallback((searchPayload, onSuccess) => {
    // Stop search immediately if clicked while loading
    if (loading) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    const hasQuota = canMakeApiCall(featureKey);
    const offlineState = !navigator.onLine;

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
          } else {
            const allCached = getCachedRecipes();
            results = filterCacheFn ? filterCacheFn(allCached, searchPayload) : allCached;
          }

          if (onSuccess) {
            onSuccess(results);
          }

          setIsQuotaExceeded(!canMakeApiCall(featureKey));
        } else {
          const allCached = getCachedRecipes();
          results = filterCacheFn ? filterCacheFn(allCached, searchPayload) : allCached;
        }

        if (!abortControllerRef.current?.signal.aborted) {
          setRecipes(results);
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('API Error / Offline Network Failure:', error);

          if (error.response?.status === 402) {
            setQuotaExceeded(featureKey);
            setIsQuotaExceeded(true);
          } else if (!navigator.onLine || error.message === 'Network Error' || !error.response) {
            setIsOffline(true);
          }

          const allCached = getCachedRecipes();
          const matches = filterCacheFn ? filterCacheFn(allCached, searchPayload) : [];
          setRecipes(matches.length > 0 ? matches : allCached.slice(0, 20));
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }, 1200);
  }, [featureKey, fetchApiFn, filterCacheFn, loading]);

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