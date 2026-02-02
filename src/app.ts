import express, { Express } from 'express';
import { logger } from './config/logger.js';
import { config } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import receiptsRoutes from './routes/receipts.routes.js';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`);
  next();
});

// Routes
app.use('/', healthRoutes);
app.use('/', receiptsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: unknown, req: express.Request, res: express.Response) => {
  logger.error(`[Error] ${err}`);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
