import { ReceiptData } from '../types/receipt.js';
import { logger } from '../config/logger.js';

export class ReceiptParser {
  /**
   * Parse raw OCR text to extract receipt information
   * TODO: Implement basic parsing logic to extract:
   * - amount (total)
   * - subtotalAmount
   * - taxAmount
   * - taxPercentage
   * - vendorName
   * - invoiceNumber
   * - date
   * 
   * You can use:
   * 1. Regular expressions to find patterns (e.g., amounts with currency symbols)
   * 2. Keywords matching (e.g., "TOTAL", "SUBTOTAL", "TAX")
   * 3. Basic heuristics
   * 
   * Example: const totalMatch = rawText.match(/total[:\s]+[$]?([\d,]+\.?\d*)/i);
   */
  parse(rawText: string): ReceiptData {
    logger.info('[Parser] Parsing receipt data...');

    const data: ReceiptData = {
      rawText,
    };

    // 1. Extract Amount (Total)
    const totalMatch = rawText.match(/(?:total|pagar|importe).*?\$?([\d,]+\.?\d*)/i);
    if (totalMatch) {
      data.amount = this.parseCurrency(totalMatch[1]);
    } else {
      const allNumbersMatch = rawText.match(/[\d,]+\.?\d{2}/g);
      if (allNumbersMatch) {
        const prices = allNumbersMatch.map(n => this.parseCurrency(n));
        data.amount = Math.max(...prices);
      }
    }

    // 2. Extract Subtotal
    const subtotalMatch = rawText.match(/(?:subtotal|sub-total|sub\s*total).*?\$?([\d,]+\.?\d*)/i);
    if (subtotalMatch) {
      data.subtotalAmount = this.parseCurrency(subtotalMatch[1]);
    }

    // 3. Extract Tax Amount
    const taxMatch = rawText.match(/(?:tax|impuesto|iva|itbms|vat).*?\$?([\d,]+\.?\d*)/i);
    if (taxMatch) {
      data.taxAmount = this.parseCurrency(taxMatch[1]);
    }

    // 4. Extract Tax Percentage
    const taxPctMatch = rawText.match(/(\d{1,2}(?:\.\d+)?)%/);
    if (taxPctMatch) {
      data.taxPercentage = parseFloat(taxPctMatch[1]);
    }

    // 5. Extract Invoice Number
    const invoiceMatch = rawText.match(/(?:invoice|factura|folio|ticket).*?#?\s*([a-z0-9-]+)/i);
    if (invoiceMatch) {
      data.invoiceNumber = invoiceMatch[1];
    }

    // 6. Extract Date
    const dateMatch = rawText.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
    if (dateMatch) {
      data.date = dateMatch[0];
    }

    // 7. Extract Vendor Name
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0) {
      data.vendorName = lines[0];
    }

    return data;
  }

  private parseCurrency(value: string): number {
    // Remove all non-numeric except dot and comma
    const clean = value.replace(/[^0-9.,]/g, '');

    // Simple heuristic: replace comma with dot if it seems to be a decimal separator
    // If it has a comma but no dot, treat comma as decimal
    if (clean.includes(',') && !clean.includes('.')) {
      return parseFloat(clean.replace(',', '.'));
    }
    // If it has both, remove comma (thousands separator)
    return parseFloat(clean.replace(',', ''));
  }
}
