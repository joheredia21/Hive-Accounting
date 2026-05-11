import AccountingDashboard from './features/accounting/AccountingDashboard';

function App() {
  return (
    <div className="min-h-screen bg-hive-light text-hive-dark font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Hive Logo Mock */}
            <div className="w-8 h-8 bg-hive-red rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-hive-dark to-gray-600">
              Hive Accounting
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AccountingDashboard />
      </main>
    </div>
  );
}

export default App;
