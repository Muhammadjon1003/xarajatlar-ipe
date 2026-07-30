import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesInputPage } from './pages/ExpensesInputPage';
import { ExpensesStatsPage } from './pages/ExpensesStatsPage';
import { ExpensesLedgerPage } from './pages/ExpensesLedgerPage';
import { SalariesPage } from './pages/SalariesPage';
import { SalaryPayoutPage } from './pages/SalaryPayoutPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AdvancesPage } from './pages/AdvancesPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { MonthlyAnalysisPage } from './pages/MonthlyAnalysisPage';
import { SettingsPage } from './pages/SettingsPage';
import { MySalaryPage } from './pages/MySalaryPage';
import { AdminPanelPage } from './pages/AdminPanelPage';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400 font-semibold">
        Tizim yuklanmoqda...
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Default landing route based on role
  const getDefaultRoute = () => {
    switch (user.roleCode) {
      case 'TEACHER':
      case 'ADMINISTRATOR':
      case 'EMPLOYEE':
        return '/my-salary';
      case 'PAYROLL_ACCOUNTANT':
        return '/salaries';
      case 'EXPENSE_CLERK':
        return '/expenses-input';
      case 'SUPER_ADMIN':
      case 'MANAGER':
      default:
        return '/dashboard';
    }
  };

  const defaultPath = getDefaultRoute();

  return (
    <div className="min-h-screen bg-[#09090b] flex text-zinc-100">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen max-w-[calc(100vw-16rem)] overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin-panel" element={<AdminPanelPage />} />
          <Route path="/my-salary" element={<MySalaryPage />} />
          <Route path="/expenses-input" element={<ExpensesInputPage />} />
          <Route path="/expenses-stats" element={<ExpensesStatsPage />} />
          <Route path="/expenses-ledger" element={<ExpensesLedgerPage />} />
          <Route path="/monthly-analysis" element={<MonthlyAnalysisPage />} />
          <Route path="/salaries" element={<SalariesPage />} />
          <Route path="/salary-payout" element={<SalaryPayoutPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/advances" element={<AdvancesPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/branches-categories" element={<Navigate to="/settings" replace />} />
          <Route path="/price-settings" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
