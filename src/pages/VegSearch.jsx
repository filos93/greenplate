import { useState, useEffect, useRef } from 'react';
/*
import { 
  mockGetRecipeAutocomplete, 
  mockSearchVegRecipes 
} from '../api/spoonacular';
import { mockSearchVegRecipesData } from '../__mocks__/mockData';
*/
import { getRecipeAutocomplete, searchVegRecipes } from '../api/spoonacular';
import { cacheRecipes, getCachedRecipes } from '../utils/cache';
import { useDebounce } from '../hooks/useDebounce';
import { RecipeCard } from '../components/RecipeCard';
import { QuotaBadge } from '../components/QuotaBadge';
import { sanitizeInput, isValidSearchQuery } from '../utils/validators';
import { canMakeApiCall, incrementQuota, getQuotaStatus, setQuotaExceeded } from '../utils/quota';

const STOP_WORDS = new Set(['with', 'and', 'in', 'of', 'a', 'an', 'the', 'for', 'or', 'to']);

/**
 * Simple stemming helper to handle plurals during offline/cached matching
 */
const stemWord = (word = '') => {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
};

/**
 * Filters recipes using multi-keyword tokenization against title and ingredients.
 */
export const filterRecipes = (recipes = [], rawQuery = '') => {
  const sanitized = sanitizeInput(rawQuery);

  if (!sanitized || !isValidSearchQuery(sanitized)) {
    return [];
  }

  const keywords = sanitized
    .split(' ')
    .filter((word) => Boolean(word) && !STOP_WORDS.has(word))
    .map(stemWord);

  const activeTokens = keywords.length > 0 
    ? keywords 
    : sanitized.split(' ').filter(Boolean).map(stemWord);

  return recipes
    .map((recipe) => {
      const titleText = sanitizeInput(recipe.title || '');
      const ingredientsText = Array.isArray(recipe.ingredients) 
        ? sanitizeInput(recipe.ingredients.join(' '))
        : '';
      const fullText = `${titleText} ${ingredientsText}`;

      // Count how many keywords match this recipe
      const matchCount = activeTokens.reduce(
        (count, token) => (fullText.includes(token) ? count + 1 : count),
        0
      );

      return { recipe, matchCount };
    })
    .filter((item) => item.matchCount > 0) // Keep items with at least 1 keyword match
    .sort((a, b) => b.matchCount - a.matchCount) // Sort highest match count first
    .map((item) => item.recipe);
};

export function VegSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef(null);
  
  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const hasQuota = canMakeApiCall('search');
    const offlineState = !navigator.onLine;

    setIsOffline(offlineState);
    setIsQuotaExceeded(!hasQuota);

    // If offline or quota exhausted on load, show all cached recipes by default
    if (!hasQuota || offlineState) {
      const allCached = getCachedRecipes();
      setRecipes(allCached.slice(0, 20));
      setSearched(true); // Ensures the results grid renders
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
  }, []);

  // Cleanup abort controller and timer on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Fetch suggestions ONLY if user actively typed and query length >= 2
  useEffect(() => {
    let isMounted = true;

    const fetchSuggestions = async () => {
      const cleaned = sanitizeInput(debouncedQuery);
      
      // Double check quota fresh from localStorage right before network call
      const hasQuota = canMakeApiCall('search');

      if (userIsTyping && cleaned.length >= 2 && hasQuota && !isQuotaExceeded && navigator.onLine) {
        try {
          //const data = await mockGetRecipeAutocomplete(cleaned);
          const data = await getRecipeAutocomplete(cleaned);
          if (isMounted) {
            setSuggestions(data || []);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }
        } catch (error) {
          if (isMounted) {
            console.error('Failed to fetch suggestions:', error);
            // Catch 402 immediately on autocomplete typing
            if (error.response?.status === 402) {
              setQuotaExceeded('search');
              setIsQuotaExceeded(true);
              setSuggestions([]);
              setShowSuggestions(false);
              // Instantly fallback search results grid using multi-word matching
              const allCached = getCachedRecipes();
              setRecipes(filterRecipes(allCached, cleaned));
            }
          }
        }
      } else {
        if (isMounted) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, userIsTyping, isQuotaExceeded]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    setQuery(rawVal);
    setUserIsTyping(true);

    const cleaned = sanitizeInput(rawVal);
    if (validationError && cleaned.length >= 2) {
      setValidationError('');
    }

    const hasQuota = canMakeApiCall('search');
    const offlineState = !navigator.onLine;

    // Instantly filter cached recipes locally using multi-word tokenization if quota is exceeded or offline
    if (!hasQuota || isQuotaExceeded || offlineState) {
      const allCached = getCachedRecipes();
      if (cleaned.length >= 2) {
        setRecipes(filterRecipes(allCached, cleaned));
      } else {
        setRecipes(allCached.slice(0, 20));
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex].title);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const executeSearch = (searchTerm) => {
    // Stop search if already in progress
    if (loading) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setLoading(false);
      setSearched(false);
      return;
    }

    const rawInput = searchTerm || query;

    // Validate raw user input FIRST to catch illegal symbols or invalid queries
    if (!isValidSearchQuery(rawInput)) {
      setValidationError('Invalid entry: Max 6 words, no repeating letters or special symbols.');
      setRecipes([]);
      setSearched(false);
      setShowSuggestions(false);
      setUserIsTyping(false);
      return;
    }

    const cleaned = sanitizeInput(rawInput);

    // Minimum character check
    if (cleaned.length < 2) {
      setValidationError('Please type at least 2 characters to search.');
      setRecipes([]);
      setSearched(false);
      setShowSuggestions(false);
      setUserIsTyping(false);
      return;
    }

    // Reset UI state before request
    setUserIsTyping(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setValidationError('');
    setLoading(true);
    setSearched(true);

    // Fresh quota check from localStorage right before initiating timer
    const hasQuota = canMakeApiCall('search');
    const offlineState = !navigator.onLine;

    setIsQuotaExceeded(!hasQuota);
    setIsOffline(offlineState);

    abortControllerRef.current = new AbortController();

    timerRef.current = setTimeout(async () => {
      if (abortControllerRef.current?.signal.aborted) return;

      try {
        let results = [];

        if (hasQuota && canMakeApiCall('search') && !offlineState) {
          const rawResults = await searchVegRecipes(cleaned);
          
          if (rawResults && rawResults.length > 0) {
            results = rawResults.slice(0, 10);
            cacheRecipes(results);
            incrementQuota('search');
          } else {
            // API returned 0 results for strict query -> fallback to ranked local search
            const allCached = getCachedRecipes();
            results = filterRecipes(allCached, cleaned);
          }

          const updatedQuotaStatus = getQuotaStatus('search');
          setIsQuotaExceeded(updatedQuotaStatus.isExceeded);
        } else {
          const allCached = getCachedRecipes();
          results = filterRecipes(allCached, cleaned);
        }

        if (!abortControllerRef.current?.signal.aborted) {
          setRecipes(results);
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('API Error:', error);

          // If API key quota is exhausted on Spoonacular's servers
          if (error.response?.status === 402) {
            setQuotaExceeded('search'); // Force local quota to maxed out
            setIsQuotaExceeded(true);
          } else if (!navigator.onLine) {
            setIsOffline(true);
          }

          // Fall back to local cache using multi-word matching
          const allCached = getCachedRecipes();
          setRecipes(filterRecipes(allCached, cleaned));
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }, 1200);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex].title);
    } else {
      executeSearch(query);
    }
  };

  const handleSelectSuggestion = (title) => {
    setQuery(title);
    executeSearch(title);
  };

  const isSearchDisabled = sanitizeInput(query).length < 2;
  const quotaStats = getQuotaStatus('search');

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Search Vegetarian Recipes</h2>
        <QuotaBadge feature="search" />
      </div>

      <div className="search-container" ref={containerRef}>
        {query && (
          <div className="chips-header-row">
            <button 
              type="button" 
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
                setValidationError('');
                setSearched(true);
                setUserIsTyping(false);

                // Reverts recipe grid back to default cached recipes (works online & offline)
                const allCached = getCachedRecipes();
                setRecipes(allCached.slice(0, 20));
              }} 
              className="clear-all-btn"
              disabled={loading}
            >
              Clear All
            </button>
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          className={`search-form ${validationError ? 'input-error' : ''}`}
        >
          <input 
            type="text" 
            placeholder="Search dishes or ingredients" 
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => userIsTyping && sanitizeInput(query).length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            className="search-input"
          />
          <button 
            type="submit" 
            className={`search-btn ${loading ? 'stop-btn' : ''}`} 
            disabled={!loading && isSearchDisabled}
          >
            {loading ? '⏳ Stop Search' : '🔍 Search'}
          </button>
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions-dropdown">
            {suggestions.map((item, index) => (
              <li
                key={item.id}
                onClick={() => handleSelectSuggestion(item.title)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              >
                <span className="suggestion-icon">🔍</span>
                <span className="suggestion-text">{item.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {validationError && (
        <p className="input-error-message">
          ⚠️ {validationError}
        </p>
      )}

      {isQuotaExceeded && (
        <div style={{ margin: '1.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#ff7b72', marginBottom: '0.5rem' }}>
            <span>⚡</span>
            <span>Daily API Quota Reached ({quotaStats.used}/{quotaStats.max} searches used):</span>
          </div>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
            Live search is paused for today. You can still search, save, and export all offline recipes! Your daily API limit resets at midnight.
          </p>
        </div>
      )}

      {isOffline && !isQuotaExceeded && (
        <div style={{ margin: '1.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#e3b341', marginBottom: '0.5rem' }}>
            <span>📡</span>
            <span>You Are Currently Offline (No Internet Connection):</span>
          </div>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
            Live search is unavailable. You can still search, save, and export all offline recipes!
          </p>
        </div>
      )}

      {!loading && searched && !validationError && recipes.length === 0 && (
        <p className="status info">
          No recipes found. Try searching for another ingredient!
        </p>
      )}

      <div className="grid">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}