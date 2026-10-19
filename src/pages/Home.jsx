import { useState } from 'react';

export function Home() {
  const [activeTab, setActiveTab] = useState('mission');

  return (
    <div className="page home-page">
      {/* Hero Header Section */}
      <section className="hero-section">
        <h1>Cook Smarter, Waste Less 🌱</h1>
        <p className="hero-subtitle">
          Discover 100% plant-based recipes, match what’s in your fridge, and save your favorites effortlessly.
        </p>
      </section>

      {/* Tab Navigation Section */}
      <section className="info-tabs-section">
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'mission' ? 'active' : ''}`}
            onClick={() => setActiveTab('mission')}
          >
            🎯 Our Mission
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            🛠️ Tool Features
          </button>
          <button 
            className={`tab-btn ${activeTab === 'how-it-works' ? 'active' : ''}`}
            onClick={() => setActiveTab('how-it-works')}
          >
            💡 How It Works
          </button>
        </div>

        {/* Tab Panel Content Container */}
        <div className="tab-content-card">
          {activeTab === 'mission' && (
            <div className="tab-pane">
              <h3 className="tab-title">Empowering Sustainable & Healthy Eating</h3>
              
              <p className="tab-text">
                Vegetarian cooking should be effortless, vibrant, and accessible to everyone. Whether you are plant-based full-time or simply reducing food waste, we connect you directly to curated recipes—no fluff, no ads, just great food.
              </p>

              <ul className="tab-list">
                <li>
                  <span className="icon">🌿</span>
                  <span><strong>100% Vegetarian Focused:</strong> Every query automatically enforces strict plant-based filters.</span>
                </li>
                <li>
                  <span className="icon">📉</span>
                  <span><strong>Zero Food Waste:</strong> Match available ingredients in your fridge directly to executable recipes.</span>
                </li>
                <li>
                  <span className="icon">⚡</span>
                  <span><strong>Lightweight & Fast:</strong> Optimized for instant search, quick reference, and clean PDF exports.</span>
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="tab-pane">
              <h3 className="tab-title">Core Features & Capabilities</h3>
              <div className="tools-grid">
                <div className="tool-card">
                  <h4>🔍 Smart Recipe Search</h4>
                  <p>Explore vegetarian dishes with low-latency debouncing and responsive filter controls.</p>
                </div>
                <div className="tool-card">
                  <h4>🧊 My Fridge Matcher</h4>
                  <p>Input ingredients sitting in your pantry to generate recipe ideas ranked by match quality.</p>
                </div>
                <div className="tool-card">
                  <h4>❤️ Favorites & Batch PDF</h4>
                  <p>Save recipes to your library and export individual cards or full batch PDFs for meal planning.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'how-it-works' && (
            <div className="tab-pane">
              <h3 className="tab-title">Getting Started in 3 Steps</h3>
              
              <div className="steps-container">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Explore or Search</h4>
                    <p>Type dish titles or ingredients into the search bar to discover plant-based meals.</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Use What You Have</h4>
                    <p>Head to <em>My Fridge</em> and enter available staples to minimize food waste.</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Save & Export</h4>
                    <p>Save recipes to <em>Favorites</em> and download crisp PDF recipe cards anytime.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}