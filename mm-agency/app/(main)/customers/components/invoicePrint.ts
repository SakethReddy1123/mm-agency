import type { Customer } from "./types";

export type InvoiceLine = {
  name: string;
  brand_name: string;
  qty: number;
  unitPrice: number;
  total: number;
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function openInvoicePrint(customer: Customer, lines: InvoiceLine[]): void {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const byBrand = lines.reduce<Record<string, InvoiceLine[]>>((acc, line) => {
    if (!acc[line.brand_name]) acc[line.brand_name] = [];
    acc[line.brand_name].push(line);
    return acc;
  }, {});

  let tableBody = "";
  let overall = 0;
  for (const [brandName, brandLines] of Object.entries(byBrand)) {
    let brandTotal = 0;
    tableBody += `<tr><td colspan="4" style="padding:8px;background:#f5f5f5;font-weight:bold;border:1px solid #ddd">${escapeHtml(brandName)}</td></tr>`;
    tableBody += `<tr><th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Product</th><th style="padding:6px 8px;border:1px solid #ddd">Qty</th><th style="padding:6px 8px;border:1px solid #ddd">Unit Price</th><th style="padding:6px 8px;border:1px solid #ddd">Total</th></tr>`;
    for (const line of brandLines) {
      brandTotal += line.total;
      overall += line.total;
      tableBody += `
          <tr>
            <td style="padding:6px 8px;border:1px solid #ddd">${escapeHtml(line.name)}</td>
            <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${line.qty}</td>
            <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${line.unitPrice.toFixed(2)}</td>
            <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${line.total.toFixed(2)}</td>
          </tr>`;
    }
    tableBody += `<tr><td colspan="3" style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-weight:bold">Subtotal (${escapeHtml(brandName)})</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-weight:bold">${brandTotal.toFixed(2)}</td></tr>`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${escapeHtml(customer.name)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 24px auto; padding: 16px; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #555; font-size: 0.9rem; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .total-row { font-size: 1.1rem; background: #f0f0f0; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>INVOICE</h1>
  <div class="meta">Date: ${date}</div>
  <div style="margin-bottom: 16px;">
    <strong>Bill To</strong><br>
    ${escapeHtml(customer.name)}<br>
    ${customer.phone ? escapeHtml(customer.phone) + "<br>" : ""}
    ${customer.address ? escapeHtml(customer.address) : ""}
  </div>
  <table>
    ${tableBody}
    <tr class="total-row"><td colspan="3" style="padding:10px 8px;border:1px solid #ddd;text-align:right;font-weight:bold">TOTAL</td><td style="padding:10px 8px;border:1px solid #ddd;text-align:right;font-weight:bold">${overall.toFixed(2)}</td></tr>
  </table>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 300);
}
