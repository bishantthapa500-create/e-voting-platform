import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';

import { connectDB } from './config/db';
import { globalLimiter } from './middleware/rateLimiter';
import { auditLogger } from './middleware/auditLogger';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import electionRoutes from './routes/electionRoutes';
import voteRoutes from './routes/voteRoutes';
import resultsRoutes from './routes/resultsRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — whitelist only the frontend origin ─────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'X-Report-Generated-At'],
  }),
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Sanitize MongoDB operators in req.body / req.query / req.params ───────────
app.use(mongoSanitize());

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Audit logging (all mutating requests) ────────────────────────────────────
app.use(auditLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admin', adminRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.json({ success: true, db: 'connected' });
  } else {
    res.status(500).json({ success: false, db: 'disconnected' });
  }
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
