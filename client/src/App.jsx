import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Contributions from './pages/Contributions';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { DiscoveryProvider } from './context/DiscoveryContext';

function AppContent({ isDarkMode, toggleTheme }) {
  const location = useLocation();
  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing isDarkMode={isDarkMode} />} />
          <Route path="/search" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/contributions" element={<Contributions />} />
        </Routes>
      </main>
      {location.pathname === '/' && <Footer />}
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <AuthProvider>
      <DiscoveryProvider>
        <Router>
          <AppContent isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        </Router>
      </DiscoveryProvider>
    </AuthProvider>
  );
}

export default App;
