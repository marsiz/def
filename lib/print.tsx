'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PrintColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export function printData<T extends Record<string, any>>(
  data: T[],
  columns: PrintColumn[],
  title: string,
  subtitle?: string,
  companyName?: string,
): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const tableHeaders = columns.map((c) => `<th>${c.label}</th>`).join('');
  const tableRows = data
    .map((row) => {
      const cells = columns
        .map((c) => {
          const value = row[c.key];
          const formatted = c.format ? c.format(value) : value ?? '';
          return `<td>${formatted}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const now = new Date().toLocaleString('tr-TR');

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; padding: 20px; }
    @page { size: A4; margin: 1.5cm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0; }
    .header-left h1 { font-size: 20px; font-weight: 700; }
    .header-left p { font-size: 12px; color: #666; margin-top: 4px; }
    .header-right { text-align: right; }
    .header-right p { font-size: 11px; color: #666; }
    .company { font-size: 14px; font-weight: 600; color: #333; }
    .subtitle { font-size: 13px; color: #555; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f5f5f5; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
    td { padding: 6px 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${companyName ? `<div class="company">${companyName}</div>` : ''}
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="header-right">
      <p>Yazdırma: ${now}</p>
      <p>Toplam Kayıt: ${data.length}</p>
    </div>
  </div>
  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    Marsiz ERP — ${now} tarihinde yazdırılmıştır
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>
  `);
  printWindow.document.close();
}

export function PrintButton<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  companyName,
}: {
  data: T[];
  columns: PrintColumn[];
  title: string;
  subtitle?: string;
  companyName?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => printData(data, columns, title, subtitle, companyName)}
    >
      <Printer className="h-4 w-4" />
      Yazdır
    </Button>
  );
}
