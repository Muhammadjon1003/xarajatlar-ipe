import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Roles
  const rolesData = [
    { code: 'SUPER_ADMIN', displayName: 'Direktor' },
    { code: 'MANAGER', displayName: 'Menejer' },
    { code: 'ADMINISTRATOR', displayName: 'Administrator' },
    { code: 'TEACHER', displayName: 'O\'qituvchi' },
    { code: 'EXPENSE_CLERK', displayName: 'Xarajatlar Hisobchisi' },
    { code: 'PAYROLL_ACCOUNTANT', displayName: 'Oylik Hisobchisi' },
    { code: 'EMPLOYEE', displayName: 'Xodim' },
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { displayName: r.displayName },
      create: r,
    });
  }

  console.log('✅ Roles seeded');

  // 2. Seed Super Admin
  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });

  if (superAdminRole) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await prisma.employee.upsert({
      where: { phone: '+998901234567' },
      update: {
        passwordHash,
        roleId: superAdminRole.id,
        username: 'admin',
      },
      create: {
        firstName: 'Admin',
        lastName: 'Boshliq',
        username: 'admin',
        phone: '+998901234567',
        passwordHash,
        isActive: true,
        roleId: superAdminRole.id,
        defaultBaseSalary: 12000000.00,
      },
    });

    console.log('✅ Super Admin seeded (+998901234567 / admin123)');
  }

  // 3. Seed Branches
  const branches = ['Toshkent Bosh Ofis', 'Chilonzor Filiali', 'Yunusobod Filiali'];
  for (const bName of branches) {
    await prisma.branch.upsert({
      where: { name: bName },
      update: {},
      create: { name: bName },
    });
  }
  console.log('✅ Branches seeded');

  // 4. Seed Categories
  const categories = [
    { name: 'Kommunal Xarajatlar', description: 'Elektr, suv, gaz, internet' },
    { name: 'Ijara', description: 'Bino va xonalar ijarasi' },
    { name: 'Marketing & Reklama', description: 'SMM, Target, Bilbordlar' },
    { name: 'Ofis Jihozlari', description: 'Mebel, kompyuter va texnika' },
    { name: 'Kantselyariya', description: 'Qog‘oz, ruchka va ofis buxgalteriya inventari' },
    { name: 'Transport & Logistika', description: 'Yoqilg‘i va yetkazib berish' },
    { name: 'Boshqa Xarajatlar', description: 'Kutilmagan va turli xarajatlar' },
  ];

  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }
  console.log('✅ Expense Categories seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
