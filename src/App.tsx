import { useState, useEffect } from 'react';
import LandingPage from './features/landing/LandingPage';
import AuditViewer from './features/audit/AuditViewer';
import AccountingDashboard from './features/accounting/AccountingDashboard';
import './i18n'; // Import i18n configuration

type View = 'landing' | 'audit' | 'dashboard';

function App() {
  const [view, setView] = useState<View>('landing');
  const [auditAccount, setAuditAccount] = useState('');

  // Handle browser back button (simple state routing)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setView(event.state.view);
        if (event.state.account) setAuditAccount(event.state.account);
      } else {
        setView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newView: View, account?: string) => {
    setView(newView);
    if (account) setAuditAccount(account);
    window.history.pushState({ view: newView, account }, '', '');
  };

  return (
    <div className="min-h-screen bg-hive-light text-hive-dark font-sans selection:bg-hive-red selection:text-white">
      {view === 'landing' && (
        <LandingPage 
          onStartAudit={(account) => navigateTo('audit', account)} 
          onGoToDashboard={() => navigateTo('dashboard')}
        />
      )}

      {view === 'audit' && (
        <AuditViewer 
          account={auditAccount} 
          onBack={() => navigateTo('landing')} 
        />
      )}

      {view === 'dashboard' && (
        <div className="animate-fade-in">
          <AccountingDashboard onLogout={() => navigateTo('landing')} />
        </div>
      )}
    </div>
  );
}

export default App;
