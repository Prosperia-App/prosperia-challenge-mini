# Sample Receipts for Testing

This folder contains sample receipt images you can use to test your OCR implementation.

## What's included:

- `sample-receipt-1.txt` - Example simple receipt text
- `sample-receipt-2.txt` - Example complex receipt text

## How to use:

1. Create receipt images from these samples (use an image editor or print to PDF)
2. Upload them via the web UI to test your OCR
3. Verify the parsed data matches expectations

---

## Sample Receipt 1 (Simple)

```
SUPERMARKET ABC
123 Main Street
New York, NY 10001

Invoice #INV-2024-001234
Date: 2024-01-15

=====================================
Item 1: Regular Price $25.00
Item 2: Premium Price $45.00
Item 3: Basic Item   $10.00

Subtotal: $80.00
Tax (10%): $8.00
=====================================
TOTAL DUE: $88.00

Thank you for shopping!
```

Expected extraction:
- `vendorName`: "SUPERMARKET ABC"
- `invoiceNumber`: "INV-2024-001234"
- `date`: "2024-01-15"
- `subtotalAmount`: 80.00
- `taxAmount`: 8.00
- `taxPercentage`: 10
- `amount`: 88.00

---

## Sample Receipt 2 (Complex)

```
TIENDA DEPORTIVA "EL CAMPEÓN"
Avenida 5to 234
Bogotá, Colombia

RUC: 900123456-7

FACTURA #FC-2024-005678
Fecha: 15/01/2024 14:35

=====================================
DESCRIPCIÓN              CANTIDAD  VALOR
Nike Shoes (Black)            1   $120.00
Adidas Socks (Pack)           2    $15.00
Sport Water Bottle           1    $8.50
Gym Mat Premium              1    $45.00

SubTotal:                        $188.50
Descuento (5%):                  ($9.43)
Subtotal Descuento:             $179.07
IVA (16%):                       $28.65
=====================================
TOTAL:                          $207.72

Método de pago: Tarjeta Crédito
Transacción: 987654

¡Gracias por su compra!
```

Expected extraction:
- `vendorName`: "TIENDA DEPORTIVA EL CAMPEÓN"
- `invoiceNumber`: "FC-2024-005678"
- `date`: "15/01/2024" or "2024-01-15"
- `subtotalAmount`: 179.07
- `taxAmount`: 28.65
- `taxPercentage`: 16
- `amount`: 207.72

---

## Tips for Testing:

1. Start with Sample 1 (simpler patterns)
2. Move to Sample 2 (more complex layouts)
3. Test with real receipts from stores
4. Try different receipt formats to improve your parser robustness
