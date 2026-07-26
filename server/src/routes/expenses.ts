import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/expenses
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, categoryId, startDate, endDate, search, year, month } = req.query;

    const whereClause: any = {};

    if (branchId && typeof branchId === 'string') {
      whereClause.branchId = branchId;
    }
    if (categoryId && typeof categoryId === 'string') {
      whereClause.categoryId = categoryId;
    }
    if (startDate && typeof startDate === 'string') {
      whereClause.date = { ...whereClause.date, gte: new Date(startDate) };
    }
    if (endDate && typeof endDate === 'string') {
      whereClause.date = { ...whereClause.date, lte: new Date(endDate) };
    }
    if (year && typeof year === 'string') {
      const y = Number(year);
      if (month && typeof month === 'string') {
        const m = Number(month);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59);
        whereClause.date = { gte: start, lte: end };
      } else {
        const start = new Date(y, 0, 1);
        const end = new Date(y, 11, 31, 23, 59, 59);
        whereClause.date = { gte: start, lte: end };
      }
    }
    if (search && typeof search === 'string') {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        branch: true,
        category: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { displayName: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ error: 'Xarajatlarni yuklashda xatolik' });
  }
});

// POST /api/expenses
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, value, date, receiptUrl, branchId, categoryId, createdById } = req.body;

    if (!name || value === undefined || !date || !branchId || !categoryId) {
      return res.status(400).json({ error: 'Barcha majburiy maydonlarni to‘ldiring' });
    }

    const creatorId = createdById || req.user?.id || null;

    const expense = await prisma.expense.create({
      data: {
        name: name.trim(),
        value: Number(value),
        date: new Date(date),
        receiptUrl: receiptUrl || null,
        branchId,
        categoryId,
        createdById: creatorId,
      },
      include: {
        branch: true,
        category: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { displayName: true } },
          },
        },
      },
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ error: 'Xarajatni saqlashda xatolik' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, value, date, receiptUrl, branchId, categoryId, createdById } = req.body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        name: name.trim(),
        value: Number(value),
        date: new Date(date),
        receiptUrl: receiptUrl || null,
        branchId,
        categoryId,
        createdById: createdById || undefined,
      },
      include: {
        branch: true,
        category: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { displayName: true } },
          },
        },
      },
    });

    return res.json(expense);
  } catch (error) {
    return res.status(500).json({ error: 'Xarajatni tahrirlashda xatolik' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    return res.json({ message: 'Xarajat o‘chirildi' });
  } catch (error) {
    return res.status(500).json({ error: 'Xarajatni o‘chirishda xatolik' });
  }
});

export default router;
