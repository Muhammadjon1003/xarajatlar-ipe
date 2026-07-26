import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/branches
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(branches);
  } catch (error) {
    return res.status(500).json({ error: 'Filiallarni yuklashda xatolik' });
  }
});

// POST /api/branches
router.post('/', authorizeRoles(['SUPER_ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Filial nomi kiritilishi shart' });
    }

    const existing = await prisma.branch.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ error: 'Ushbu nomdagi filial allaqachon mavjud' });
    }

    const branch = await prisma.branch.create({
      data: { name: name.trim() },
    });
    return res.status(201).json(branch);
  } catch (error) {
    return res.status(500).json({ error: 'Filial yaratishda xatolik' });
  }
});

// PUT /api/branches/:id
router.put('/:id', authorizeRoles(['SUPER_ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Filial nomi kiritilishi shart' });
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: { name: name.trim() },
    });
    return res.json(branch);
  } catch (error) {
    return res.status(500).json({ error: 'Filialni tahrirlashda xatolik' });
  }
});

// DELETE /api/branches/:id
router.delete('/:id', authorizeRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.branch.delete({ where: { id } });
    return res.json({ message: 'Filial o‘chirildi' });
  } catch (error) {
    return res.status(500).json({ error: 'Filialni o‘chirishda xatolik' });
  }
});

export default router;
