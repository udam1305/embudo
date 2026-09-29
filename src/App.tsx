import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HardwareProvider } from './context/HardwareContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

// Views
import { HomeLandingView } from './views/HomeLandingView';
import { PcDiagnosisView } from './views/PcDiagnosisView';
import { CalculatorsView } from './views/CalculatorsView';
import { PcComparatorView } from './views/PcComparatorView';
import { SmartphonesView } from './views/SmartphonesView';
import { CatalogView } from './views/CatalogView';
import { AccountView } from './views/AccountView';
import { AdminView } from './views/AdminView';
import { LegalSupportView } from './views/LegalSupportView';

const VALID_TABS: ActiveTab[] = ['landing', 'pc-diag', 'calculators', 'comparator', 'smartphones', 'catalog', 'account', 'admin', 'support'];

function resolveTabString(raw: string): ActiveTab | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase().replace(/^[#/]+/, '').replace(/\/+$/, '').split('?')[0];
  if (!clean) return null;

  if (VALID_TABS.includes(clean as ActiveTab)) {
    return clean as ActiveTab;
  }

  // Common aliases and variations (e.g. /#pc-diag, /pc-diag, #/pc-diag)
  if (clean === 'pc-diag' || clean === 'pc_diag' || clean === 'pcdiag' || clean === 'diag' || clean === 'diagnostico') {
    return 'pc-diag';
  }
  if (clean === 'calculators' || clean === 'calculadora' || clean === 'calculadoras') {
    return 'calculators';
  }
  if (clean === 'comparator' || clean === 'comparador') {
    return 'comparator';
  }
  if (clean === 'smartphones' || clean === 'phones' || clean === 'celulares' || clean === 'moviles') {
    return 'smartphones';
  }
  if (clean === 'catalog' || clean === 'catalogo') {
    return 'catalog';
  }
  if (clean === 'account' || clean === 'cuenta' || clean === 'perfil') {
    return 'account';
  }
  if (clean === 'support' || clean === 'soporte' || clean === 'ayuda') {
    return 'support';
  }
  return null;
}

function getTabFromLocation(): ActiveTab {
  try {
    // 1. Check hash first (e.g. #pc-diag, #/pc-diag)
    const fromHash = resolveTabString(window.location.hash);
    if (fromHash) return fromHash;

    // 2. Check path (e.g. /pc-diag, /#pc-diag)
    const fromPath = resolveTabString(window.location.pathname);
    if (fromPath) return fromPath;
  } catch {
    // fallback safe
  }
  return 'landing';
}

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => getTabFromLocation());
  const { isDarkMode } = useAuth();

  // Sync with browser hash and path changes on initial load, hashchange and popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const detected = getTabFromLocation();
      if (detected) {
        setActiveTab(detected);
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 antialiased font-sans transition-colors duration-200 ${isDarkMode ? 'bg-[#0A0C10] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Dynamic View Outlet wrapped in ErrorBoundary */}
      <main className="flex-1 pt-6 px-3 sm:px-6 max-w-7xl w-full mx-auto">
        <ErrorBoundary fallbackTitle="Error al cargar esta sección" onReset={() => setActiveTab('pc-diag')}>
          {activeTab === 'landing' && <HomeLandingView setActiveTab={handleTabChange} />}
          {activeTab === 'pc-diag' && <PcDiagnosisView />}
          {activeTab === 'calculators' && <CalculatorsView />}
          {activeTab === 'comparator' && <PcComparatorView />}
          {activeTab === 'smartphones' && <SmartphonesView />}
          {activeTab === 'catalog' && <CatalogView setActiveTab={handleTabChange} />}
          {activeTab === 'account' && <AccountView setActiveTab={handleTabChange} />}
          {activeTab === 'admin' && <AdminView />}
          {activeTab === 'support' && <LegalSupportView />}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer setActiveTab={handleTabChange} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HardwareProvider>
        <MainContent />
      </HardwareProvider>
    </AuthProvider>
  );
}
