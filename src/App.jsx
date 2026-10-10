import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/NavBar';

// Page Imports
import { Home } from './pages/Home';
import { VegSearch } from './pages/VegSearch';
import { MyFridge } from './pages/MyFridge';
import { Favorites } from './pages/Favorites';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<VegSearch />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/fridge" element={<MyFridge />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}