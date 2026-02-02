import express from 'express';
import { logger } from '../config/logger.js';

const router = express.Router();

router.get('/health', (req, res) => {
  logger.info('[Health] Health check');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
