import { ReceiptData } from '../types/receipt.js';
import { logger } from '../config/logger.js';

export class ReceiptParser {
  /**
   * Parse raw OCR text to extract receipt information
   * Parse raw OCR text to extract receipt information
   */
  parse(rawText: string): ReceiptData {
    logger.info('[Parser] Parsing receipt data...');

    const cleanedText = this.cleanText(rawText);

    const data: ReceiptData = {
      rawText,
    };

    // 1. Extract Amount (Total)
    const totalMatch = cleanedText.match(/(?:total|pagar|importe|to?ta?l|tot).*?\$?([\d,]+\.?\d*)/i);
    if (totalMatch) {
      data.amount = this.parseCurrency(totalMatch[1]);
    } else {
      const allNumbersMatch = cleanedText.match(/[\d,]+\.?\d{2}/g);
      if (allNumbersMatch) {
        const prices = allNumbersMatch.map(n => this.parseCurrency(n));
        data.amount = Math.max(...prices);
      }
    }

    // Mejora: Búsqueda de moneda y formato específico
    const currencyMatch = cleanedText.match(/[\$\€\£]?\s*([\d,]+\.\d{2})/g);
    if (currencyMatch && !data.amount) {
      const amounts = currencyMatch.map(m => this.parseCurrency(m.replace(/[^\d.,]/g, '')));
      const maxAmount = Math.max(...amounts);
      if (maxAmount > 0) {
        data.amount = maxAmount;
      }
    }

    // 2. Extract Subtotal
    // Panama specific misreads: SUBTTL -> Cog, cog, cottl, subtt, sub ttl, btl
    const subtotalMatch = cleanedText.match(/(?:subtotal|sub-total|sub\s*total|base|neto|subttl|sub\s*ttl|cog|cottl|subtt|bi\s*ttl|btl).*?\$?\s*([\d,]+\.?\d*)/i);
    if (subtotalMatch) {
      data.subtotalAmount = this.parseCurrency(subtotalMatch[1]);
    }

    // 3. Extract Tax Amount
    // Panama misread: ITBMS -> T8MS, I7BMS, 1TBMS, ITBNS, T8NS, etc.
    const taxMatch = cleanedText.match(/(?:tax|impuesto|iva|itbms|t8ms|i7bms|1tbms|itbns|t8ns|vat|igv|imp)(?:\s+\d{1,2}%)?.*?\$?\s*([\d,]+\.?\d{2})/i);
    if (taxMatch) {
      data.taxAmount = this.parseCurrency(taxMatch[1]);
    }

    // 4. Extract Tax Percentage
    const taxPctMatch = cleanedText.match(/(?:tax|itbms|t8ms|iva|vat|imp).*?(\d{1,2}(?:\.\d+)?)%/i);
    if (taxPctMatch) {
      data.taxPercentage = parseFloat(taxPctMatch[1]);
    } else {
      // Fallback for isolated percentage
      const isoPctMatch = cleanedText.match(/(\d{1,2}(?:\.\d+)?)%/);
      if (isoPctMatch) {
        data.taxPercentage = parseFloat(isoPctMatch[1]);
      }
    }

    // 5. Extract Invoice Number
    // Relaxed regex to catch "Num", "Numero", "Doc", "Ticket" etc.
    // Matches: Label + (optional #) + (optional separator) + Value
    const invoiceMatch = cleanedText.match(/\b(?:invoice|factura|folio|ticket|ref|recibo|doc|número|numero|num|no|facturacion)\.?\s*#?[:\s]+(?!(?:electronica|vventa|fiscal|de|el|la|no|nro)\b)([a-z0-9-]{3,})/i);
    if (invoiceMatch) {
      data.invoiceNumber = invoiceMatch[1];
    }

    // Fallback for "Pto.Facturacion: 0001" or similar
    if (!data.invoiceNumber) {
      const ptoMatch = cleanedText.match(/(?:pto\.?\s*facturacion|sucursal).*?[:\s]+(\d+)/i);
      if (ptoMatch) {
        data.invoiceNumber = ptoMatch[1];
      }
    }

    // 6. Extract Date
    const dateMatch = cleanedText.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
    if (dateMatch) {
      data.date = dateMatch[0];
    }

    // NEW: Extract Cashier / Salesperson
    // Looks for "Cajero", "Atendido por", "Server", "Le atendio" followed by text or numbers
    let cashierName = '';
    const cashierMatch = cleanedText.match(/(?:cajero|atendido\s*por|server|le\s*atendio|user)\s*[:.]?\s*([a-z0-9\s.]+)/i);
    if (cashierMatch) {
      let cashierValue = cashierMatch[1].trim().split('\n')[0];

      // Cleanup: remove trailing single letters which are likely noise
      const parts = cashierValue.split(/\s+/);
      if (parts.length > 1 && /^\d+$/.test(parts[0]) && parts[1].length === 1) {
        cashierValue = parts[0];
      }

      if (cashierValue.length > 0) {
        cashierName = cashierValue;
      }
    }

    // 7. Extract Company Name (Fallback for Vendor)
    const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    // Keywords for lines that are DEFINITELY NOT the vendor name
    const noisyLineKeywords = /comprobante|auxiliar|factura|electronica|ticket|recibo|bienvenido|welcome|sucursal|ru[cn]|nit|telefono|cajero|vendedor|atendido|atendio|atención|atencion|fecha|hora|folio|terminal|punto|venta|pago|cambio|items|cant|prec|base|impu|unid|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|lun|mar|mie|jue|vie|sab|dom/i;

    // Business suffixes that usually indicate the company name
    const businessSuffixes = /\b(S\.?A\.?|CORP\.?|INC\.?|SRL\.?|LLC\.?|DE CV|S DE RL|SA CV)\b/i;

    let candidate = '';

    // First pass: Look for specific business identifiers (S.A., Inc, etc.)
    for (const line of lines.slice(0, 15)) {
      if (businessSuffixes.test(line) && !noisyLineKeywords.test(line)) {
        candidate = line;
        break;
      }
    }

    // Second pass: If "Emisor" exists
    if (!candidate) {
      const emisorIdx = lines.findIndex(l => /emisor|empresa|comercio/i.test(l));
      if (emisorIdx !== -1 && emisorIdx < 15) {
        candidate = lines[emisorIdx].replace(/emisor|empresa|comercio/i, '').trim();
        if (candidate.length < 3 && lines[emisorIdx + 1]) {
          candidate = lines[emisorIdx + 1];
        }
      }
    }

    // Third pass: Extract from very top if likely a big header
    if (!candidate) {
      candidate = this.extractVendorFromHeader(lines);
    }

    // Fourth pass: Traditional heuristic
    if (!candidate) {
      for (const line of lines.slice(0, 10)) {
        const letterCount = (line.match(/[a-z]/gi) || []).length;
        const digitCount = (line.match(/[0-9]/g) || []).length;
        const words = line.split(/\s+/);
        // const shortWords = words.filter(w => w.length === 1).length; // Unused

        if (!noisyLineKeywords.test(line) &&
          letterCount > 6 &&
          letterCount > digitCount) {
          candidate = line;
          break;
        }
      }
    }

    // LOGIC: Cashier takes priority as "Vendor Name" if found (per user request)
    // Otherwise use the Company Name
    if (cashierName) {
      data.vendorName = cashierName;
    } else {
      data.vendorName = candidate || (lines.length > 0 ? lines[0] : '-');

      // Cleanup Company Name
      if (data.vendorName && data.vendorName.length > 0) {
        const vendorCleanup = data.vendorName
          .replace(/^(?:EMISOR|EMPRESA|COMERCIO)[:\s]*/i, '')
          .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ.,&-]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();

        if (vendorCleanup.length > 2) {
          data.vendorName = vendorCleanup;
        }
      }
    }

    // 8. Smart Heuristic: Calculate missing values if possible
    if (data.amount && !data.subtotalAmount) {
      if (data.taxAmount) {
        data.subtotalAmount = Number((data.amount - data.taxAmount).toFixed(2));
      } else if (data.taxPercentage) {
        data.subtotalAmount = Number((data.amount / (1 + data.taxPercentage / 100)).toFixed(2));
        data.taxAmount = Number((data.amount - data.subtotalAmount).toFixed(2));
      }
    }

    // New Heuristic: Calculate tax percentage if missing
    if (data.subtotalAmount && data.taxAmount && !data.taxPercentage) {
      data.taxPercentage = Number(((data.taxAmount / data.subtotalAmount) * 100).toFixed(0));
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

  private extractVendorFromHeader(lines: string[]): string {
    const commonVendors = [
      /WALMART/i,
      /COSTCO/i,
      /AMAZON/i,
      /STARBUCKS/i,
      /MCDONALD/i,
      /SUPERMERCADO/i,
      /FARMACIA/i,
      /RESTAURANT/i
    ];

    for (const line of lines.slice(0, 5)) {
      for (const pattern of commonVendors) {
        if (pattern.test(line)) {
          return line.trim();
        }
      }
    }
    return '';
  }

  private cleanText(text: string): string {
    return text
      // Fix common business terms
      .replace(/ELECTRONEN/gi, 'ELECTRONICA')
      .replace(/RUC\s*[:.;]?\s*([0-9-]+)/gi, 'RUC: $1')
      .replace(/FACTURA\s*ELECTR?O?N?I?C?A?/gi, 'FACTURA ELECTRONICA')
      .replace(/BIEN\s*VENIDO/gi, 'BIENVENIDO')
      // Fix label variations
      .replace(/SUB\s*TTL/gi, 'SUBTOTAL')
      .replace(/TOTAL\s*A\s*PAGAR/gi, 'TOTAL')
      // Fix Tax OCR errors
      .replace(/[1lI]TBMS/g, 'ITBMS') // 1TBMS -> ITBMS
      .replace(/IT\s+BMS/g, 'ITBMS')
      // Fix Invoice Label Spacing
      .replace(/FACT\s+URA/gi, 'FACTURA')
      .replace(/NO\.\s+FEL/gi, 'No.') // Fix specific case likely seen in Janet receipt
      // Fix amounts confusing chars
      .replace(/([\d])\s+\./g, '$1.') // Fix space before dot in numbers
      .replace(/(\d)[lI](\d)/g, '$11$2') // l or I as 1 inside numbers
      .replace(/(\d)[O](\d)/g, '$10$2')  // O as 0 inside numbers
      // General cleanup
      .replace(/\r\n/g, '\n');
  }
}