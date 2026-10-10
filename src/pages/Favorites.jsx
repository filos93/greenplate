import { useAppContext } from '../context/AppContext';
import { RecipeCard } from '../components/RecipeCard';
import { downloadFavoritesBatchPDF } from '../utils/pdfExporter';

export function Favorites() {
  const { favorites = [] } = useAppContext();

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title" style={{ margin: 0 }}>My Favorites ({favorites.length})</h2>
        {favorites.length > 0 && (
          <button 
            type="button"
            onClick={() => downloadFavoritesBatchPDF(favorites)} 
            className="action-btn"
          >
            📚 Export All
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <p className="status info" style={{ opacity: 0.8, fontSize: '1.05rem', marginTop: '1.5rem' }}>
          No saved recipes yet. Click the heart icon on any recipe to save it here!
        </p>
      ) : (
        <div className="grid" style={{ marginTop: '1.5rem' }}>
          {favorites.map((recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              isFavoritesView={true} 
            />
          ))}
        </div>
      )}
    </div>
  );
}