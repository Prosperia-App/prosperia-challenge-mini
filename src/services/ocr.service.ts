import { createWorker, PSM, OEM } from 'tesseract.js';
import { logger } from '../config/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface OcrProvider {
  extractText(filePath: string): Promise<string>;
}

export class TesseractOcr implements OcrProvider {
  async extractText(filePath: string): Promise<string> {
    logger.info(`[OCR] Extracting text from ${filePath} using Tesseract...`);

    try {
      await fs.access(filePath);
      const fileBuffer = await fs.readFile(filePath);
      // Check for PDF signature or extension
      const isPdf = filePath.toLowerCase().endsWith('.pdf') ||
        fileBuffer.slice(0, 5).toString() === '%PDF-' ||
        fileBuffer.slice(0, 4).toString() === '%PDF';

      let imagesToProcess: (string | Buffer)[] = [filePath];

      if (isPdf) {
        // Try pdf-parse first (faster and more reliable for digital PDFs)
        try {
          const pdfExtract = (await import('pdf-parse')).default;
          // @ts-ignore
          const data = await (typeof pdfExtract === 'function' ? pdfExtract(fileBuffer) : (pdfExtract as any)(fileBuffer));

          if (data.text && data.text.trim().length > 20) {
            logger.info(`[OCR] Extracted text from PDF using pdf-parse (${data.text.length} chars)`);
            return data.text;
          }
        } catch (e: any) {
          logger.warn(`[OCR] pdf-parse failed, falling back to OCR: ${e.message}`);
        }

        try {
          // Dynamic import to avoid issues if dependency is missing/problematic
          const { pdfToPng } = await import('pdf-to-png-converter');
          logger.info(`[OCR] Converting PDF to images: ${filePath}`);

          // Use memory conversion (no outputFolder) to avoid ENOENT issues
          const pngPages = await pdfToPng(fileBuffer, {
            viewportScale: 2.0,
            disableFontFace: true,
          });

          imagesToProcess = pngPages
            .map(page => page.content)
            .filter((content): content is Buffer => content !== null);

          logger.info(`[OCR] PDF converted to ${imagesToProcess.length} pages`);
        } catch (err: any) {
          logger.error(`[OCR] PDF conversion failed: ${err.message}`, { stack: err.stack });
          throw err;
        }
      }

      let fullText = '';

      // Initialize worker
      const worker = await createWorker('spa+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            logger.debug(`[Tesseract] Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      try {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,$-/%:áéíóúÁÉÍÓÚñÑ()#@ &',
        });

        for (const image of imagesToProcess) {
          const result = await worker.recognize(image);
          fullText += result.data.text + '\n\n';
        }
      } finally {
        await worker.terminate();
      }

      const cleanText = fullText.trim();
      if (!cleanText) {
        logger.warn(`[OCR] No text extracted from ${filePath}`);
      } else {
        logger.info(`[OCR] Extracted ${cleanText.length} chars`);
      }

      return cleanText;

    } catch (error: any) {
      logger.error(`[OCR] Error: ${error.message}`);
      throw error;
    }
  }
}

// Export TesseractOcr as default or named
