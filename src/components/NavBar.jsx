import { Link, NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export function Navbar() {
  const { theme = 'light', toggleTheme } = useAppContext() || {};

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <img 
          src="/logo.svg" 
          alt="GreenPlate Logo" 
          className="brand-logo-img"
        />
        <span className="brand-text">
          Green<span className="brand-accent">Plate</span>
        </span>
      </Link>
      
      <div className="links">
        <NavLink to="/search" className={({ isActive }) => (isActive ? 'active' : '')}>
          Veg Search
        </NavLink>
        <NavLink to="/fridge" className={({ isActive }) => (isActive ? 'active' : '')}>
          My Fridge
        </NavLink>
        <NavLink to="/favorites" className={({ isActive }) => (isActive ? 'active' : '')}>
          Favorites
        </NavLink>
        
        <button 
          type="button" 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
    </nav>
  );
}