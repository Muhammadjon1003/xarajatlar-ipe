import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

const DEFAULT_SETTINGS = {
  zamenaPrice: 250000,
  adminBaseSalary: 5000000,
  adminAktivPrice: 50000,
};

// GET /api/settings
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.systemPriceSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        zamenaPrice: 250000.0,
        adminBaseSalary: 5000000.0,
        adminAktivPrice: 50000.0,
      },
    });

    return res.json({
      zamenaPrice: Number(settings.zamenaPrice || 250000),
      adminBaseSalary: Number(settings.adminBaseSalary || 5000000),
      adminAktivPrice: Number(settings.adminAktivPrice || 50000),
    });
  } catch (error) {
    console.error('Fetch settings fallback:', error);
    // Graceful fallback if table is initializing on Vercel DB
    return res.json(DEFAULT_SETTINGS);
  }
});

// PUT /api/settings
router.put(
  '/',
  authorizeRoles(['SUPER_ADMIN', 'MANAGER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { zamenaPrice, adminBaseSalary, adminAktivPrice } = req.body;

      const dataToUpdate: any = {};
      if (zamenaPrice !== undefined) dataToUpdate.zamenaPrice = Number(zamenaPrice);
      if (adminBaseSalary !== undefined) dataToUpdate.adminBaseSalary = Number(adminBaseSalary);
      if (adminAktivPrice !== undefined) dataToUpdate.adminAktivPrice = Number(adminAktivPrice);

      const updated = await prisma.systemPriceSettings.upsert({
        where: { id: 'default' },
        update: dataToUpdate,
        create: {
          id: 'default',
          zamenaPrice: zamenaPrice !== undefined ? Number(zamenaPrice) : 250000.0,
          adminBaseSalary: adminBaseSalary !== undefined ? Number(adminBaseSalary) : 5000000.0,
          adminAktivPrice: adminAktivPrice !== undefined ? Number(adminAktivPrice) : 50000.0,
        },
      });

      return res.json({
        zamenaPrice: Number(updated.zamenaPrice),
        adminBaseSalary: Number(updated.adminBaseSalary),
        adminAktivPrice: Number(updated.adminAktivPrice),
      });
    } catch (error) {
      console.error('Update settings error:', error);
      return res.status(500).json({ error: 'Sozlamalarni saqlashda xatolik' });
    }
  }
);

export default router;
