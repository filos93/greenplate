import { useState, useCallback } from 'react';
import { searchByFridge } from '../api/spoonacular';
import { getMatchingCachedRecipes, getCachedRecipes } from '../utils/cache';
import { useRecipeSearch } from '../hooks/useRecipeSearch';
import { RecipeCard } from '../components/RecipeCard';
import { QuotaBadge } from '../components/QuotaBadge';
import { isValidStructure, sanitizeInput } from '../utils/validators';
import { StatusBanners } from '../components/StatusBanners';

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
  const [unrecognizedItems, setUnrecognizedItems] = useState([]);
  const [inputError, setInputError] = useState('');

  const MIN_ITEMS = 2;
  const MAX_ITEMS = 5;

  const filterCacheCallback = useCallback((cachedItems, selectedChips) => {
    const matches = getMatchingCachedRecipes(selectedChips);
    return matches.length > 0 ? matches : cachedItems.slice(0, 20);
  }, []);

  const {
    recipes,
    setRecipes,
    loading,
    searched,
    isQuotaExceeded,
    isOffline,
    executeSearch,
    resetToDefaultCache,
    quotaStats
  } = useRecipeSearch('myfridge', searchByFridge, filterCacheCallback);

  const addIngredient = (rawItem) => {
    if (loading || ingredients.length >= MAX_ITEMS) return;
    
    const cleaned = sanitizeInput(rawItem);
    setInputError('');

    if (!isValidStructure(cleaned)) {
      setInputError('Invalid entry: Use 2+ letters (max 2 words). No numbers, symbols, or 3+ repeated letters.');
      return;
    }

    if (!ingredients.includes(cleaned)) {
      const updatedChips = [...ingredients, cleaned];
      setIngredients(updatedChips);
      setTypedText('');

      if (isQuotaExceeded || isOffline) {
        const matches = getMatchingCachedRecipes(updatedChips);
        setRecipes(matches.length > 0 ? matches : getCachedRecipes().slice(0, 20));
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

    if (isQuotaExceeded || isOffline) {
      if (updatedChips.length > 0) {
        const matches = getMatchingCachedRecipes(updatedChips);
        setRecipes(matches.length > 0 ? matches : getCachedRecipes().slice(0, 20));
      } else {
        setRecipes(getCachedRecipes().slice(0, 20));
      }
    }
  };

  const handleSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let currentIngredients = [...ingredients];

    if (typedText.trim() && currentIngredients.length < MAX_ITEMS) {
      const cleaned = sanitizeInput(typedText);
      
      if (!isValidStructure(cleaned)) {
        setInputError('Invalid entry: Must be 2+ letters, max 2 words, no symbols or repeating letters.');
        return;
      }

      if (!currentIngredients.includes(cleaned)) {
        currentIngredients.push(cleaned);
        setIngredients(currentIngredients);
      }
    }

    if (currentIngredients.length < MIN_ITEMS) {
      setInputError(`Please select at least ${MIN_ITEMS} ingredients to search.`);
      return;
    }

    setTypedText('');
    setInputError('');
    setUnrecognizedItems([]);

    executeSearch(currentIngredients, (liveResults) => {
      const recognizedNames = new Set();
      liveResults.forEach((recipe) => {
        recipe.usedIngredients?.forEach((i) => recognizedNames.add(i.name.toLowerCase()));
        recipe.unusedIngredients?.forEach((i) => recognizedNames.add(i.name.toLowerCase()));
        recipe.extendedIngredients?.forEach((i) => recognizedNames.add((i.name || i.original || '').toLowerCase()));
      });

      const unrecognized = currentIngredients.filter((userChip) => {
        const cleanChip = userChip.toLowerCase().trim();
        return !Array.from(recognizedNames).some((recName) => recName.includes(cleanChip));
      });

      setUnrecognizedItems(unrecognized);
    });
  };

  const isSearchDisabled = ingredients.length < MIN_ITEMS && !typedText.trim();

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
                  resetToDefaultCache();
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

      <StatusBanners 
        isQuotaExceeded={isQuotaExceeded} 
        isOffline={isOffline} 
        quotaStats={quotaStats} 
      />

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

      {!loading && searched && !isQuotaExceeded && !inputError && recipes.length === 0 && (
        <p className="status info">
          No recipes found for your selected ingredients. Try removing or changing an ingredient!
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