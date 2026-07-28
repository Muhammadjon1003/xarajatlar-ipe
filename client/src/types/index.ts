export interface Role {
  id: string;
  code: string;
  displayName: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roleCode: string;
  roleDisplayName: string;
}

export interface Branch {
  id: string;
  name: string;
  createdAt: string;
  _count?: { expenses: number };
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  _count?: { expenses: number };
}

export interface Expense {
  id: string;
  name: string;
  value: number;
  date: string;
  receiptUrl?: string | null;
  branchId: string;
  categoryId: string;
  createdById?: string | null;
  branch: Branch;
  category: ExpenseCategory;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role?: { displayName: string };
  } | null;
  createdAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  roleId?: string;
  defaultBaseSalary?: number | null;
  role: Role;
  createdAt: string;
}

export interface SalaryAdvance {
  id: string;
  amount: number;
  date: string;
  reason?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isDeducted: boolean;
  employeeId: string;
  approvedById?: string | null;
  employee: { id: string; firstName: string; lastName: string; phone?: string | null };
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface OneTimeShift {
  id: string;
  date: string;
  amount: number;
  description?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  coveringEmployeeId: string;
  absentEmployeeId: string;
  approvedById?: string | null;
  coveringEmployee: { id: string; firstName: string; lastName: string };
  absentEmployee: { id: string; firstName: string; lastName: string };
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface MonthlySalary {
  id: string;
  month: number;
  year: number;
  baseSalary: number;
  totalAdditions: number;
  totalShiftDeductions: number;
  totalAdvanceDeductions: number;
  finalPayout: number;
  isPaid: boolean;
  paidAt?: string | null;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role?: { displayName: string; code?: string };
  };
  createdAt: string;
}

export interface DashboardSummary {
  summary: {
    totalExpensesThisMonth: number;
    expenseCountThisMonth: number;
    totalSalariesPaidThisMonth: number;
    salariesPaidCountThisMonth: number;
    pendingAdvancesAmount: number;
    pendingAdvancesCount: number;
    activeEmployeesCount: number;
  };
  categoryBreakdown: { id: string; name: string; total: number }[];
  branchBreakdown: { id: string; name: string; total: number }[];
  recentExpenses: Expense[];
}
