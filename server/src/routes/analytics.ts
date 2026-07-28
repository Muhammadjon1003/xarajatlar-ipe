import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

// GET /api/analytics/dashboard
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Total expenses this month
    const totalExpensesMonth = await prisma.expense.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { value: true },
      _count: { id: true },
    });

    // 2. Total salaries paid this month
    const totalSalariesPaidMonth = await prisma.monthlySalary.aggregate({
      where: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        isPaid: true,
      },
      _sum: { finalPayout: true },
      _count: { id: true },
    });

    // 3. Pending Advances
    const pendingAdvances = await prisma.salaryAdvance.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 4. Active Employees count
    const activeEmployeesCount = await prisma.employee.count({
      where: { isActive: true },
    });

    // 5. Category Breakdown for current month
    const categoryStats = await prisma.expenseCategory.findMany({
      select: {
        id: true,
        name: true,
        expenses: {
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
          select: { value: true },
        },
      },
    });

    const categoryBreakdown = categoryStats
      .map((cat) => {
        const total = cat.expenses.reduce((sum, e) => sum + Number(e.value), 0);
        return { id: cat.id, name: cat.name, total };
      })
      .filter((cat) => cat.total > 0)
      .sort((a, b) => b.total - a.total);

    // 6. Branch Breakdown for current month
    const branchStats = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        expenses: {
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
          select: { value: true },
        },
      },
    });

    const branchBreakdown = branchStats.map((b) => {
      const total = b.expenses.reduce((sum, e) => sum + Number(e.value), 0);
      return { id: b.id, name: b.name, total };
    });

    // 7. Recent Expenses (last 5)
    const recentExpenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        branch: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    return res.json({
      summary: {
        totalExpensesThisMonth: Number(totalExpensesMonth._sum.value || 0),
        expenseCountThisMonth: totalExpensesMonth._count.id,
        totalSalariesPaidThisMonth: Number(totalSalariesPaidMonth._sum.finalPayout || 0),
        salariesPaidCountThisMonth: totalSalariesPaidMonth._count.id,
        pendingAdvancesAmount: Number(pendingAdvances._sum.amount || 0),
        pendingAdvancesCount: pendingAdvances._count.id,
        activeEmployeesCount,
      },
      categoryBreakdown,
      branchBreakdown,
      recentExpenses,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Statistikalarni yuklashda xatolik' });
  }
});

// GET /api/analytics/monthly-analysis?month=7&year=2026
router.get('/monthly-analysis', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const targetMonth = Number(req.query.month) || now.getMonth() + 1;
    const targetYear = Number(req.query.year) || now.getFullYear();

    // 1. Total Aktivs Count (for target month/year)
    const aktivAgg = await prisma.administratorAktiv.aggregate({
      where: { month: targetMonth, year: targetYear },
      _sum: { aktivCount: true },
    });
    const totalAktivs = Number(aktivAgg._sum.aktivCount || 0);

    // 2. Total Archives Count (for target month/year)
    const archiveAgg = await prisma.teacherGroupSalary.aggregate({
      where: { month: targetMonth, year: targetYear },
      _sum: { archiveCount: true },
    });
    const totalArchives = Number(archiveAgg._sum.archiveCount || 0);

    // 3. Employee Counts & Breakdown
    const activeEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { role: { select: { code: true, displayName: true } } },
    });

    const teacherCount = activeEmployees.filter((e) => e.role.code === 'TEACHER').length;
    const adminCount = activeEmployees.filter((e) => e.role.code === 'ADMINISTRATOR').length;
    const managerCount = activeEmployees.filter((e) => e.role.code === 'MANAGER' || e.role.code === 'SUPER_ADMIN').length;
    const otherStaffCount = activeEmployees.length - (teacherCount + adminCount + managerCount);

    // 4. Monthly Salaries for Target Month/Year
    // NOTE: Total Salary earned = finalPayout + totalAdvanceDeductions (bcs advances are also salary paid earlier!)
    const monthlySalaries = await prisma.monthlySalary.findMany({
      where: { month: targetMonth, year: targetYear },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { displayName: true, code: true } },
          },
        },
      },
    });

    let totalSalaryExpense = 0;
    const allEarners = monthlySalaries.map((s) => {
      const baseSalary = Number(s.baseSalary || 0);
      const totalAdditions = Number(s.totalAdditions || 0);
      const shiftDeductions = Number(s.totalShiftDeductions || 0);
      const advanceDeductions = Number(s.totalAdvanceDeductions || 0);
      const finalPayout = Number(s.finalPayout || 0);

      // Total earned salary for the month (before advance deductions)
      const totalEarned = finalPayout + advanceDeductions;
      totalSalaryExpense += totalEarned;

      return {
        id: s.id,
        employeeId: s.employeeId,
        firstName: s.employee?.firstName || '',
        lastName: s.employee?.lastName || '',
        roleName: s.employee?.role?.displayName || 'Xodim',
        roleCode: s.employee?.role?.code || '',
        baseSalary,
        totalAdditions,
        shiftDeductions,
        advanceDeductions,
        finalPayout,
        totalEarned,
        isPaid: s.isPaid,
      };
    }).sort((a, b) => b.totalEarned - a.totalEarned);

    // Top Earners (all staff ordered by totalEarned desc)
    const topEarners = allEarners;

    // 5. Teachers Leaderboard (Fewest Archives)
    const teacherGroupRecords = await prisma.teacherGroupSalary.findMany({
      where: { month: targetMonth, year: targetYear },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { displayName: true } },
          },
        },
      },
    });

    // Group by teacherId
    const teacherStatsMap: Record<string, { teacherId: string; name: string; totalStudents: number; totalArchives: number; totalGroupSalary: number; groupCount: number }> = {};
    for (const record of teacherGroupRecords) {
      const tid = record.teacherId;
      if (!teacherStatsMap[tid]) {
        teacherStatsMap[tid] = {
          teacherId: tid,
          name: `${record.teacher?.firstName} ${record.teacher?.lastName}`,
          totalStudents: 0,
          totalArchives: 0,
          totalGroupSalary: 0,
          groupCount: 0,
        };
      }
      teacherStatsMap[tid].totalStudents += Number(record.studentCount || 0);
      teacherStatsMap[tid].totalArchives += Number(record.archiveCount || 0);
      teacherStatsMap[tid].totalGroupSalary += Number(record.groupSalary || 0);
      teacherStatsMap[tid].groupCount += 1;
    }

    const allTeachersStats = Object.values(teacherStatsMap).sort((a, b) => a.totalArchives - b.totalArchives);

    // 6. Administrators Leaderboard (Most Aktivs)
    const adminAktivRecords = await prisma.administratorAktiv.findMany({
      where: { month: targetMonth, year: targetYear },
      include: {
        administrator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { displayName: true } },
          },
        },
      },
    });

    const allAdminsStats = adminAktivRecords.map((rec) => ({
      administratorId: rec.administratorId,
      name: `${rec.administrator?.firstName} ${rec.administrator?.lastName}`,
      aktivCount: rec.aktivCount,
      aktivPrice: Number(rec.aktivPrice),
      baseSalary: Number(rec.baseSalary),
      totalSalary: Number(rec.totalSalary),
    })).sort((a, b) => b.aktivCount - a.aktivCount);

    // 7. Advance Salary Overview (for selected month/year)
    const startOfTargetMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfTargetMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const advancesForMonth = await prisma.salaryAdvance.findMany({
      where: {
        date: { gte: startOfTargetMonth, lte: endOfTargetMonth },
      },
    });

    const approvedAdvances = advancesForMonth.filter((a) => a.status === 'APPROVED');
    const pendingAdvances = advancesForMonth.filter((a) => a.status === 'PENDING');
    const approvedTotal = approvedAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const pendingTotal = pendingAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);

    // 8. Annual Expense Line Graph Data (Months 1 - 12 of targetYear)
    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const annualChartData = [];

    for (let m = 1; m <= 12; m++) {
      const mSalaries = await prisma.monthlySalary.findMany({
        where: { month: m, year: targetYear },
      });

      const mStart = new Date(targetYear, m - 1, 1);
      const mEnd = new Date(targetYear, m, 0, 23, 59, 59);

      const mApprovedAdvances = await prisma.salaryAdvance.aggregate({
        where: { date: { gte: mStart, lte: mEnd }, status: 'APPROVED' },
        _sum: { amount: true },
      });

      const mPendingAdvances = await prisma.salaryAdvance.aggregate({
        where: { date: { gte: mStart, lte: mEnd }, status: 'PENDING' },
        _sum: { amount: true },
      });

      const basePaidSalaries = mSalaries.filter((s) => s.isPaid).reduce((sum, s) => sum + Number(s.finalPayout || 0), 0);
      const advancesGiven = Number(mApprovedAdvances._sum.amount || 0);
      const advancesPending = Number(mPendingAdvances._sum.amount || 0);
      const totalMonthlyPayout = mSalaries.reduce((sum, s) => sum + (Number(s.finalPayout || 0) + Number(s.totalAdvanceDeductions || 0)), 0);

      annualChartData.push({
        month: m,
        monthName: monthNames[m - 1],
        basePaidSalaries,
        advancesGiven,
        advancesPending,
        totalMonthlyPayout,
      });
    }

    return res.json({
      targetMonth,
      targetYear,
      kpis: {
        totalAktivs,
        totalArchives,
        totalEmployees: activeEmployees.length,
        teacherCount,
        adminCount,
        managerCount,
        otherStaffCount,
        totalSalaryExpense,
      },
      annualChartData,
      topEarners,
      allTeachersStats,
      allAdminsStats,
      advanceOverview: {
        approvedTotal,
        pendingTotal,
        approvedCount: approvedAdvances.length,
        pendingCount: pendingAdvances.length,
      },
    });
  } catch (error) {
    console.error('Monthly analysis error:', error);
    return res.status(500).json({ error: 'Oylik tahlil statistikasini yuklashda xatolik' });
  }
});

export default router;
