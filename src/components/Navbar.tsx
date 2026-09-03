import React, { useState } from 'react';
import {
  Cpu,
  Smartphone,
  Calculator,
  Scale,
  Layers,
  User,
  Shield,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHardware } from '../context/HardwareContext';

export type ActiveTab = 'landing' | 'pc-diag' | 'calculators' | 'comparator' | 'smartphones' | 'catalog' | 'account' | 'admin' | 'support';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { isDarkMode, toggleDarkMode, user, isAdmin } = useAuth();
  const { recentSearches, addRecentSearch } = useHardware();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'pc-diag', label: 'Diagnóstico PC', icon: Cpu },
    { id: 'calculators', label: 'Calculadoras', icon: Calculator },
    { id: 'comparator', label: 'Comparador PC', icon: Scale },
    { id: 'smartphones', label: 'Smartphones', icon: Smartphone },
    { id: 'catalog', label: 'Catálogo', icon: Layers },
    { id: 'account', label: 'Cuenta', icon: User },
    { id: 'admin', label: 'Admin', icon: Shield }
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      setActiveTab('pc-diag');
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 bg-[#0F1218] border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            id="nav-brand-logo-btn"
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center transform rotate-12 shadow-md shadow-cyan-500/20 group-hover:rotate-0 transition-transform duration-200">
              <span className="text-white font-bold text-lg -rotate-12 group-hover:rotate-0 transition-transform">E</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white">
                EMBUDO<span className="text-cyan-500">.tech</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:inline-block">
                v2.6
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`transition-colors cursor-pointer uppercase text-xs font-semibold tracking-wider ${
                    isActive
                      ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1 font-bold'
                      : 'hover:text-white'
                  }`}
                >
                  {item.label}
                  {item.id === 'admin' && isAdmin && (
                    <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-3">
            {/* Quick Search Button */}
            <button
              id="nav-quick-search-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Búsqueda rápida"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              id="nav-theme-toggle-btn"
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Historial Button */}
            <button
              id="nav-history-btn"
              onClick={() => handleNavClick('account')}
              className="hidden sm:block px-4 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all cursor-pointer uppercase tracking-wider"
            >
              HISTORIAL
            </button>

            {/* Login / User Status */}
            <button
              id="nav-user-status-btn"
              onClick={() => handleNavClick('account')}
              className="px-4 sm:px-5 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-white/80'}`} />
              <span>{user ? (user.displayName || user.email?.split('@')[0] || 'CUENTA') : 'LOGIN'}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              id="nav-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Quick Search Bar Drawer */}
        {searchOpen && (
          <div className="py-3 px-2 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                id="nav-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar procesador, tarjeta gráfica o SoC (ej: Ryzen 7 7800X3D, RTX 5070 Ti, 8 Elite)..."
                className="w-full pl-9 pr-24 py-2.5 text-xs bg-[#1C222D] border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg cursor-pointer transition-colors uppercase tracking-wider"
              >
                Buscar
              </button>
            </form>

            {/* Recent search chips */}
            {recentSearches.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recientes:</span>
                {recentSearches.slice(0, 5).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(q);
                      setActiveTab('pc-diag');
                      setSearchOpen(false);
                    }}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-[#1C222D] text-slate-300 hover:text-cyan-300 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#0F1218] px-4 pt-2 pb-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-[#151921]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
