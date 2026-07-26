import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesInputPage } from './pages/ExpensesInputPage';
import { ExpensesStatsPage } from './pages/ExpensesStatsPage';
import { ExpensesLedgerPage } from './pages/ExpensesLedgerPage';
import { SalariesPage } from './pages/SalariesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AdvancesPage } from './pages/AdvancesPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { BranchesCategoriesPage } from './pages/BranchesCategoriesPage';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses-input');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400 font-semibold">
        Tizim yuklanmoqda...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'expenses-input':
        return <ExpensesInputPage />;
      case 'expenses-stats':
        return <ExpensesStatsPage />;
      case 'expenses-ledger':
        return <ExpensesLedgerPage />;
      case 'salaries':
        return <SalariesPage />;
      case 'employees':
        return <EmployeesPage />;
      case 'advances':
        return <AdvancesPage />;
      case 'shifts':
        return <ShiftsPage />;
      case 'branches-categories':
        return <BranchesCategoriesPage />;
      default:
        return <ExpensesInputPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex text-zinc-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 ml-64 p-8 min-h-screen max-w-[calc(100vw-16rem)] overflow-x-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
