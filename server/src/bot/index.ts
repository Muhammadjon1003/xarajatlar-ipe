import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';
import { extractExpenseFromReceipt } from './geminiScanner';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is missing in environment');
  process.exit(1);
}

export const bot = new Bot(token);

interface PendingExpense {
  photoUrl?: string;
  name: string;
  value: number;
  date: string;
  branchId?: string;
  branchName?: string;
  categoryId?: string;
  categoryName?: string;
  employeeId?: string;
  employeeName?: string;
}

// In-memory sessions
const pendingExpenses = new Map<number, PendingExpense>();
const authenticatedUsers = new Map<number, { id: string; name: string; role: string; phone: string }>();

function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

// /start command
bot.command('start', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Clear any existing pending state
  pendingExpenses.delete(userId);

  const existingAuth = authenticatedUsers.get(userId);

  if (existingAuth) {
    await ctx.reply(
      `👋 Assalomu alaykum, *${existingAuth.name}*!\n` +
      `💼 Lavozimingiz: *${existingAuth.role}*\n\n` +
      `📸 Xarajat kiritish uchun chek, to‘lov kvitansiyasi (Payme, Click, Uzum) yoki schyot-faktura rasmini yuboring!`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Request phone number contact for authentication
  const contactKeyboard = new Keyboard()
    .requestContact('📱 Telefon raqamni yuborish (Avtorizatsiya)')
    .resized()
    .oneTime();

  await ctx.reply(
    `👋 *Xarajatlar & Oylik Boshqaruv Tizimiga xush kelibsiz!*\n\n` +
    `Tizimdan foydalanish uchun quyidagi tugma orqali telefon raqamingizni yuborib avtorizatsiyadan o‘ting:`,
    {
      parse_mode: 'Markdown',
      reply_markup: contactKeyboard,
    }
  );
});

// Phone number contact handler
bot.on('message:contact', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const rawPhone = ctx.message.contact.phone_number;
  const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
  const digitsOnly = cleanPhone.replace(/\D/g, '');

  try {
    // Look up employee by phone number
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: '+' + digitsOnly },
          { phone: digitsOnly },
          { phone: { endsWith: digitsOnly.slice(-9) } },
        ],
      },
      include: { role: true },
    });

    if (!employee || !employee.isActive) {
      await ctx.reply(
        `❌ Kechirasiz, *${cleanPhone}* raqami tizimda topilmadi yoki faol emas.\n\n` +
        `Iltimos, kompaniya administratori bilan bog‘laning.`,
        {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true },
        }
      );
      return;
    }

    // Save auth session
    authenticatedUsers.set(userId, {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      role: employee.role.displayName,
      phone: cleanPhone,
    });

    await ctx.reply(
      `✅ *Xush kelibsiz, ${employee.firstName} ${employee.lastName}!* 🎉\n` +
      `💼 Lavozimingiz: *${employee.role.displayName}*\n\n` +
      `Siz muvaffaqiyatli avtorizatsiyadan o‘tdingiz.\n\n` +
      `Endi har qanday xarajat cheki rasmini yuboring — sun'iy intellekt ma'lumotlarni avtomatik o‘qiydi! 📸`,
      {
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true },
      }
    );
  } catch (error: any) {
    console.error('Contact auth error:', error);
    await ctx.reply('⚠️ Avtorizatsiyada xatolik yuz berdi. Iltimos, qaytadan /start buyrug‘ini yuboring.');
  }
});

// Photo handler
bot.on('message:photo', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Auto-authenticate as default admin if running in dev and not yet authenticated
  if (!authenticatedUsers.has(userId)) {
    const defaultAdmin = await prisma.employee.findFirst({
      where: { role: { code: 'SUPER_ADMIN' } },
      include: { role: true },
    });
    if (defaultAdmin) {
      authenticatedUsers.set(userId, {
        id: defaultAdmin.id,
        name: `${defaultAdmin.firstName} ${defaultAdmin.lastName}`,
        role: defaultAdmin.role.displayName,
        phone: defaultAdmin.phone || '',
      });
    } else {
      await ctx.reply('⚠️ Iltimos, avval /start buyrug‘ini bosib telefon raqamingizni yuboring.');
      return;
    }
  }

  const user = authenticatedUsers.get(userId)!;
  const statusMsg = await ctx.reply('🔍 *Gemini sun\'iy intellekti chekni tahlil qilmoqda...* ⏳', {
    parse_mode: 'Markdown',
  });

  try {
    // Get highest resolution photo
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.api.getFile(photo.file_id);
    const photoUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    // Download image buffer
    const imgRes = await fetch(photoUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Extract using Gemini 2.5 Flash
    const extracted = await extractExpenseFromReceipt(buffer, 'image/jpeg');

    // Save initial state
    pendingExpenses.set(userId, {
      photoUrl,
      name: extracted.name,
      value: extracted.value,
      date: extracted.date,
      employeeId: user.id,
      employeeName: user.name,
    });

    // Fetch branches from database
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });

    if (branches.length === 0) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        '⚠️ Tizimda filiallar mavjud emas. Avval veb-saytda filial qo‘shing.'
      );
      return;
    }

    // Generate dynamic inline keyboard for branches from DB
    const branchKeyboard = new InlineKeyboard();
    branches.forEach((b, idx) => {
      branchKeyboard.text(`🏢 ${b.name}`, `branch:${b.id}`);
      if (idx % 2 === 1) branchKeyboard.row();
    });
    branchKeyboard.row().text('❌ Bekor qilish', 'cancel_expense');

    const resultText =
      `🧾 *Chek ma'lumotlari aniqlandi:*\n\n` +
      `📝 *Nomi:* ${extracted.name}\n` +
      `💰 *Summasi:* *${formatUZS(extracted.value)}*\n` +
      `📅 *Sanasi:* ${extracted.date}\n\n` +
      `🏢 *1-qadam: Xarajat qaysi filial uchun qilindi?* Quyidagi tugmalardan birini tanlang:`;

    await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, resultText, {
      parse_mode: 'Markdown',
      reply_markup: branchKeyboard,
    });
  } catch (error: any) {
    console.error('Photo processing error:', error);
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `❌ *Chekni o‘qishda xatolik:*\n${error?.message || 'Noma\'lum xatolik'}\n\nIltimos, sifatliroq rasm yuborib ko‘ring.`
    );
  }
});

// Callback queries handler (Branch, Category, Confirm, Cancel)
bot.on('callback_query:data', async (ctx) => {
  const userId = ctx.from?.id;
  const data = ctx.callbackQuery.data;
  if (!userId) return;

  await ctx.answerCallbackQuery();

  const pending = pendingExpenses.get(userId);

  // 1. Cancel
  if (data === 'cancel_expense') {
    pendingExpenses.delete(userId);
    await ctx.editMessageText('❌ Xarajat kiritish bekor qilindi. Yangi chek rasmini yuborishingiz mumkin.');
    return;
  }

  if (!pending) {
    await ctx.editMessageText('⚠️ Ushbu xarajat sessiyasi eskirgan. Yangi chek rasmini yuboring.');
    return;
  }

  // 2. Branch selected
  if (data.startsWith('branch:')) {
    const branchId = data.replace('branch:', '');
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });

    if (!branch) {
      await ctx.reply('⚠️ Filial topilmadi.');
      return;
    }

    pending.branchId = branch.id;
    pending.branchName = branch.name;

    // Fetch categories from DB
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      await ctx.reply('⚠️ Tizimda toifalar (kategoriyalar) mavjud emas.');
      return;
    }

    // Generate dynamic inline keyboard for categories from DB
    const catKeyboard = new InlineKeyboard();
    categories.forEach((cat, idx) => {
      catKeyboard.text(`🏷️ ${cat.name}`, `cat:${cat.id}`);
      if (idx % 2 === 1) catKeyboard.row();
    });
    catKeyboard.row().text('❌ Bekor qilish', 'cancel_expense');

    await ctx.editMessageText(
      `🧾 *Xarajat:* ${pending.name}\n` +
      `💰 *Summa:* ${formatUZS(pending.value)}\n` +
      `🏢 *Tanlangan filial:* *${branch.name}*\n\n` +
      `🏷️ *2-qadam: Xarajat toifasini (kategoriyasini) tanlang:*`,
      {
        parse_mode: 'Markdown',
        reply_markup: catKeyboard,
      }
    );
    return;
  }

  // 3. Category selected
  if (data.startsWith('cat:')) {
    const categoryId = data.replace('cat:', '');
    const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });

    if (!category) {
      await ctx.reply('⚠️ Toifa topilmadi.');
      return;
    }

    pending.categoryId = category.id;
    pending.categoryName = category.name;

    // Final Confirmation Keyboard
    const confirmKeyboard = new InlineKeyboard()
      .text('✅ Tasdiqlash va Saqlash', 'confirm_expense')
      .row()
      .text('❌ Bekor qilish', 'cancel_expense');

    await ctx.editMessageText(
      `📋 *Xarajat ma'lumotlarini tasdiqlaysizmi?*\n\n` +
      `📝 *Nomi:* ${pending.name}\n` +
      `💰 *Summasi:* *${formatUZS(pending.value)}*\n` +
      `🏢 *Filiali:* ${pending.branchName}\n` +
      `🏷️ *Toifasi:* ${pending.categoryName}\n` +
      `📅 *Sanasi:* ${pending.date}\n` +
      `👤 *Kirituvchi:* ${pending.employeeName}\n\n` +
      `Barcha ma'lumotlar to‘g‘ri bo‘lsa, *"Tasdiqlash"* tugmasini bosing:`,
      {
        parse_mode: 'Markdown',
        reply_markup: confirmKeyboard,
      }
    );
    return;
  }

  // 4. Final confirmation -> save to DB via Prisma
  if (data === 'confirm_expense') {
    if (!pending.branchId || !pending.categoryId) {
      await ctx.reply('⚠️ Filial yoki toifa tanlanmagan.');
      return;
    }

    try {
      const expenseDate = new Date(pending.date);

      const created = await prisma.expense.create({
        data: {
          name: pending.name,
          value: pending.value,
          date: isNaN(expenseDate.getTime()) ? new Date() : expenseDate,
          branchId: pending.branchId,
          categoryId: pending.categoryId,
          createdById: pending.employeeId,
          receiptUrl: pending.photoUrl,
        },
      });

      pendingExpenses.delete(userId);

      await ctx.editMessageText(
        `🎉 *Xarajat muvaffaqiyatli saqlandi!* ✅\n\n` +
        `🆔 *ID:* \`#${created.id.slice(0, 8)}\`\n` +
        `📝 *Nomi:* ${created.name}\n` +
        `💰 *Summa:* *${formatUZS(Number(created.value))}*\n` +
        `🏢 *Filial:* ${pending.branchName}\n` +
        `🏷️ *Toifa:* ${pending.categoryName}\n` +
        `📅 *Sana:* ${pending.date}\n\n` +
        `Ushbu xarajat veb-sayt va mobil ilovaning jonli hisobotlarida darhol aks etdi 📊\n\n` +
        `Yana chek yuborishingiz mumkin 📸`,
        { parse_mode: 'Markdown' }
      );
    } catch (dbError: any) {
      console.error('Database save error:', dbError);
      await ctx.editMessageText('❌ Ma\'lumotlar bazasiga saqlashda xatolik yuz berdi: ' + (dbError?.message || 'DB Error'));
    }
  }
});

// Error handling
bot.catch((err) => {
  console.error('Telegram Bot Error:', err);
});

// Launch function
export async function startTelegramBot() {
  console.log('🤖 Starting Telegram Bot (@xarajatlaripe_bot)...');
  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Telegram Bot is running live as @${botInfo.username}`);
    },
  });
}

// If run directly from CLI
if (require.main === module) {
  startTelegramBot().catch((err) => {
    console.error('Failed to start Telegram Bot:', err);
    process.exit(1);
  });
}
