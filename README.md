# Mini Prosperia Challenge – For Interns 🎓

Welcome to the **Mini Prosperia Challenge**! This is a simplified internship-level challenge where you'll build a receipt OCR and data extraction system.

**Goal:** Upload receipt images/PDFs and extract key financial information using **Tesseract OCR** and basic text parsing.

---

## 📋 What You'll Build

You'll create a mini expense tracker that:

1. **Accepts image/PDF uploads** via a simple web UI
2. **Extracts text** from images using Tesseract OCR
3. **Parses structured data** like amounts, vendor names, and dates
4. **Displays results** in a clean format

**That's it!** No database, no AI relay, no complex integrations. Pure text extraction and parsing.

---

## 🎯 Core Tasks (marked with `TODO:` in code)

### 1. **Tesseract OCR Implementation** 
📁 `src/services/ocr.service.ts` → `TesseractOcr.extractText()`

Extract raw text from an image/PDF:
- Use `Tesseract.js` library
- Support languages: `eng+spa` (English + Spanish)
- Handle both images and PDFs
- Return the extracted text

**Hint:**
```typescript
const result = await Tesseract.recognize(imagePath, 'eng+spa');
return result.data.text;
```

---

### 2. **Receipt Data Parser**
📁 `src/services/parser.service.ts` → `ReceiptParser.parse()`

Extract structured data from raw OCR text:

```typescript
interface ReceiptData {
  rawText: string;              // Original extracted text
  amount?: number;              // Total amount (required)
  subtotalAmount?: number;      // Subtotal before tax
  taxAmount?: number;           // Tax amount
  taxPercentage?: number;       // Tax percentage (e.g., 10, 16)
  vendorName?: string;          // Store/vendor name
  invoiceNumber?: string;       // Invoice or receipt number
  date?: string;                // Date (any format is fine)
}
```

**Techniques you can use:**
- **Regular expressions** to find patterns:
  - `total.*?\$?([\d,]+\.?\d*)/i` → Match amounts
  - `invoice\s*#?\s*(\w+)/i` → Match invoice numbers
  - `\d{1,2}[/-]\d{1,2}[/-]\d{2,4}` → Match dates
  
- **Keyword matching:**
  - Look for "TOTAL", "SUBTOTAL", "TAX", "INVOICE", "VENDOR"
  
- **Heuristics:**
  - Largest amount = total
  - Vendor name usually at the top
  - Multiple numbers with currency = amounts

**Example approach:**
```typescript
const totalMatch = rawText.match(/total.*?\$?([\d,]+\.?\d*)/i);
if (totalMatch) {
  data.amount = parseFloat(totalMatch[1].replace(/,/g, ''));
}
```

---

### 3. **Receipt Upload Endpoint**
📁 `src/routes/receipts.routes.ts` → `POST /api/receipts`

Implement the file upload handler:

1. ✅ Validate that a file was uploaded
2. ✅ Check file type (only images/PDFs allowed)
3. 🔧 **TODO:** Extract text using OCR provider
4. 🔧 **TODO:** Parse the extracted text
5. 🔧 **TODO:** Store result with unique ID
6. ✅ Return the parsed data as JSON

**Response format:**
```json
{
  "id": "uuid-here",
  "filename": "receipt.jpg",
  "uploadedAt": "2024-01-15T10:30:00Z",
  "data": {
    "rawText": "...",
    "amount": 88.00,
    "vendorName": "Supermarket ABC",
    ...
  }
}
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or navigate to the project
cd prosperia-challenge-mini

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The server will start at `http://localhost:3000`

### Testing the API

**1. Via Web UI:**
- Open `http://localhost:3000` in your browser
- Upload a receipt image/PDF
- See the extracted data displayed

**2. Via cURL:**
```bash
curl -X POST http://localhost:3000/api/receipts \
  -F "file=@receipt.jpg"
```

**3. Via Postman:**
- POST to `http://localhost:3000/api/receipts`
- Body: form-data with key `file` and your image

---

## 📁 Project Structure

```
src/
  ├── config/
  │   ├── env.ts              # Environment variables
  │   └── logger.ts           # Logging setup
  ├── services/
  │   ├── ocr.service.ts      # Tesseract OCR (TODO)
  │   └── parser.service.ts   # Data extraction (TODO)
  ├── routes/
  │   ├── receipts.routes.ts  # Upload endpoint (TODO)
  │   └── health.routes.ts    # Health check
  ├── types/
  │   └── receipt.ts          # TypeScript interfaces
  ├── utils/
  │   └── errors.ts           # Error handling
  ├── app.ts                  # Express setup
  └── server.ts               # Server entry point

public/
  └── index.html              # Web UI

.env.example                  # Environment template
```

---

## 🔧 Available Providers

### OCR Provider
- **`tesseract`** (default) → Use real Tesseract OCR
- **`mock`** → Use fake OCR for testing (returns sample text)

Set via `.env`:
```
OCR_PROVIDER=tesseract
```

---

## ✅ Evaluation Criteria

Your implementation will be tested on:

1. **Accuracy** of extracted fields:
   - Can it find the total amount?
   - Does it identify the vendor?
   - Can it parse dates and invoice numbers?

2. **Code Quality:**
   - TypeScript types properly defined
   - Error handling implemented
   - Comments explaining complex logic
   - Logs for debugging

3. **Functionality:**
   - File upload works
   - OCR processes images correctly
   - Parser extracts data reliably
   - API returns proper JSON responses

4. **Robustness:**
   - Handles various receipt formats
   - Graceful error handling
   - Works with different languages (eng + spa)

---

## 🧪 Test Cases

We'll test your implementation with:

- Simple receipts (clear text, standard format)
- Complex receipts (multiple items, tax variations)
- Different languages (English, Spanish)
- Various file types (PNG, JPG, PDF)
- Edge cases (missing fields, unusual formats)

**Example receipt:** See `public/index.html` for sample extraction fields.

---

## 💡 Tips & Tricks

1. **Start with the mock OCR** to test the parser logic first
2. **Use regex to debug:** Test your patterns in online regex tools
3. **Log everything** during parsing to see what's being matched
4. **Handle edge cases:** What if an amount has commas? Different currency symbols?
5. **Test locally** with real receipt images from your drawer
6. **Don't overcomplicate:** Basic regex + heuristics usually work best

---

## 🚀 Bonus Features (Optional)

If you finish early, consider:

- ✨ Support for more fields (payment method, cashier name, etc.)
- ✨ Multi-receipt processing
- ✨ Download results as CSV/JSON
- ✨ Receipt history persistence (localStorage in UI)
- ✨ Better error messages
- ✨ Unit tests for the parser

---

## 📚 Resources

- [Tesseract.js Docs](https://github.com/naptha/tesseract.js)
- [RegExp Tester](https://regexr.com/)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🎓 Learning Outcomes

By completing this challenge, you'll learn:

- File upload handling in Node.js
- OCR technology with Tesseract
- Text parsing with regular expressions
- REST API design
- TypeScript for type safety
- Error handling and logging

---

## ❓ FAQ

**Q: Can I use AI/OpenAI?**  
A: Not for this challenge. This is about core parsing skills!

**Q: Can I use a database?**  
A: Not required. In-memory storage is fine.

**Q: What if I can't extract all fields?**  
A: That's okay! Extract what you can. Partial data is better than errors.

**Q: How do I handle PDFs?**  
A: Tesseract.js can handle PDFs natively. Just pass the file path.

**Q: Can I modify the UI?**  
A: Absolutely! Make it better if you want.

---

## 🎉 Good Luck!

You've got this! Start with the `TODO:` comments and work your way through. If you get stuck, check the hints and don't hesitate to experiment.

**Happy coding!** 🚀

---

**Questions?** Check the code comments and error logs. They're your friends!
