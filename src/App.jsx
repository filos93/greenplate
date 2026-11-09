import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';

// Page Imports
import { Home } from './pages/Home';
import { VegSearch } from './pages/VegSearch';
import { MyFridge } from './pages/MyFridge';
import { Favorites } from './pages/Favorites';

const unusedDevOpsTestVariable = "trigger_eslint_error";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />

        {/* Temporary Sentry Incident Simulation Button
        <div style={{ textAlign: 'center', margin: '15px 0' }}>
          <button
            onClick={() => {
              throw new Error("DevOps Incident Simulation: Sentry Test Crash");
            }}
            style={{
              backgroundColor: '#e53e3e',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ⚠️ Simulate Production Crash
          </button>
        </div>
        */}

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
