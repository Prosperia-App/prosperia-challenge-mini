import Tesseract from 'tesseract.js';
import { logger } from '../config/logger.js';

export interface OcrProvider {
  extractText(imagePath: string): Promise<string>;
}

export class TesseractOcr implements OcrProvider {
  async extractText(imagePath: string): Promise<string> {
    logger.info(`[OCR] Extracting text from ${imagePath} using Tesseract...`);

    try {
      // TODO: Implement Tesseract OCR extraction
      // 1. Use Tesseract.recognize() to process the image file
      // 2. Extract text from languages: 'eng+spa'
      // 3. Return the raw extracted text
      // 4. Handle errors appropriately
      //
      // Hint: Tesseract.recognize(imagePath, 'eng+spa').then(result => result.data.text)
      
      throw new Error('TODO: Implement Tesseract OCR extraction');
    } catch (error) {
      logger.error(`[OCR] Error extracting text: ${error}`);
      throw error;
    }
  }
}

export class MockOcr implements OcrProvider {
  async extractText(_imagePath: string): Promise<string> {
    logger.info('[OCR] Using mock OCR provider');
    // Return sample receipt text for testing
    return `SUPERMARKET ABC
    123 Main Street
    Invoice #INV-2024-001
    Date: 2024-01-15
    
    Item 1: $50.00
    Item 2: $30.00
    ─────────────────
    Subtotal: $80.00
    Tax (10%): $8.00
    ─────────────────
    TOTAL: $88.00
    
    Thank you for your purchase!`;
  }
}

export function getOcrProvider(provider: string): OcrProvider {
  if (provider === 'tesseract') {
    return new TesseractOcr();
  }
  return new MockOcr();
}
