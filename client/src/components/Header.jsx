import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import Logo from './Logo';

const Header = ({ isDarkMode, toggleTheme }) => {
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const { currentUser, logout } = useAuth();
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 flex justify-center px-6 pt-6 pointer-events-none">
        <div className="w-full max-w-7xl h-16 md:h-18 px-6 glass-card rounded-2xl flex justify-between items-center relative pointer-events-auto reveal-1">
          <Link to="/" className="flex items-center h-full hover:scale-105 transition-transform duration-300">
            <Logo isDarkMode={isDarkMode} className="w-36 md:w-44 h-auto object-contain ml-1" />
          </Link>
          
          <nav className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center space-x-10 text-sm font-bold">
          <Link 
            to="/" 
            className={`${location.pathname === '/' ? 'text-brand-amber' : 'text-slate-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white'} transition-all duration-300 relative group`}
          >
            Home
            <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand-amber transform origin-left transition-transform duration-300 ${location.pathname === '/' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
          </Link>
          <Link 
            to="/search" 
            className={`${location.pathname === '/search' ? 'text-brand-amber' : 'text-slate-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white'} transition-all duration-300 relative group`}
          >
            Discovery
            <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand-amber transform origin-left transition-transform duration-300 ${location.pathname === '/search' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
          </Link>
          <Link 
            to="/library" 
            className={`${location.pathname === '/library' ? 'text-brand-amber' : 'text-slate-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white'} transition-all duration-300 relative group`}
          >
            Library
            <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand-amber transform origin-left transition-transform duration-300 ${location.pathname === '/library' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
          </Link>
          <Link 
            to="/contributions" 
            className={`${location.pathname === '/contributions' ? 'text-brand-amber' : 'text-slate-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white'} transition-all duration-300 relative group`}
          >
            Contributions
            <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand-amber transform origin-left transition-transform duration-300 ${location.pathname === '/contributions' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
          </Link>
        </nav>

        <div className="flex items-center space-x-5">
          {toggleTheme && (
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-brand-amber/10 hover:border-brand-amber/30 transition-all text-slate-500 dark:text-gray-400 hover:text-brand-amber active:scale-90"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
          {currentUser ? (
            <div className="relative group">
              <button className="flex items-center space-x-2 text-sm font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                <div className="w-6 h-6 rounded-full bg-brand-navy dark:bg-brand-amber text-brand-amber dark:text-brand-navy flex items-center justify-center text-xs">
                  {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden md:inline">{currentUser.displayName || 'User'}</span>
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all -translate-y-2 group-hover:translate-y-0 reveal-1">
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden sm:block text-slate-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white text-sm font-bold transition-colors"
            >
              Sign In
            </button>
          )}
          <Link to="/search" className="premium-button bg-brand-amber text-brand-navy px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-amber/20">
            Get Started
          </Link>
        </div>
        </div>
      </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Header;
