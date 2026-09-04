import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HardwareProvider } from './context/HardwareContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { Footer } from './components/Footer';

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

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const { isDarkMode } = useAuth();

  // Sync with browser hash on initial load and popstate
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ActiveTab;
      const validTabs: ActiveTab[] = ['landing', 'pc-diag', 'calculators', 'comparator', 'smartphones', 'catalog', 'account', 'admin', 'support'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    handleHashChange();
    window.addEventListener('popstate', handleHashChange);
    return () => window.removeEventListener('popstate', handleHashChange);
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

      {/* Main Dynamic View Outlet */}
      <main className="flex-1 pt-6 px-3 sm:px-6 max-w-7xl w-full mx-auto">
        {activeTab === 'landing' && <HomeLandingView setActiveTab={handleTabChange} />}
        {activeTab === 'pc-diag' && <PcDiagnosisView />}
        {activeTab === 'calculators' && <CalculatorsView />}
        {activeTab === 'comparator' && <PcComparatorView />}
        {activeTab === 'smartphones' && <SmartphonesView />}
        {activeTab === 'catalog' && <CatalogView setActiveTab={handleTabChange} />}
        {activeTab === 'account' && <AccountView setActiveTab={handleTabChange} />}
        {activeTab === 'admin' && <AdminView />}
        {activeTab === 'support' && <LegalSupportView />}
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
