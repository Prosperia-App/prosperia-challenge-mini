import app from './app.js';
import { logger } from './config/logger.js';
import { config } from './config/env.js';
import fs from 'fs/promises';

const startServer = async () => {
  try {
    // Create upload directory if it doesn't exist
    await fs.mkdir(config.uploadDir, { recursive: true });

    app.listen(config.port, () => {
      logger.info(`[Server] 🚀 Server running on http://localhost:${config.port}`);
      logger.info(`[Server] OCR Provider: ${config.ocrProvider}`);
      logger.info(`[Server] Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error(`[Server] Failed to start: ${error}`);
    process.exit(1);
  }
};

startServer();
