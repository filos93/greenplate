/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { searchVegRecipes } from '../api/spoonacular';
import { useDebounce } from '../hooks/useDebounce';
import { useRecipeSearch } from '../hooks/useRecipeSearch';
import { RecipeCard } from '../components/RecipeCard';
import { QuotaBadge } from '../components/QuotaBadge';
import { sanitizeInput, isValidSearchQuery } from '../utils/validators';
import { getCachedRecipes } from '../utils/cache';
import { StatusBanners } from '../components/StatusBanners';

const STATIC_VEG_SUGGESTIONS = [
  'Goat Cheese Pesto Pizza',
  'Paneer Fig Pizza',
  'Mini Vegetarian Puff Pastry Pizzas',
  'Multigrain Tandoori Pizza With Paneer Tikka',
  'Fig and Goat Cheese Pizza With Pesto',
  'Zucchini Pizza Boats',
  'Palak Tofu',
  'Caramelized Tofu Gala Apple Salad',
  'Malaysian Sambal Kangkong',
  'Mushroom Risotto',
  'Spinach Ricotta Ravioli',
  'Eggplant Parmesan',
  'Chickpea Curry',
  'Lentil Soup',
  'Caprese Salad',
  'Margherita Pizza',
  'Vegetable Stir Fry',
  'Butternut Squash Soup',
  'Black Bean Tacos',
  'Sweet Potato Black Bean Chili',
  'Cauliflower Fried Rice',
  'Quinoa Stuffed Bell Peppers',
  'Avocado Toast',
  'Broccoli Cheddar Soup',
  'Pesto Pasta',
  'Falafel Wrap',
  'Shakshuka',
  'Vegetable Lasagna',
  'Tofu Scramble'
];

const STOP_WORDS = new Set(['with', 'and', 'in', 'of', 'a', 'an', 'the', 'for', 'or', 'to']);

const stemWord = (word = '') => {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
};

// Normalizes raw Spoonacular titles so every dropdown item passes isValidSearchQuery on click
const toValidSuggestionTitle = (rawTitle = '') => {
  const cleaned = rawTitle
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return isValidSearchQuery(cleaned) ? cleaned : '';
};

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

      const matchCount = activeTokens.reduce(
        (count, token) => (fullText.includes(token) ? count + 1 : count),
        0
      );

      return { recipe, matchCount };
    })
    .filter((item) => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((item) => item.recipe);
};

export function VegSearch() {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationError, setValidationError] = useState('');
  const [userIsTyping, setUserIsTyping] = useState(false);

  const debouncedQuery = useDebounce(query, 200);
  const containerRef = useRef(null);

  const filterCacheCallback = useCallback((cachedItems, searchTerm) => {
    return filterRecipes(cachedItems, searchTerm);
  }, []);

  const {
    recipes,
    setRecipes,
    loading,
    searched,
    setSearched,
    isQuotaExceeded,
    isOffline,
    executeSearch,
    resetToDefaultCache,
    quotaStats
  } = useRecipeSearch('search', searchVegRecipes, filterCacheCallback);

  // Derived local-first autocomplete suggestions (Static list + cached recipe titles)
  const suggestions = useMemo(() => {
    const cleaned = sanitizeInput(debouncedQuery);

    if (!userIsTyping || cleaned.length < 2 || !isValidSearchQuery(debouncedQuery)) {
      return [];
    }

    const cachedRecipes = getCachedRecipes() || [];
    const seen = new Set();
    const pool = [];

    for (const title of STATIC_VEG_SUGGESTIONS) {
      const key = title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        pool.push({ id: `static-${key}`, title });
      }
    }

    for (const recipe of cachedRecipes) {
      const validTitle = toValidSuggestionTitle(recipe?.title || '');
      if (!validTitle) continue;

      const key = validTitle.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        pool.push({ id: recipe.id || `cached-${key}`, title: validTitle });
      }
    }

    return pool
      .filter((item) => item.title.toLowerCase().includes(cleaned))
      .slice(0, 6);
  }, [debouncedQuery, userIsTyping]);

  // Click outside listener
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
    setShowSuggestions(true);
    setSelectedIndex(-1);

    if (validationError) {
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

  const startSearch = (searchTerm) => {
    const rawInput = searchTerm || query;

    if (!isValidSearchQuery(rawInput)) {
      setValidationError('Invalid entry: Use 2+ letters (max 6 words). No numbers, symbols, or 3+ repeated letters.');
      setRecipes([]);
      setSearched(true);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      setUserIsTyping(false);
      return;
    }

    const cleaned = sanitizeInput(rawInput);

    if (cleaned.length < 2) {
      setValidationError('Please type at least 2 characters to search.');
      setRecipes([]);
      setSearched(true);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      setUserIsTyping(false);
      return;
    }

    setUserIsTyping(false);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setValidationError('');

    executeSearch(cleaned);
  };

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setShowSuggestions(false);

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex].title);
    } else {
      startSearch(query);
    }
  };

  const handleSelectSuggestion = (title) => {
    setQuery(title);
    startSearch(title);
  };

  const isSearchDisabled = query.trim().length < 2;

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
                setShowSuggestions(false);
                setSelectedIndex(-1);
                setValidationError('');
                setUserIsTyping(false);
                resetToDefaultCache();
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
            placeholder="Search dishes or ingredients!" 
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

      <StatusBanners 
        isQuotaExceeded={isQuotaExceeded} 
        isOffline={isOffline} 
        quotaStats={quotaStats} 
      />

      {!loading && searched && !isQuotaExceeded && !validationError && recipes.length === 0 && (
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
