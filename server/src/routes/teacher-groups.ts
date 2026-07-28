import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

// GET /api/teacher-groups?teacherId=&month=&year=
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, month, year } = req.query;

    const where: any = {};
    if (teacherId) where.teacherId = String(teacherId);
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const groups = await prisma.teacherGroupSalary.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return res.json(groups);
  } catch (err) {
    return res.status(500).json({ error: 'Guruhlarni yuklashda xatolik' });
  }
});

// POST /api/teacher-groups
// Body: { teacherId, salaryRecordId, month, year, groups: [{ groupName, studentCount, archiveCount, groupSalary }] }
router.post(
  '/',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { teacherId, salaryRecordId, month, year, groups } = req.body;

      if (!teacherId || !month || !year || !Array.isArray(groups) || groups.length === 0) {
        return res.status(400).json({ error: "teacherId, month, year va guruhlar ro'yxati shart" });
      }

      // Delete existing groups for this teacher/month/year and re-insert
      await prisma.teacherGroupSalary.deleteMany({
        where: { teacherId, month: Number(month), year: Number(year) },
      });

      const created = await prisma.teacherGroupSalary.createMany({
        data: groups.map((g: any) => ({
          teacherId,
          month: Number(month),
          year: Number(year),
          groupName: g.groupName,
          studentCount: Number(g.studentCount || 0),
          archiveCount: Number(g.archiveCount || 0),
          groupSalary: Number(g.groupSalary || 0),
        })),
      });

      // Calculate total salary from all groups
      const totalSalary = groups.reduce((sum: number, g: any) => sum + Number(g.groupSalary || 0), 0);

      // Update the MonthlySalary record
      if (salaryRecordId) {
        const existing = await prisma.monthlySalary.findUnique({ where: { id: salaryRecordId } });
        if (existing) {
          const finalPayout = Math.max(
            0,
            totalSalary +
              Number(existing.totalAdditions) -
              Number(existing.totalShiftDeductions) -
              Number(existing.totalAdvanceDeductions)
          );
          await prisma.monthlySalary.update({
            where: { id: salaryRecordId },
            data: { baseSalary: totalSalary, finalPayout },
          });
          // Update employee's defaultBaseSalary
          await prisma.employee.update({
            where: { id: teacherId },
            data: { defaultBaseSalary: totalSalary },
          });
        }
      }

      return res.status(201).json({ created: created.count, totalSalary });
    } catch (err) {
      console.error('Teacher groups save error:', err);
      return res.status(500).json({ error: 'Guruhlarni saqlashda xatolik' });
    }
  }
);

// DELETE /api/teacher-groups/:id
router.delete(
  '/:id',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT']),
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.teacherGroupSalary.delete({ where: { id: req.params.id } });
      return res.json({ message: "Guruh o'chirildi" });
    } catch (err) {
      return res.status(500).json({ error: "Guruhni o'chirishda xatolik" });
    }
  }
);

export default router;
