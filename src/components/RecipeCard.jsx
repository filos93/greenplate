import DOMPurify from 'dompurify';
import { useAppContext } from '../context/AppContext';
import { downloadRecipePDF } from '../utils/pdfExporter';

export function RecipeCard({ recipe, showRemoveButton = false, isFavoritesView = false }) {
  const { favorites = [], toggleFavorite } = useAppContext();
  
  // Support both prop names for removing items
  const isRemoveMode = showRemoveButton || isFavoritesView;

  // Check if recipe is saved in global context
  const isSaved = favorites.some((fav) => fav?.id === recipe?.id);

  const rawSummary = recipe?.summary ? recipe.summary.substring(0, 100) + '...' : '';
  const sanitizedSummary = DOMPurify.sanitize(rawSummary);

  return (
    <div className="card">
      <img src={recipe?.image} alt={recipe?.title || 'Recipe'} loading="lazy" />
      
      <div className="card-body">
        <h3>{recipe?.title}</h3>
        
        {recipe?.summary && (
          <p dangerouslySetInnerHTML={{ __html: sanitizedSummary }} />
        )}
        
        <div className="card-actions">
          {isRemoveMode ? (
            /* Favorites Page Mode */
            <button 
              type="button"
              onClick={() => toggleFavorite(recipe)} 
              className="remove-btn"
              title="Remove from favorites"
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-text">Remove</span>
            </button>
          ) : (
            /* Search & MyFridge Pages Mode */
            <button 
              type="button"
              onClick={() => toggleFavorite(recipe)} 
              className={`card-btn card-btn-primary ${isSaved ? 'saved' : ''}`}
              title={isSaved ? 'Recipe saved to favorites' : 'Save recipe'}
            >
              <span className="btn-icon">{isSaved ? '❤️' : '🤍'}</span>
              <span className="btn-text">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          {/* PDF Export Button */}
          <button 
            type="button"
            onClick={() => downloadRecipePDF(recipe)} 
            className="card-btn card-btn-secondary"
            title="Download recipe PDF"
          >
            <span className="btn-icon">📄</span>
            <span className="btn-text btn-text-always">PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}