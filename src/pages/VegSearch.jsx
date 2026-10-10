import { useState, useEffect, useRef } from 'react';
/*
import { 
  mockGetRecipeAutocomplete, 
  mockSearchVegRecipes 
} from '../api/spoonacular';
import { mockSearchVegRecipesData } from '../__mocks__/mockData';
*/
import { getRecipeAutocomplete, searchVegRecipes } from '../api/spoonacular';
import { cacheRecipes, searchCachedRecipes } from '../utils/cache';
import { useDebounce } from '../hooks/useDebounce';
import { RecipeCard } from '../components/RecipeCard';
import { QuotaBadge } from '../components/QuotaBadge';
import { sanitizeInput, isValidStructure } from '../utils/validators';
import { canMakeApiCall, incrementQuota, getQuotaStatus } from '../utils/quota';

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

  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef(null);
  
  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

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
      if (userIsTyping && cleaned.length >= 2) {
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
  }, [debouncedQuery, userIsTyping]);

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

    const cleaned = sanitizeInput(searchTerm || query);

    // Input validation
    if (cleaned.length < 2) {
      setValidationError('Please type at least 2 characters to search.');
      setRecipes([]);
      setSearched(false);
      setShowSuggestions(false);
      setUserIsTyping(false);
      return;
    }

    if (!isValidStructure(cleaned, 6)) {
      setValidationError('Invalid entry: Max 6 words, no repeating letters or special symbols.');
      setRecipes([]);
      setSearched(false);
      setShowSuggestions(false);
      setUserIsTyping(false);
      return;
    }

    // Reset UI state before request
    setQuery('');
    setUserIsTyping(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setValidationError('');
    setLoading(true);
    setSearched(true);

    const hasQuota = canMakeApiCall('search');
    setIsQuotaExceeded(!hasQuota);

    abortControllerRef.current = new AbortController();

    timerRef.current = setTimeout(async () => {
      if (abortControllerRef.current?.signal.aborted) return;

      try {
        let results = [];

        if (hasQuota) {
          //const rawResults = await mockSearchVegRecipes(cleaned);
          //results = (rawResults || []).slice(0, 10);
          const rawResults = await searchVegRecipes(cleaned);
          results = (rawResults || []).slice(0, 10);
          cacheRecipes(results);
          incrementQuota('search');
        } else {
          /* Offline fallback mode consuming central mock data
          results = mockSearchVegRecipesData.map((item, i) => ({
            ...item,
            id: 900 + i,
            title: `${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)} - ${item.title} (Offline Mode)`,
            summary: `${item.summary} [Offline fallback record]`
          }));
          */
          results = searchCachedRecipes(cleaned);
        }

        if (!abortControllerRef.current?.signal.aborted) {
          setRecipes(results);
        }
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
          // Optional network error fallback to local cache
          setRecipes(searchCachedRecipes(cleaned));
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
        <form 
          onSubmit={handleSubmit} 
          className={`search-form ${validationError ? 'input-error' : ''}`}
        >
          <input 
            type="text" 
            placeholder="Type to search (e.g., spinach, tea)..." 
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
            You're browsing in <strong>Offline Fallback Mode</strong>. You can still view, favorite, and export all offline recipes! Your live search quota resets automatically at midnight.
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