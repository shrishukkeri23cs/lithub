import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Home, Search, Library as LibraryIcon, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import Logo from './Logo';

const Header = ({ isDarkMode, toggleTheme }) => {
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const { currentUser, logout } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/search', label: 'Discovery', icon: Search },
    { to: '/library', label: 'Library', icon: LibraryIcon },
    { to: '/contributions', label: 'Contributions', icon: FileText },
  ];

  return (
    <>
      {/* Integrated Header (Desktop & Mobile) */}
      <header className="fixed top-0 left-0 right-0 z-30 flex justify-center px-4 md:px-6 pt-4 md:pt-6 pointer-events-none">
        <div className="w-full max-w-7xl h-auto min-h-[64px] md:h-18 px-4 md:px-6 glass-card rounded-2xl md:rounded-3xl flex flex-col md:flex-row justify-between items-center relative pointer-events-auto reveal-1 py-3 md:py-0">
          
          {/* Top Row: Logo and Actions */}
          <div className="w-full md:w-auto flex justify-between items-center">
            <Link to="/" className="flex items-center h-full hover:scale-105 transition-transform duration-300">
              <Logo isDarkMode={isDarkMode} className="w-28 md:w-44 h-auto object-contain" />
            </Link>

            {/* Mobile Actions (Theme & Auth) */}
            <div className="flex md:hidden items-center space-x-3">
              {toggleTheme && (
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-500 dark:text-gray-400"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              {currentUser ? (
                <button className="w-8 h-8 rounded-full bg-brand-navy dark:bg-brand-amber text-brand-amber dark:text-brand-navy flex items-center justify-center text-xs font-bold">
                  {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                </button>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-slate-600 dark:text-gray-400 text-xs font-bold"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          
          {/* Middle Row (Desktop Links) / Bottom Row (Mobile Links) */}
          <nav className="w-full md:w-auto flex justify-around md:justify-center items-center mt-4 md:mt-0 md:space-x-10 text-[11px] md:text-sm font-bold border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`transition-all duration-300 relative flex flex-col md:block items-center px-3 py-1 rounded-xl ${
                    isActive 
                      ? 'text-brand-amber md:bg-transparent' 
                      : 'text-slate-500 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white'
                  }`}
                >
                  <span className="md:hidden mb-1.5">
                    <Icon className={`w-5 h-5 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'opacity-70'}`} />
                  </span>
                  <span className={`${isActive ? 'opacity-100' : 'opacity-80'}`}>
                    {link.label}
                  </span>
                  <span className={`hidden md:block absolute -bottom-1 left-0 w-full h-0.5 bg-brand-amber transform origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                </Link>
              );
            })}
          </nav>

          {/* Desktop Only Actions */}
          <div className="hidden md:flex items-center space-x-5">
            {toggleTheme && (
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-brand-amber/10 hover:border-brand-amber/30 transition-all text-slate-500 dark:text-gray-400 hover:text-brand-amber active:scale-90"
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
                <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all -translate-y-2 group-hover:translate-y-0 z-50">
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="text-slate-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white text-sm font-bold transition-colors"
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
