import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  ocrProvider: process.env.OCR_PROVIDER || 'tesseract',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
};
