import { useState, useRef, useEffect } from 'react';
import { searchByFridge } from '../api/spoonacular';
import { cacheRecipes, getMatchingCachedRecipes, getCachedRecipes } from '../utils/cache';
import { RecipeCard } from '../components/RecipeCard';
import { QuotaBadge } from '../components/QuotaBadge';
import { isValidStructure, sanitizeInput } from '../utils/validators';
import { canMakeApiCall, incrementQuota, getQuotaStatus, setQuotaExceeded } from '../utils/quota';

// 20 Curated Vegetarian Staples
const POPULAR_INGREDIENTS = [
  'tofu', 'chickpeas', 'beans', 'lentils', 
  'spinach', 'broccoli', 'kale', 'zucchini', 
  'garlic', 'onion', 'tomatoes', 'pepper', 
  'mushrooms', 'potatoes', 'feta', 'parmesan', 
  'avocado', 'coconutmilk', 'olive oil', 'soy sauce'
];

export function MyFridge() {
  const [typedText, setTypedText] = useState('');
  const [ingredients, setIngredients] = useState([]); 
  const [results, setResults] = useState([]);
  const [unrecognizedItems, setUnrecognizedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [inputError, setInputError] = useState('');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  const MIN_ITEMS = 2;
  const MAX_ITEMS = 5;

  useEffect(() => {
    const hasQuota = canMakeApiCall('myfridge');
    const offlineState = !navigator.onLine;

    setIsOffline(offlineState);
    setIsQuotaExceeded(!hasQuota);

    // If offline or quota exhausted on load, display all cached recipes by default
    if (!hasQuota || offlineState) {
      const allCached = getCachedRecipes();
      setResults(allCached.slice(0, 20));
      setSearched(true);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      const allCached = getCachedRecipes();
      setResults(allCached.slice(0, 20));
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

  const addIngredient = (rawItem) => {
    if (loading || ingredients.length >= MAX_ITEMS) return;
    
    const cleaned = sanitizeInput(rawItem);
    setInputError('');

    if (!isValidStructure(cleaned)) {
      setInputError('Invalid entry: Must be 2+ letters, max 2 words, no symbols or repeating letters.');
      return;
    }

    if (!ingredients.includes(cleaned)) {
      const updatedChips = [...ingredients, cleaned];
      setIngredients(updatedChips);
      setTypedText('');

      const hasQuota = canMakeApiCall('myfridge');
      const offlineState = !navigator.onLine;

      if (!hasQuota || offlineState) {
        const matches = getMatchingCachedRecipes(updatedChips);
        setResults(matches.length > 0 ? matches : getCachedRecipes().slice(0, 20));
        setSearched(true);
      }
    } else {
      setInputError(`"${cleaned}" is already added.`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient(typedText);
    }
  };

  const removeIngredient = (indexToRemove) => {
    if (loading) return;
    const updatedChips = ingredients.filter((_, idx) => idx !== indexToRemove);
    setIngredients(updatedChips);

    const hasQuota = canMakeApiCall('myfridge');
    const offlineState = !navigator.onLine;

    if (!hasQuota || offlineState) {
      if (updatedChips.length > 0) {
        const matches = getMatchingCachedRecipes(updatedChips);
        setResults(matches.length > 0 ? matches : getCachedRecipes().slice(0, 20));
      } else {
        setResults(getCachedRecipes().slice(0, 20));
      }
      setSearched(true);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    // IF ALREADY LOADING: STOP THE SEARCH IMMEDIATELY
    if (loading) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setLoading(false);
      return;
    }

    let currentIngredients = [...ingredients];
    if (typedText.trim() && currentIngredients.length < MAX_ITEMS) {
      const cleaned = sanitizeInput(typedText);
      if (isValidStructure(cleaned) && !currentIngredients.includes(cleaned)) {
        currentIngredients.push(cleaned);
        setIngredients(currentIngredients);
      }
    }

    if (currentIngredients.length < MIN_ITEMS) return;

    setTypedText('');
    setInputError('');

    setLoading(true);
    setSearched(true);
    setUnrecognizedItems([]);
    abortControllerRef.current = new AbortController();

    // CHECK DAILY QUOTA & ONLINE STATUS BEFORE CALL
    const hasQuota = canMakeApiCall('myfridge');
    const offlineState = !navigator.onLine;

    setIsQuotaExceeded(!hasQuota);
    setIsOffline(offlineState);

    timerRef.current = setTimeout(async () => {
      if (abortControllerRef.current.signal.aborted) return;

      let finalResults = [];

      try {
        if (hasQuota && !offlineState) {
          // LIVE SPOONACULAR API CALL
          const rawResults = await searchByFridge(currentIngredients.join(','));
          
          if (rawResults && rawResults.length > 0) {
            finalResults = rawResults.slice(0, 10);
            cacheRecipes(finalResults);
            incrementQuota('myfridge');
          } else {
            // Fallback to local matching cache if API returns 0 items
            finalResults = getMatchingCachedRecipes(currentIngredients);
          }

          const updatedQuotaStatus = getQuotaStatus('myfridge');
          setIsQuotaExceeded(updatedQuotaStatus.isExceeded);

          const recognizedNames = new Set();
          finalResults.forEach((recipe) => {
            recipe.usedIngredients?.forEach((i) => recognizedNames.add(i.name.toLowerCase()));
            recipe.unusedIngredients?.forEach((i) => recognizedNames.add(i.name.toLowerCase()));
            recipe.extendedIngredients?.forEach((i) => recognizedNames.add((i.name || i.original || '').toLowerCase()));
          });

          const unrecognized = currentIngredients.filter((userChip) => {
            const cleanChip = userChip.toLowerCase().trim();
            return !Array.from(recognizedNames).some((recName) => recName.includes(cleanChip));
          });

          setUnrecognizedItems(unrecognized);
        } else {
          // LOCAL CACHE OFFLINE FALLBACK
          finalResults = getMatchingCachedRecipes(currentIngredients);
        }

        if (!abortControllerRef.current.signal.aborted) {
          setResults(finalResults);
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('API Error:', error);

          if (error.response?.status === 402) {
            setQuotaExceeded('myfridge');
            setIsQuotaExceeded(true);
          } else if (!navigator.onLine) {
            setIsOffline(true);
          }

          const fallbackResults = getMatchingCachedRecipes(currentIngredients);
          setResults(fallbackResults);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }, 1200);
  };
  
  const isSearchDisabled = ingredients.length < MIN_ITEMS && !typedText.trim();
  const quotaStats = getQuotaStatus('myfridge');

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>🥑 What's in My Fridge?</h2>
        <QuotaBadge feature="myfridge" />
      </div>

      <div className="search-container">
        <form onSubmit={handleSearch} className="chip-search-form">
          {ingredients.length >= 2 && (
            <div className="chips-header-row" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.35rem' }}>
              <button 
                type="button" 
                onClick={() => {
                  setIngredients([]);
                  setTypedText('');
                  setUnrecognizedItems([]);
                  setInputError('');
                  setSearched(true);
                  
                  // Revert recipe grid back to default cached recipes
                  const allCached = getCachedRecipes();
                  setResults(allCached.slice(0, 20));
                }} 
                className="clear-all-btn"
                disabled={loading}
              >
                Clear All ({ingredients.length})
              </button>
            </div>
          )}

          <div className={`chips-wrapper ${inputError ? 'input-error' : ''} ${loading ? 'disabled' : ''}`}>
            {ingredients.map((item, index) => (
              <span key={item} className="ingredient-chip">
                {item}
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={() => removeIngredient(index)}
                  className="chip-remove-btn"
                  title="Remove ingredient"
                >
                  ✕
                </button>
              </span>
            ))}

            {ingredients.length < MAX_ITEMS && (
              <input 
                type="text" 
                disabled={loading}
                placeholder={ingredients.length === 0 ? "Type an ingredient & press Enter!" : "Add another..."} 
                value={typedText}
                onChange={(e) => {
                  setTypedText(e.target.value);
                  if (inputError) setInputError('');
                }}
                onKeyDown={handleKeyDown}
                className="chip-input"
              />
            )}
          </div>

          {inputError && <p className="input-error-message">⚠️ {inputError}</p>}

          <div className="quick-add-section">
            <span className="quick-label">Or choose popular ingredients:</span>
            <div className="quick-chips">
              {POPULAR_INGREDIENTS.map((item) => {
                const isAdded = ingredients.includes(item);
                const isMaxed = ingredients.length >= MAX_ITEMS;

                return (
                  <button
                    key={item}
                    type="button"
                    disabled={isAdded || isMaxed || loading}
                    onClick={() => addIngredient(item)}
                    className={`quick-chip-btn ${isAdded ? 'selected' : ''}`}
                  >
                    {isAdded ? '✓ ' : '+ '}{item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-action-row">
            <button 
              type="submit" 
              className={`search-btn ${loading ? 'stop-btn' : ''}`} 
              disabled={!loading && isSearchDisabled}
            >
              {loading ? '⏳ Stop Search' : '🔍 Find Recipes'}
            </button>
            
            <span className={`search-hint ${ingredients.length === MAX_ITEMS ? 'max-reached' : ''}`}>
              {ingredients.length < MIN_ITEMS ? (
                `Add at least ${MIN_ITEMS} ingredients (${ingredients.length}/${MAX_ITEMS})`
              ) : (
                `${ingredients.length}/${MAX_ITEMS} ingredients selected`
              )}
            </span>
          </div>
        </form>
      </div>

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

      {!isQuotaExceeded && unrecognizedItems.length > 0 && (
        <div className="unrecognized-banner">
          <span className="banner-icon">ℹ️</span>
          <div>
            <strong>Note on your search:</strong>
            <p>
              The following item{unrecognizedItems.length > 1 ? 's were' : ' was'} not recognized as active recipe ingredients in our database and {unrecognizedItems.length > 1 ? 'were' : 'was'} ignored:{' '}
              <b>{unrecognizedItems.join(', ')}</b>.
            </p>
          </div>
        </div>
      )}

      {!loading && searched && !inputError && results.length === 0 && (
        <p className="status info">
          No recipes found for your selected ingredients. Try removing or changing an ingredient!
        </p>
      )}

      <div className="grid">
        {results.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}