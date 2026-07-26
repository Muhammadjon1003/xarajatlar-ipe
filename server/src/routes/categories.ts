import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/categories
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      include: {
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Kategoriyalarni yuklashda xatolik' });
  }
});

// POST /api/categories
router.post('/', authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'EXPENSE_CLERK']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Kategoriya nomi kiritilishi shart' });
    }

    const existing = await prisma.expenseCategory.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ error: 'Ushbu nomdagi kategoriya allaqachon mavjud' });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Kategoriya yaratishda xatolik' });
  }
});

// PUT /api/categories/:id
router.put('/:id', authorizeRoles(['SUPER_ADMIN', 'MANAGER', 'EXPENSE_CLERK']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Kategoriya nomi kiritilishi shart' });
    }

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });
    return res.json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Kategoriyani tahrirlashda xatolik' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authorizeRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expenseCategory.delete({ where: { id } });
    return res.json({ message: 'Kategoriya o‘chirildi' });
  } catch (error) {
    return res.status(500).json({ error: 'Kategoriyani o‘chirishda xatolik' });
  }
});

export default router;
