import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';
import { extractExpenseFromReceipt, extractExpenseFromText, parseExpenseFromCaption, ExtractedExpense } from './geminiScanner';

dotenv.config();

const DEFAULT_BOT_TOKEN = '8900984246:AAEZA3BPqzsFRadEt1wgwB6DcQfKRC0sLQQ';
const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const token =
  envToken && !envToken.includes('AAFs5_BMAVXZYgydv8y_GyM1hm8aIYNC9eQ')
    ? envToken
    : DEFAULT_BOT_TOKEN;

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
  waitingForNewCategory?: boolean;
}

// Database-backed sessions for Serverless persistence
async function getBotSession(userId: number): Promise<PendingExpense | null> {
  try {
    const session = await prisma.botSession.findUnique({
      where: { id: String(userId) },
    });
    if (!session || !session.data) return null;
    return session.data as unknown as PendingExpense;
  } catch (err) {
    console.error('getBotSession error:', err);
    return null;
  }
}

async function saveBotSession(userId: number, data: PendingExpense): Promise<void> {
  try {
    await prisma.botSession.upsert({
      where: { id: String(userId) },
      update: { data: data as any },
      create: { id: String(userId), data: data as any },
    });
  } catch (err) {
    console.error('saveBotSession error:', err);
  }
}

async function clearBotSession(userId: number): Promise<void> {
  try {
    await prisma.botSession.deleteMany({
      where: { id: String(userId) },
    });
  } catch (err) {
    console.error('clearBotSession error:', err);
  }
}

// Get or resolve authenticated employee
async function getAuthenticatedUser(userId: number): Promise<{ id: string; name: string; role: string; phone: string } | null> {
  try {
    // 1. Check if employee is permanently linked by telegramChatId in PostgreSQL
    const linked = await prisma.employee.findFirst({
      where: { telegramChatId: String(userId), isActive: true },
      include: { role: true },
    });
    if (linked) {
      return {
        id: linked.id,
        name: `${linked.firstName} ${linked.lastName}`,
        role: linked.role?.displayName || 'Xodim',
        phone: linked.phone || '',
      };
    }

    // 2. Fallback to Super Admin / Admin if not yet linked by contact
    const admin = await prisma.employee.findFirst({
      where: { role: { code: 'SUPER_ADMIN' }, isActive: true },
      include: { role: true },
    });
    if (admin) {
      return {
        id: admin.id,
        name: `${admin.firstName} ${admin.lastName}`,
        role: admin.role?.displayName || 'Admin',
        phone: admin.phone || '',
      };
    }

    return null;
  } catch (err) {
    console.error('getAuthenticatedUser error:', err);
    return null;
  }
}

function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

async function safeEditMessageText(ctx: any, text: string, options?: any) {
  try {
    await ctx.editMessageText(text, options);
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('message is not modified')) {
      return;
    }
    console.warn('safeEditMessageText failed, falling back to ctx.reply:', err?.message || err);
    try {
      await ctx.reply(text, options);
    } catch (replyErr) {
      console.error('safeEditMessageText fallback reply also failed:', replyErr);
    }
  }
}

// Deduplicate updates to prevent double processing from Telegram webhook retries
const processedUpdates = new Set<number>();
bot.use(async (ctx, next) => {
  if (ctx.update?.update_id) {
    const uid = ctx.update.update_id;
    if (processedUpdates.has(uid)) {
      console.log(`⚠️ Telegram duplicate update ${uid} ignored.`);
      return;
    }
    processedUpdates.add(uid);
    if (processedUpdates.size > 2000) {
      const first = processedUpdates.values().next().value;
      if (first !== undefined) processedUpdates.delete(first);
    }
  }
  await next();
});

// /start command
bot.command('start', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Clear any existing pending state
  await clearBotSession(userId);

  const existingAuth = await getAuthenticatedUser(userId);

  if (existingAuth) {
    await ctx.reply(
      `👋 Assalomu alaykum, *${existingAuth.name}*!\n` +
      `💼 Lavozimingiz: *${existingAuth.role}*\n\n` +
      `📸 Xarajat kiritish uchun chek yoki to‘lov kvitansiyasi rasmini yuboring!\n` +
      `✍️ Yoki oddiy matn ko‘rinishida yozib yuboring (masalan: *"Taksi 30000"*, *"Kantselyariya 150000"*).\n\n` +
      `💡 *Maslahat:* Rasm yuborayotganda izoh (caption) yozsangiz, o‘sha matn to‘g‘ridan-to‘g‘ri xarajat nomi sifatida olinadi.`,
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

    // Save telegramChatId permanently in DB
    await prisma.employee.update({
      where: { id: employee.id },
      data: { telegramChatId: String(userId) },
    });

    await ctx.reply(
      `✅ *Xush kelibsiz, ${employee.firstName} ${employee.lastName}!* 🎉\n` +
      `💼 Lavozimingiz: *${employee.role.displayName}*\n\n` +
      `Siz muvaffaqiyatli avtorizatsiyadan o‘tdingiz.\n\n` +
      `Endi har qanday xarajat cheki rasmini yoki xarajat matnini yuboring (masalan: *"Taksi 30000"*) — sun'iy intellekt ma'lumotlarni avtomatik o‘qiydi! 📸\n\n` +
      `💡 *Maslahat:* Rasm yuborayotganda izoh (caption) qismiga xarajat nomini yozsangiz, o‘sha nom to‘g‘ridan-to‘g‘ri qabul qilinadi.`,
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

  const user = await getAuthenticatedUser(userId);
  if (!user) {
    await ctx.reply('⚠️ Iltimos, avval /start buyrug‘ini bosib telefon raqamingizni yuboring.');
    return;
  }

  const userCaption = ctx.message.caption?.trim();
  const photos = ctx.message.photo;
  const highRes = photos[photos.length - 1];

  // Fast path: if caption already specifies name and amount (e.g. "Karam uchun 100000"), parse immediately in <1ms!
  const captionParsed = parseExpenseFromCaption(userCaption);

  let extracted: ExtractedExpense;
  let finalExpenseName: string;
  let photoUrl: string | undefined;

  try {
    const file = await ctx.api.getFile(highRes.file_id);
    photoUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    if (captionParsed) {
      extracted = captionParsed;
      finalExpenseName = captionParsed.name;
    } else {
      const statusMsg = await ctx.reply('🔍 *Chek tahlil qilinmoqda...* ⏳', {
        parse_mode: 'Markdown',
      });

      // Pick medium photo (~800px) for OCR to download 10x faster (<0.2s)
      const ocrPhoto = photos.length > 2 ? photos[Math.min(1, photos.length - 2)] : photos[0];
      const ocrFile = await ctx.api.getFile(ocrPhoto.file_id);
      const ocrUrl = `https://api.telegram.org/file/bot${token}/${ocrFile.file_path}`;

      const imgRes = await fetch(ocrUrl);
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      extracted = await extractExpenseFromReceipt(buffer, 'image/jpeg', userCaption);
      finalExpenseName = userCaption || extracted.name;

      // Delete temporary loading message
      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch (e) {
        // ignore
      }
    }

    // Save initial state to PostgreSQL!
    await saveBotSession(userId, {
      photoUrl,
      name: finalExpenseName,
      value: extracted.value,
      date: extracted.date,
      employeeId: user.id,
      employeeName: user.name,
      waitingForNewCategory: false,
    });

    // Fetch branches from database
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });

    if (branches.length === 0) {
      await ctx.reply('⚠️ Tizimda filiallar mavjud emas. Avval veb-saytda filial qo‘shing.');
      return;
    }

    // Generate dynamic inline keyboard for branches from DB
    const branchKeyboard = new InlineKeyboard();
    branches.forEach((b, idx) => {
      branchKeyboard.text(`🏢 ${b.name}`, `branch:${b.id}`);
      if (idx % 2 === 1) branchKeyboard.row();
    });
    branchKeyboard.row().text('❌ Bekor qilish', 'cancel_expense');

    const captionNotice = userCaption ? ` _(izohdan olindi)_` : '';

    const resultText =
      `🧾 *Chek ma'lumotlari aniqlandi:*\n\n` +
      `📝 *Nomi:* ${escapeMarkdown(finalExpenseName)}${captionNotice}\n` +
      `💰 *Summasi:* *${formatUZS(extracted.value)}*\n` +
      `📅 *Sanasi:* ${extracted.date}\n\n` +
      `🏢 *1-qadam: Xarajat qaysi filial uchun qilindi?* Quyidagi tugmalardan birini tanlang:`;

    await ctx.reply(resultText, {
      parse_mode: 'Markdown',
      reply_markup: branchKeyboard,
    });
  } catch (error: any) {
    console.error('Photo processing error:', error);
    await ctx.reply(
      `❌ *Chekni o‘qishda xatolik:*\n${error?.message || 'Noma\'lum xatolik'}\n\nIltimos, qayta urinib ko‘ring yoki sifatliroq rasm yuboring.`
    );
  }
});

// Callback queries handler (Branch, Category, Add Category, Confirm, Cancel)
bot.on('callback_query:data', async (ctx) => {
  const userId = ctx.from?.id;
  const data = ctx.callbackQuery.data;
  if (!userId) return;

  try {
    await ctx.answerCallbackQuery();
  } catch (e) {
    // Ignore expired or already answered callback queries
  }

  // 1. Cancel
  if (data === 'cancel_expense') {
    await clearBotSession(userId);
    await safeEditMessageText(ctx, '❌ Xarajat kiritish bekor qilindi. Yangi chek rasmini yoki xarajat matnini yuborishingiz mumkin.');
    return;
  }

  // Load session from PostgreSQL
  const pending = await getBotSession(userId);

  if (!pending) {
    await safeEditMessageText(ctx, '⚠️ Ushbu xarajat sessiyasi eskirgan yoki topilmadi. Yangi chek rasmini yoki xarajat matnini yuboring.');
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

    // Persist updated session to PostgreSQL
    await saveBotSession(userId, pending);

    // Fetch categories from DB
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });

    // Generate dynamic inline keyboard for categories from DB
    const catKeyboard = new InlineKeyboard();
    categories.forEach((cat, idx) => {
      catKeyboard.text(`🏷️ ${cat.name}`, `cat:${cat.id}`);
      if (idx % 2 === 1) catKeyboard.row();
    });

    // Requirement 2: Add "➕ Kategoriya qo'shish" button
    catKeyboard.row().text('➕ Kategoriya qo‘shish', 'add_new_category');
    catKeyboard.row().text('❌ Bekor qilish', 'cancel_expense');

    await safeEditMessageText(
      ctx,
      `🧾 *Xarajat:* ${escapeMarkdown(pending.name)}\n` +
      `💰 *Summa:* ${formatUZS(pending.value)}\n` +
      `🏢 *Tanlangan filial:* *${escapeMarkdown(branch.name)}*\n\n` +
      `🏷️ *2-qadam: Xarajat toifasini (kategoriyasini) tanlang:*`,
      {
        parse_mode: 'Markdown',
        reply_markup: catKeyboard,
      }
    );
    return;
  }

  // 3. User clicked "➕ Kategoriya qo'shish"
  if (data === 'add_new_category') {
    pending.waitingForNewCategory = true;
    await saveBotSession(userId, pending);
    await safeEditMessageText(
      ctx,
      `➕ *Yangi toifa (kategoriya) qo‘shish*\n\n` +
      `Iltimos, yangi kategoriya nomini xabar ko‘rinishida yozib yuboring:\n` +
      `_(Masalan: "Kantselyariya", "Ofis ta'miri", "Mebel", "Xo‘jalik mollari")_`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('❌ Bekor qilish', 'cancel_expense'),
      }
    );
    return;
  }

  // 4. Existing category selected
  if (data.startsWith('cat:')) {
    const categoryId = data.replace('cat:', '');
    const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });

    if (!category) {
      await ctx.reply('⚠️ Toifa topilmadi.');
      return;
    }

    pending.categoryId = category.id;
    pending.categoryName = category.name;
    pending.waitingForNewCategory = false;

    // Persist updated session to PostgreSQL
    await saveBotSession(userId, pending);

    // Final Confirmation Keyboard
    const confirmKeyboard = new InlineKeyboard()
      .text('✅ Tasdiqlash va Saqlash', 'confirm_expense')
      .row()
      .text('❌ Bekor qilish', 'cancel_expense');

    await safeEditMessageText(
      ctx,
      `📋 *Xarajat ma'lumotlarini tasdiqlaysizmi?*\n\n` +
      `📝 *Nomi:* ${escapeMarkdown(pending.name)}\n` +
      `💰 *Summasi:* *${formatUZS(pending.value)}*\n` +
      `🏢 *Filiali:* ${escapeMarkdown(pending.branchName || '')}\n` +
      `🏷️ *Toifasi:* ${escapeMarkdown(pending.categoryName || '')}\n` +
      `📅 *Sanasi:* ${pending.date}\n` +
      `👤 *Kirituvchi:* ${escapeMarkdown(pending.employeeName || 'Xodim')}\n\n` +
      `👇 *Diqqat:* Xarajat bazaga saqlanishi uchun *"✅ Tasdiqlash va Saqlash"* tugmasini bosing:`,
      {
        parse_mode: 'Markdown',
        reply_markup: confirmKeyboard,
      }
    );
    return;
  }

  // 5. Final confirmation -> save to DB via Prisma
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
          receiptUrl: pending.photoUrl || null,
        },
      });

      // Clear session from PostgreSQL!
      await clearBotSession(userId);

      await safeEditMessageText(
        ctx,
        `🎉 *Xarajat muvaffaqiyatli saqlandi!* ✅\n\n` +
        `🆔 *ID:* \`#${created.id.slice(0, 8)}\`\n` +
        `📝 *Nomi:* ${escapeMarkdown(created.name)}\n` +
        `💰 *Summa:* *${formatUZS(Number(created.value))}*\n` +
        `🏢 *Filial:* ${escapeMarkdown(pending.branchName || '')}\n` +
        `🏷️ *Toifa:* ${escapeMarkdown(pending.categoryName || '')}\n` +
        `📅 *Sana:* ${pending.date}\n\n` +
        `Ushbu xarajat veb-sayt va mobil ilovaning jonli hisobotlarida darhol aks etdi 📊\n\n` +
        `Yana yangi chek rasmini yoki matnli xarajatni yuborishingiz mumkin 📸`,
        { parse_mode: 'Markdown' }
      );
    } catch (dbError: any) {
      console.error('Database save error:', dbError);
      await safeEditMessageText(ctx, '❌ Ma\'lumotlar bazasiga saqlashda xatolik yuz berdi: ' + (dbError?.message || 'DB Error'));
    }
  }
});

// Text message handler (Handles new category input, text expenses, or general help)
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const rawText = ctx.message.text.trim();
  if (!rawText || rawText.startsWith('/')) return;

  const pending = await getBotSession(userId);

  // 1. If user is inputting a new category name
  if (pending && pending.waitingForNewCategory) {
    const rawCategoryName = rawText;

    try {
      // Find existing category (case-insensitive) or create new one in Prisma
      let category = await prisma.expenseCategory.findFirst({
        where: {
          name: {
            equals: rawCategoryName,
            mode: 'insensitive',
          },
        },
      });

      if (!category) {
        category = await prisma.expenseCategory.create({
          data: { name: rawCategoryName },
        });
      }

      pending.categoryId = category.id;
      pending.categoryName = category.name;
      pending.waitingForNewCategory = false;

      // Persist updated session to DB
      await saveBotSession(userId, pending);

      // Show confirmation card
      const confirmKeyboard = new InlineKeyboard()
        .text('✅ Tasdiqlash va Saqlash', 'confirm_expense')
        .row()
        .text('❌ Bekor qilish', 'cancel_expense');

      await ctx.reply(
        `✨ Yangi toifa tanlandi: *${category.name}*!\n\n` +
        `📋 *Xarajat ma'lumotlarini tasdiqlaysizmi?*\n\n` +
        `📝 *Nomi:* ${pending.name}\n` +
        `💰 *Summasi:* *${formatUZS(pending.value)}*\n` +
        `🏢 *Filiali:* ${pending.branchName}\n` +
        `🏷️ *Toifasi:* *${pending.categoryName}*\n` +
        `📅 *Sanasi:* ${pending.date}\n` +
        `👤 *Kirituvchi:* ${pending.employeeName || 'Xodim'}\n\n` +
        `👇 *Diqqat:* Xarajat bazaga saqlanishi uchun *"✅ Tasdiqlash va Saqlash"* tugmasini bosing:`,
        {
          parse_mode: 'Markdown',
          reply_markup: confirmKeyboard,
        }
      );
    } catch (err: any) {
      console.error('Error creating category:', err);
      await ctx.reply('⚠️ Yangi kategoriya saqlashda xatolik yuz berdi: ' + (err?.message || 'DB xatosi'));
    }
    return;
  }

  // 2. Check if the message is a text expense (e.g., "Taksi 30000" or "Kantselyariya 150000")
  const user = await getAuthenticatedUser(userId);
  if (!user) {
    await ctx.reply('⚠️ Iltimos, avval /start buyrug‘ini bosib telefon raqamingizni yuboring.');
    return;
  }

  const statusMsg = await ctx.reply('🔍 *Xarajat tahlil qilinmoqda...* ⏳', {
    parse_mode: 'Markdown',
  });

  try {
    const extracted = await extractExpenseFromText(rawText);

    if (extracted && extracted.value > 0) {
      // Save state in PostgreSQL
      await saveBotSession(userId, {
        name: extracted.name,
        value: extracted.value,
        date: extracted.date,
        employeeId: user.id,
        employeeName: user.name,
        waitingForNewCategory: false,
      });

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

      const branchKeyboard = new InlineKeyboard();
      branches.forEach((b, idx) => {
        branchKeyboard.text(`🏢 ${b.name}`, `branch:${b.id}`);
        if (idx % 2 === 1) branchKeyboard.row();
      });
      branchKeyboard.row().text('❌ Bekor qilish', 'cancel_expense');

      const resultText =
        `📝 *Xarajat ma'lumotlari aniqlandi:*\n\n` +
        `📌 *Nomi:* ${extracted.name}\n` +
        `💰 *Summasi:* *${formatUZS(extracted.value)}*\n` +
        `📅 *Sanasi:* ${extracted.date}\n\n` +
        `🏢 *1-qadam: Xarajat qaysi filial uchun qilindi?* Quyidagi tugmalardan birini tanlang:`;

      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, resultText, {
        parse_mode: 'Markdown',
        reply_markup: branchKeyboard,
      });
      return;
    }
  } catch (err) {
    console.warn('Text expense parsing error:', err);
  }

  // 3. If not an expense text, show helpful guidance
  await ctx.api.editMessageText(
    ctx.chat.id,
    statusMsg.message_id,
    `📸 *Xarajat kiritish uchun:*\n\n` +
    `1️⃣ Chek yoki kvitansiya rasmini yuboring\n` +
    `_yoki_\n` +
    `2️⃣ Matn ko‘rinishida yozing, masalan:\n` +
    `• \`Taksi 30000\`\n` +
    `• \`Ofis uchun kantselyariya 150000\`\n` +
    `• \`Obed 45000\``,
    { parse_mode: 'Markdown' }
  );
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
