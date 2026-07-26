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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Xarajatlar & Oyliklar Backend Server running on port ${PORT}`);
});
