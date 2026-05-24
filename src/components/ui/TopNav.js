import React from 'react';

export default function TopNav({ activeTab, setActiveTab, weather, weatherLoading }) {
  const label = {
    home: 'Home',
    inventory: 'Inventory',
    planner: 'Planner',
    favorites: 'Favorites',
    settings: 'Settings',
  }[activeTab] || 'Home';

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <div className="app-logo">🍽️</div>
        <div className="app-name">Kya Banaye?</div>
      </div>

      <div className="top-nav-center">
        <div className="top-nav-pill">
          <span className="top-nav-pill-label">Page</span>
          <select
            className="top-nav-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            aria-label="Navigate"
          >
            <option value="home">🍽️ Home</option>
            <option value="inventory">🛒 Inventory</option>
            <option value="planner">📅 Planner</option>
            <option value="favorites">❤️ Favorites</option>
            <option value="settings">⚙️ Settings</option>
          </select>
        </div>
      </div>

      <div className="top-nav-right">
        <div className="top-nav-weather">
          <div className="weather-emoji">{weather ? (weather.condition?.toLowerCase().includes('rain') ? '🌧️' : weather.condition?.toLowerCase().includes('cloud') ? '⛅' : weather.condition?.toLowerCase().includes('hot') ? '🔥' : '☀️') : '⛅'}</div>
          <div>
            <div className="weather-headline">
              {weather ? `${weather.city ? `${weather.city}, ` : ''}${weather.temp}°C` : 'Loading...'}
            </div>
            <div className="weather-subtitle">{weather ? weather.condition : weatherLoading ? 'Fetching weather…' : 'Weather unavailable'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
