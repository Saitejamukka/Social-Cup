import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import { authRoutes } from './routes/auth.js';
import { cafeRoutes } from './routes/cafes.js';
import { redemptionRoutes } from './routes/redemptions.js';
import { baristaRoutes } from './routes/barista.js';
import { adminRoutes } from './routes/admin.js';
import { reviewRoutes } from './routes/reviews.js';
import { startScheduledJobs } from './lib/jobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Social Cup API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cafes', cafeRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/barista', baristaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler — keeps stack traces out of API responses.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`☕ Social Cup Backend API running on http://localhost:${PORT}`);
  console.log(`📋 Health check available at: http://localhost:${PORT}/health`);
  startScheduledJobs();
});
