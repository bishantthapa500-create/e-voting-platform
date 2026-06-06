import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    exposedHeaders: ['Content-Disposition', 'X-Report-Generated-At'],
  }),
);
app.use(helmet());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', async (_req, res) => {
  const { connection } = await import('mongoose');
  const state = connection.readyState;
  // 1 = connected
  if (state === 1) {
    res.json({ status: 'ok', db: 'connected' });
  } else {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
