import { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 1. Initialize Theme (Namespaced key)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('greenplate_theme') || 'light';
  });

  // 2. Initialize Favorites (Loads full cached recipe objects)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('greenplate_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. Sync Theme to DOM and LocalStorage
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('greenplate_theme', theme);
  }, [theme]);

  // 4. Sync Favorites to LocalStorage (Caches full ingredients/steps automatically)
  useEffect(() => {
    localStorage.setItem('greenplate_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // 5. Actions
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  
  const toggleFavorite = (recipe) => {
    setFavorites(prev => 
      prev.some(fav => fav.id === recipe.id) 
        ? prev.filter(fav => fav.id !== recipe.id)
        : [...prev, recipe] // Appends the FULL mock/API recipe object
    );
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, favorites, toggleFavorite }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);