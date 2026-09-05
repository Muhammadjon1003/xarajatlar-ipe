import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import branchRoutes from './routes/branches';
import categoryRoutes from './routes/categories';
import expenseRoutes from './routes/expenses';
import employeeRoutes from './routes/employees';
import advanceRoutes from './routes/advances';
import shiftRoutes from './routes/shifts';
import salaryRoutes from './routes/salaries';
import analyticsRoutes from './routes/analytics';
import teacherGroupsRoutes from './routes/teacher-groups';
import adminAktivRoutes from './routes/admin-aktiv';
import settingsRoutes from './routes/settings';
import { webhookCallback } from 'grammy';
import { bot } from './bot';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 24/7 Telegram Cloud Webhook on Vercel
app.use('/api/telegram', webhookCallback(bot, 'express'));

// Endpoint to view or trigger webhook registration
app.get('/api/telegram-webhook/setup', async (_req, res) => {
  try {
    const webhookUrl = 'https://xarajatlar-ipe.vercel.app/api/telegram';
    await bot.api.setWebhook(webhookUrl, { drop_pending_updates: true });
    const info = await bot.api.getWebhookInfo();
    return res.json({ status: 'ok', message: 'Webhook muvaffaqiyatli o‘rnatildi', webhookUrl, info });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err?.message });
  }
});

app.get('/api/telegram-webhook/info', async (_req, res) => {
  try {
    const info = await bot.api.getWebhookInfo();
    return res.json(info);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/teacher-groups', teacherGroupsRoutes);
app.use('/api/admin-aktiv', adminAktivRoutes);
app.use('/api/admin-probniy', adminAktivRoutes); // Backward compatibility alias
app.use('/api/settings', settingsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Xarajatlar & Oyliklar Backend Server running on port ${PORT}`);
  });
}

export default app;
