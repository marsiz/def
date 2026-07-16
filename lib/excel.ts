import * as XLSX from 'xlsx';

export interface ExcelColumn {
  key: string;
  label: string;
  width?: number;
  format?: 'currency' | 'date' | 'datetime' | 'number' | 'text';
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExcelColumn[],
  filename: string,
  sheetName: string = 'Sayfa1'
): void {
  const rows = data.map((item) => {
    const row: Record<string, any> = {};
    for (const col of columns) {
      const value = item[col.key];
      if (col.format === 'currency' && typeof value === 'number') {
        row[col.label] = formatCurrencyValue(value);
      } else if (col.format === 'date' && value) {
        row[col.label] = formatDateValue(value);
      } else if (col.format === 'datetime' && value) {
        row[col.label] = formatDateTimeValue(value);
      } else if (col.format === 'number' && typeof value === 'number') {
        row[col.label] = value;
      } else {
        row[col.label] = value ?? '';
      }
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = columns.map((col) => ({ wch: col.width || Math.max(col.label.length + 2, 15) }));
  (ws as any)['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const timestamp = new Date().toISOString().slice(0, 10);
  const finalFilename = filename.includes('.') ? filename : `${filename}_${timestamp}.xlsx`;
  XLSX.writeFile(wb, finalFilename, { bookType: 'xlsx', type: 'binary' });
}

export interface ImportResult<T> {
  success: T[];
  errors: { row: number; message: string }[];
  totalRows: number;
  successCount: number;
  errorCount: number;
  columns: string[];
}

export async function importFromExcel<T extends Record<string, any>>(
  file: File,
  columnMapping: Record<string, string>
): Promise<ImportResult<T>> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];

  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const success: T[] = [];
  const errors: { row: number; message: string }[] = [];

  const fileColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const mapped: Record<string, any> = {};

    let hasError = false;
    for (const [excelCol, modelField] of Object.entries(columnMapping)) {
      const value = row[excelCol];
      if (value === '' || value === undefined || value === null) {
        mapped[modelField] = null;
      } else {
        mapped[modelField] = value;
      }
    }

    if (!hasError) {
      success.push(mapped as T);
    } else {
      errors.push({ row: i + 2, message: 'Eksik veya hatalı veri' });
    }
  }

  return {
    success,
    errors,
    totalRows: rawData.length,
    successCount: success.length,
    errorCount: errors.length,
    columns: fileColumns,
  };
}

export function getExcelColumns(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    file.arrayBuffer().then((buffer) => {
      try {
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
        if (data.length > 0) {
          resolve(Object.keys(data[0]));
        } else {
          resolve([]);
        }
      } catch (err) {
        reject(err);
      }
    });
  });
}

function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateValue(value: string | Date): string {
  const date = new Date(value);
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTimeValue(value: string | Date): string {
  const date = new Date(value);
  return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
